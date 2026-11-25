import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { isFeatureEnabled } from "@/lib/features";
import { formatEventDate, formatEventTime } from "@/lib/datetime";
import { matchPatientsForEvent } from "@/lib/invitations/match";
import { isCallOutcome, type AttendanceType, type CallOutcome } from "./request-rules";

/**
 * The call list: households with NO email who need their invitation or their confirmation by phone.
 * (Households with an email get emails.) It is the stopgap until the dialer exists; the dialer will write the same
 * invitation_call_logs rows (source "dialer").
 */
export interface CallListRow {
  patientId: string;
  name: string;
  phone: string;
  language: "en" | "es";
  familySize: number;
  purpose: "invitation" | "confirmation";
  attendanceType: AttendanceType;
  /** First names of adults still to confirm by phone. */
  confirmFor: string[];
  /** What to tell them, in THEIR language. Virtual links are included only when virtual is on and the household is virtual. */
  script: { kind: "in_person"; title: string; when: string; where: string } | { kind: "virtual"; title: string; when: string; meetUrl: string; youtubeUrl: string };
  lastCall: { outcome: CallOutcome; calledAt: string } | null;
}

export async function eventCallList(eventId: string, opts: { recordingsOn?: boolean } = {}): Promise<CallListRow[]> {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return [];
  const virtualOk = event.virtualEnabled && !!event.meetUrl && !!event.youtubeUrl && (opts.recordingsOn ?? (await isFeatureEnabled("recordings")));

  type Cand = { id: string; first: string; last: string; phone: string | null; lang: string; familySize: number; purpose: "invitation" | "confirmation"; type: AttendanceType; confirmFor: string[] };
  const cands = new Map<string, Cand>();
  const name = (p: { contactProfile: { firstName: string; lastName: string; phone: string | null } | null }) => ({ first: p.contactProfile?.firstName ?? "", last: p.contactProfile?.lastName ?? "" });

  // 1. matched, no email, never invited by email
  const m = await matchPatientsForEvent(eventId);
  for (const p of m?.callList ?? []) {
    if (p.email) continue;
    cands.set(p.id, { id: p.id, ...name(p), phone: p.contactProfile?.phone ?? null, lang: p.preferredLanguage, familySize: p.familySize, purpose: "invitation", type: "in_person", confirmFor: m?.confirmFor.get(p.id) ?? [] });
  }
  // 2. invited (any origin), no email, no RSVP yet
  const invs = await prisma.invitation.findMany({
    where: { eventId, status: { in: ["pending", "sent"] }, patient: { email: null, mergedIntoId: null } },
    include: { patient: { include: { contactProfile: true, householdMembers: true } } },
  });
  for (const i of invs) {
    cands.set(i.patientId, {
      id: i.patientId, ...name(i.patient), phone: i.patient.contactProfile?.phone ?? null, lang: i.patient.preferredLanguage, familySize: i.patient.familySize,
      purpose: "invitation", type: i.attendanceType === "virtual" && virtualOk ? "virtual" : "in_person",
      confirmFor: i.patient.householdMembers.filter((x) => x.status === "pending" && x.confirmByPhone && x.firstName).map((x) => x.firstName!),
    });
  }
  // 3. confirmed (a request the board confirmed, or any active RSVP of a no-email household that was never told): they need the confirmation by phone
  const confirmed = await prisma.rsvpRequest.findMany({
    where: { eventId, status: { in: ["confirmed_in_person", "confirmed_virtual"] }, patient: { email: null, mergedIntoId: null } },
    include: { patient: { include: { contactProfile: true } } },
  });
  for (const r of confirmed) {
    const rsvp = r.rsvpId ? await prisma.rsvp.findUnique({ where: { id: r.rsvpId }, select: { cancelledAt: true } }) : null;
    if (!rsvp || rsvp.cancelledAt) continue;
    cands.set(r.patientId, {
      id: r.patientId, ...name(r.patient), phone: r.patient.contactProfile?.phone ?? null, lang: r.patient.preferredLanguage, familySize: r.partySize,
      purpose: "confirmation", type: r.status === "confirmed_virtual" && virtualOk ? "virtual" : "in_person", confirmFor: [],
    });
  }

  const ids = Array.from(cands.keys());
  const logs = ids.length ? await prisma.invitationCallLog.findMany({ where: { eventId, patientId: { in: ids } }, orderBy: { calledAt: "desc" } }) : [];
  const last = new Map<string, (typeof logs)[number]>();
  for (const l of logs) if (!last.has(l.patientId)) last.set(l.patientId, l);

  const rows: CallListRow[] = [];
  for (const c of Array.from(cands.values())) {
    if (!c.phone) continue; // nothing to call
    const lang: "en" | "es" = c.lang === "es" ? "es" : "en";
    const title = lang === "es" ? event.titleEs : event.titleEn;
    const when = `${formatEventDate(event.eventDate, lang)}, ${formatEventTime(event.eventDate, lang)}`;
    const l = last.get(c.id);
    rows.push({
      patientId: c.id, name: `${c.first} ${c.last}`.trim() || "—", phone: c.phone, language: lang, familySize: c.familySize, purpose: c.purpose, attendanceType: c.type, confirmFor: c.confirmFor,
      script: c.type === "virtual" ? { kind: "virtual", title, when, meetUrl: event.meetUrl!, youtubeUrl: event.youtubeUrl! } : { kind: "in_person", title, when, where: event.location },
      lastCall: l && isCallOutcome(l.outcome) ? { outcome: l.outcome, calledAt: l.calledAt.toISOString() } : null,
    });
  }
  // Not yet reached first, then oldest call first.
  return rows.sort((a, b) => Number(a.lastCall?.outcome === "REACHED") - Number(b.lastCall?.outcome === "REACHED") || a.name.localeCompare(b.name));
}

/** The "called" button. Outcome is a code (no free text). Logged with ids only. */
export async function logCall(params: { eventId: string; patientId: string; purpose: unknown; outcome: unknown; adminId: string | null; source?: "manual" | "dialer"; providerCallId?: string | null }): Promise<{ ok: boolean; error?: string }> {
  if (!isCallOutcome(params.outcome)) return { ok: false, error: "Choose an outcome" };
  if (params.purpose !== "invitation" && params.purpose !== "confirmation") return { ok: false, error: "Bad purpose" };
  const [event, patient, inv] = await Promise.all([
    prisma.event.findUnique({ where: { id: params.eventId }, select: { id: true } }),
    prisma.patient.findUnique({ where: { id: params.patientId }, select: { id: true } }),
    prisma.invitation.findUnique({ where: { eventId_patientId: { eventId: params.eventId, patientId: params.patientId } }, select: { id: true } }),
  ]);
  if (!event || !patient) return { ok: false, error: "Not found" };
  const row = await prisma.invitationCallLog.create({
    data: { eventId: event.id, patientId: patient.id, invitationId: inv?.id ?? null, purpose: params.purpose, outcome: params.outcome, source: params.source ?? "manual", providerCallId: params.providerCallId ?? null, calledByPatientId: params.adminId },
  });
  await audit({
    actorType: params.adminId ? "board" : "system", actorPatientId: params.adminId, action: AuditAction.INVITATION_CALL_LOGGED, resourceType: "InvitationCallLog", resourceId: row.id,
    details: "Call logged", changes: { eventId: event.id, householdId: patient.id, invitationId: inv?.id ?? null, purpose: params.purpose, outcome: params.outcome },
  });
  return { ok: true };
}
