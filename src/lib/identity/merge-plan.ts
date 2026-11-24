import { createHash } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { HOUSEHOLD_EVIDENCE } from "@/lib/patients/query";
import { chooseSurvivor } from "./rules";
import {
  normEmail, pairMembers, pickCheckIn, pickInvitation, pickMember, pickRsvp, resolveConsents, resolveEmail, resolvePhone, unionList,
  type ConsentResolution, type ContactChoice,
} from "./merge-rules";

export type Db = PrismaClient | Prisma.TransactionClient;

export interface MergeOptions {
  keepId?: string | null;
  /** Which record's email / phone becomes primary when they differ (default: the survivor's). */
  primaryEmail?: ContactChoice;
  primaryPhone?: ContactChoice;
}

export type ConflictKind = "rsvp" | "check_in" | "invitation" | "member" | "consent" | "email" | "phone" | "diagnoses" | "preferences" | "volunteer" | "family";
export interface Conflict { kind: ConflictKind; label: string; kept: string | null; dropped: string | null; rule: string; ids?: { keptId?: string; droppedId?: string } }

export interface RecordSummary {
  id: string; name: string; email: string | null; phone: string | null; role: string; boardRoles: string[]; hasHousehold: boolean; createdAt: Date;
  counts: { members: number; rsvps: number; checkIns: number; invitations: number; consents: number; identities: number };
}

/** Everything the executor needs, as ids. Built once, shown in the preview, and re-built inside the transaction. */
export interface Instructions {
  rsvps: { move: string[]; conflicts: { eventId: string; keepId: string; dropId: string; winner: "keep" | "drop"; rule: string }[] };
  checkIns: { move: string[]; conflicts: { eventId: string; keepId: string; dropId: string; winner: "keep" | "drop"; headcount: number | null }[] };
  invitations: { move: string[]; conflicts: { eventId: string; keepId: string; dropId: string; winner: "keep" | "drop"; rule: string }[] };
  members: { move: string[]; pairs: { keepId: string; dropId: string; winner: "keep" | "drop" }[] };
  consents: ConsentResolution[];
  memberConsents: { keepMemberId: string; dropMemberId: string; winnerId: string; resolutions: ConsentResolution[] }[];
  email: { primary: string | null; alias: string | null };
  phone: string | null;
  identities: string[];
  boardRoles: { move: string[]; merged: { keepRoleId: string; dropRoleId: string }[] };
  invitationsSent: number;
  other: {
    emailLogs: number; communicationLogs: number; eventQuestions: number; assistanceApplications: number; legacyFamilyMembers: number; familyMemberships: number;
    preferences: "move" | "keep" | "none"; volunteer: "move" | "keep" | "none"; family: "move" | "keep_survivors" | "none";
  };
}

export interface MergePlan {
  keepId: string;
  dropId: string;
  keep: RecordSummary;
  drop: RecordSummary;
  moves: { label: string; count: number }[];
  conflicts: Conflict[];
  instructions: Instructions;
  /** Hash of everything above. The preview returns it; the confirm must send the same value, so the officer confirms what they saw. */
  fingerprint: string;
  needsHouseholdReview: boolean;
}

export type PlanResult =
  | { ok: true; plan: MergePlan }
  | { ok: false; status: number; error: string; candidates?: string[]; summaries?: RecordSummary[] };

const REFUSAL: Record<string, { status: number; error: string }> = {
  admin_record: { status: 409, error: "admin_record" },
  same_record: { status: 400, error: "same_record" },
  needs_keep_choice: { status: 409, error: "needs_keep_choice" },
  bad_keep: { status: 400, error: "bad_keep" },
};

const loadRecord = (db: Db, id: string) =>
  db.patient.findUnique({
    where: { id },
    include: {
      contactProfile: true,
      preferences: { select: { id: true } },
      volunteerProfile: { select: { id: true } },
      primaryOfFamily: { select: { id: true } },
      householdMembers: { include: { consentRecords: { select: { type: true, granted: true, createdAt: true } } } },
      rsvps: { include: { attendees: { select: { checkedInAt: true } } } },
      checkIns: true,
      invitations: true,
      consentRecords: { select: { id: true, type: true, granted: true, createdAt: true } },
      identities: { select: { id: true } },
      boardRoles: true,
      emailAliases: { select: { email: true } },
    },
  });
type Loaded = NonNullable<Awaited<ReturnType<typeof loadRecord>>>;

async function summarize(db: Db, p: Loaded): Promise<RecordSummary> {
  return {
    id: p.id,
    name: `${p.contactProfile?.firstName ?? ""} ${p.contactProfile?.lastName ?? ""}`.trim() || "—",
    email: p.email,
    phone: p.contactProfile?.phone ?? null,
    role: p.role,
    boardRoles: p.boardRoles.filter((r) => r.active).map((r) => r.role),
    hasHousehold: (await db.patient.count({ where: { id: p.id, ...HOUSEHOLD_EVIDENCE } })) > 0,
    createdAt: p.createdAt,
    counts: { members: p.householdMembers.length, rsvps: p.rsvps.length, checkIns: p.checkIns.length, invitations: p.invitations.length, consents: p.consentRecords.length, identities: p.identities.length },
  };
}

const stable = (v: unknown): string => JSON.stringify(v, (_k, x) => (x instanceof Date ? x.toISOString() : x));

/**
 * Work out a merge WITHOUT writing anything. Used for the preview and, again inside the transaction, to build the
 * instructions the executor follows. Personal data never leaves this function except the display fields on the
 * summaries (names, the two emails/phones the officer must choose between).
 */
export async function planMerge(db: Db, aId: string, bId: string, opts: MergeOptions = {}): Promise<PlanResult> {
  const [a, b] = await Promise.all([loadRecord(db, aId), loadRecord(db, bId)]);
  if (!a || !b) return { ok: false, status: 404, error: "not_found" };
  if (a.mergedIntoId || b.mergedIntoId) return { ok: false, status: 409, error: "already_merged" };
  const [sa, sb] = await Promise.all([summarize(db, a), summarize(db, b)]);

  const choice = chooseSurvivor(
    { id: a.id, role: a.role, hasHousehold: sa.hasHousehold, createdAt: a.createdAt },
    { id: b.id, role: b.role, hasHousehold: sb.hasHousehold, createdAt: b.createdAt },
    opts.keepId,
  );
  if (!choice.ok) {
    const r = REFUSAL[choice.error];
    return { ok: false, status: r.status, error: r.error, ...(choice.error === "needs_keep_choice" ? { candidates: [a.id, b.id], summaries: [sa, sb] } : {}) };
  }
  const keepIsA = choice.keepId === a.id;
  const keep = keepIsA ? a : b, drop = keepIsA ? b : a;
  const sk = keepIsA ? sa : sb, sd = keepIsA ? sb : sa;
  const conflicts: Conflict[] = [];

  // RSVPs
  const keepRsvp = new Map(keep.rsvps.map((r) => [r.eventId, r]));
  const rsvps: Instructions["rsvps"] = { move: [], conflicts: [] };
  for (const d of drop.rsvps) {
    const k = keepRsvp.get(d.eventId);
    if (!k) { rsvps.move.push(d.id); continue; }
    const facts = (r: typeof d) => ({ id: r.id, cancelled: !!r.cancelledAt, checkedIn: r.attendees.filter((x) => x.checkedInAt).length, attendees: r.attendeeCount, rsvpDate: r.rsvpDate });
    const pick = pickRsvp(facts(k), facts(d));
    rsvps.conflicts.push({ eventId: d.eventId, keepId: k.id, dropId: d.id, winner: pick.winner, rule: pick.rule });
    conflicts.push({ kind: "rsvp", label: "Both records have an RSVP for the same event", kept: pick.winner === "keep" ? "survivor's RSVP" : "other record's RSVP", dropped: pick.winner === "keep" ? "other record's RSVP" : "survivor's RSVP", rule: pick.rule, ids: { keptId: pick.winner === "keep" ? k.id : d.id, droppedId: pick.winner === "keep" ? d.id : k.id } });
  }

  // Check-ins
  const keepCi = new Map(keep.checkIns.map((c) => [c.eventId, c]));
  const checkIns: Instructions["checkIns"] = { move: [], conflicts: [] };
  for (const d of drop.checkIns) {
    const k = keepCi.get(d.eventId);
    if (!k) { checkIns.move.push(d.id); continue; }
    const pick = pickCheckIn(k, d);
    checkIns.conflicts.push({ eventId: d.eventId, keepId: k.id, dropId: d.id, winner: pick.winner, headcount: pick.headcount });
    conflicts.push({ kind: "check_in", label: "Both records checked in to the same event", kept: "earlier check-in", dropped: "later check-in", rule: "earlier_check_in_larger_headcount", ids: { keptId: pick.winner === "keep" ? k.id : d.id, droppedId: pick.winner === "keep" ? d.id : k.id } });
  }

  // Invitations (removed ones included: a removal is never lost)
  const keepInv = new Map(keep.invitations.map((i) => [i.eventId, i]));
  const invitations: Instructions["invitations"] = { move: [], conflicts: [] };
  for (const d of drop.invitations) {
    const k = keepInv.get(d.eventId);
    if (!k) { invitations.move.push(d.id); continue; }
    const pick = pickInvitation(k, d);
    invitations.conflicts.push({ eventId: d.eventId, keepId: k.id, dropId: d.id, winner: pick.winner, rule: pick.rule });
    conflicts.push({ kind: "invitation", label: `Both records have an invitation for the same event (${k.status} / ${d.status})`, kept: pick.winner === "keep" ? k.status : d.status, dropped: pick.winner === "keep" ? d.status : k.status, rule: pick.rule, ids: { keptId: pick.winner === "keep" ? k.id : d.id, droppedId: pick.winner === "keep" ? d.id : k.id } });
  }

  // Household members: same name + age group is the same person
  const { pairs, unmatched } = pairMembers(keep.householdMembers, drop.householdMembers);
  const byId = new Map([...keep.householdMembers, ...drop.householdMembers].map((m) => [m.id, m]));
  const members: Instructions["members"] = { move: unmatched.map((m) => m.id), pairs: [] };
  const memberConsents: Instructions["memberConsents"] = [];
  for (const p of pairs) {
    const km = byId.get(p.keepId)!, dm = byId.get(p.dropId)!;
    const winner = pickMember(km, dm);
    members.pairs.push({ ...p, winner });
    const winnerId = winner === "keep" ? km.id : dm.id;
    memberConsents.push({ keepMemberId: km.id, dropMemberId: dm.id, winnerId, resolutions: resolveConsents(km.consentRecords, dm.consentRecords) });
    conflicts.push({ kind: "member", label: `Same household member on both records (${km.firstName ?? "—"}${km.lastName ? " " + km.lastName : ""}, ${km.ageGroup.replace("_", "–")})`, kept: winner === "keep" ? `survivor's entry (${km.status})` : `other record's entry (${dm.status})`, dropped: "the duplicate entry (attendance and consents move to the one kept)", rule: "same_name_and_age_group", ids: { keptId: winnerId, droppedId: winner === "keep" ? dm.id : km.id } });
  }

  // Consents: every row is kept; the effective value is the most restrictive
  const consents = resolveConsents(keep.consentRecords, drop.consentRecords);
  for (const c of consents.filter((x) => x.conflict)) {
    conflicts.push({ kind: "consent", label: `Consent "${c.type}" differs: survivor ${yn(c.keep)}, other ${yn(c.drop)}`, kept: yn(c.result), dropped: null, rule: c.appendRefusal ? "most_restrictive_wins_refusal_recorded" : "most_restrictive_wins" });
  }

  // Contact details
  const email = resolveEmail(keep.email, drop.email, opts.primaryEmail);
  if (email.conflict) conflicts.push({ kind: "email", label: "The two records have different emails", kept: email.primary, dropped: email.alias, rule: "primary_by_choice_other_kept_as_sign_in_alias" });
  const keepPhone = keep.contactProfile?.phone ?? null, dropPhone = drop.contactProfile?.phone ?? null;
  const phone = resolvePhone(keepPhone, dropPhone, opts.primaryPhone);
  if (phone.conflict) conflicts.push({ kind: "phone", label: "The two records have different phone numbers", kept: phone.primary, dropped: phone.primary === keepPhone ? dropPhone : keepPhone, rule: "primary_by_choice_other_discarded" });

  // Diagnoses: union of the primary's own. Reported without values.
  if (unionList(keep.primaryDiagnoses, drop.primaryDiagnoses).length !== keep.primaryDiagnoses.length)
    conflicts.push({ kind: "diagnoses", label: "The primary person's stated information differs; the merged record holds both", kept: null, dropped: null, rule: "union" });

  // One-per-person tables
  const preferences = !drop.preferences ? "none" : keep.preferences ? "keep" : "move";
  if (preferences === "keep") conflicts.push({ kind: "preferences", label: "Both records have preferences", kept: "survivor's", dropped: "other's", rule: "survivor_wins" });
  const volunteer = !drop.volunteerProfile ? "none" : keep.volunteerProfile ? "keep" : "move";
  if (volunteer === "keep") conflicts.push({ kind: "volunteer", label: "Both records have a volunteer profile", kept: "survivor's", dropped: "other's", rule: "survivor_wins" });
  const family = !drop.primaryOfFamily ? "none" : keep.primaryOfFamily ? "keep_survivors" : "move";
  if (family === "keep_survivors") conflicts.push({ kind: "family", label: "Both records head a legacy family group", kept: "survivor's", dropped: "other's stays on the tombstone", rule: "survivor_wins" });

  // Board roles: (patientId, role) is unique
  const keepRoles = new Map(keep.boardRoles.map((r) => [r.role, r]));
  const boardRoles: Instructions["boardRoles"] = { move: [], merged: [] };
  for (const r of drop.boardRoles) {
    const same = keepRoles.get(r.role);
    if (same) boardRoles.merged.push({ keepRoleId: same.id, dropRoleId: r.id }); else boardRoles.move.push(r.id);
  }

  const [emailLogs, communicationLogs, eventQuestions, assistanceApplications, legacyFamilyMembers, familyMemberships] = await Promise.all([
    db.emailLog.count({ where: { patientId: drop.id } }),
    db.communicationLog.count({ where: { patientId: drop.id } }),
    db.eventQuestion.count({ where: { patientId: drop.id } }),
    db.financialAssistanceApplication.count({ where: { patientId: drop.id } }),
    db.familyMember.count({ where: { patientId: drop.id } }),
    db.familyMembership.count({ where: { patientId: drop.id } }),
  ]);

  const instructions: Instructions = {
    rsvps, checkIns, invitations, members, consents, memberConsents,
    email: { primary: email.primary, alias: email.alias },
    phone: phone.primary,
    identities: drop.identities.map((i) => i.id),
    boardRoles,
    invitationsSent: drop.invitations.length,
    other: { emailLogs, communicationLogs, eventQuestions, assistanceApplications, legacyFamilyMembers, familyMemberships, preferences, volunteer, family },
  };

  const moves = [
    { label: "RSVPs", count: rsvps.move.length },
    { label: "Check-ins", count: checkIns.move.length },
    { label: "Invitations (including removed ones)", count: invitations.move.length },
    { label: "Household members", count: members.move.length },
    { label: "Consent records (original rows, original dates)", count: drop.consentRecords.length },
    { label: "Sign-in identities", count: drop.identities.length },
    { label: "Board roles", count: boardRoles.move.length },
    { label: "Email history", count: emailLogs },
    { label: "Assistance applications, messages and questions", count: assistanceApplications + communicationLogs + eventQuestions + legacyFamilyMembers + familyMemberships },
  ].filter((m) => m.count > 0);

  const base = { keepId: keep.id, dropId: drop.id, instructions, opts: { e: opts.primaryEmail ?? "survivor", p: opts.primaryPhone ?? "survivor" }, emailPair: [normEmail(keep.email), normEmail(drop.email)], u: [keep.updatedAt, drop.updatedAt] };
  return {
    ok: true,
    plan: {
      keepId: keep.id, dropId: drop.id, keep: sk, drop: sd, moves, conflicts, instructions,
      fingerprint: createHash("sha256").update(stable(base)).digest("hex").slice(0, 32),
      needsHouseholdReview: sk.hasHousehold && sd.hasHousehold,
    },
  };
}

const yn = (v: boolean | null) => (v === null ? "never recorded" : v ? "yes" : "no");
