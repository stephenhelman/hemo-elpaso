import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auditData, type AuditValue } from "@/lib/audit";
import { CONSENT_TEXT_VERSION } from "@/content/consent";
import { recomputeHousehold } from "@/lib/households/sync";
import { planMerge, type MergeOptions, type MergePlan, type RecordSummary, type Db } from "./merge-plan";
import { unionList } from "./merge-rules";

export type MergeResult =
  | {
      ok: true; keptId: string; droppedId: string;
      moved: { rsvps: number; checkIns: number; consents: number; identities: number; boardRoles: number; invitations: number; members: number };
    }
  | { ok: false; status: number; error: string; candidates?: string[]; summaries?: RecordSummary[] };

export interface MergeRunOptions extends MergeOptions {
  /** From the preview. When given, the merge only runs if the plan is still exactly the one the officer confirmed. */
  expectFingerprint?: string;
}

class PlanChanged extends Error {}
class PlanRefused extends Error { constructor(public r: Extract<MergeResult, { ok: false }>) { super(r.error); } }

const NOW = () => new Date();
const ids = (rows: { id: string }[]) => rows.map((r) => r.id);

/**
 * Merge two person records (President/VP, canManageUsers).
 *
 * Everything the dropped record owns moves to the survivor (see merge-plan.ts for the conflict rules); the dropped
 * record is then scrubbed to a TOMBSTONE (role "merged", mergedIntoId, no personal data) instead of being deleted,
 * so audit history, old unsubscribe links and the Family/BoardRole FKs keep resolving. The retention job purges
 * tombstones 12 months after the merge.
 *
 * Consent records are append-only. They move through the database function merge_consent_records(), which opens a
 * transaction-local window in which ONLY patientId / recordedByBoardUserId may change. The trigger is never disabled.
 * Two records that BOTH carry a household need an explicit `keepId`. The settings-only admin account is never merged.
 *
 * ONE audit row (PATIENT_MERGED) lists every moved and dropped row by id (no names, emails or diagnoses).
 */
export async function mergePeople(aId: string, bId: string, actorId: string, keepId?: string | null, opts: Omit<MergeRunOptions, "keepId"> = {}): Promise<MergeResult> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        // Serialize concurrent merges touching either record.
        await tx.$queryRaw`SELECT id FROM patients WHERE id IN (${aId}, ${bId}) FOR UPDATE`;
        const planned = await planMerge(tx, aId, bId, { ...opts, keepId });
        if (!planned.ok) throw new PlanRefused(planned);
        if (opts.expectFingerprint && opts.expectFingerprint !== planned.plan.fingerprint) throw new PlanChanged();
        return apply(tx, planned.plan, actorId);
      },
      { timeout: 60_000, maxWait: 10_000 },
    );
  } catch (e) {
    if (e instanceof PlanRefused) return e.r;
    if (e instanceof PlanChanged) return { ok: false, status: 409, error: "plan_changed" };
    throw e;
  }
}

async function apply(tx: Prisma.TransactionClient, plan: MergePlan, actorId: string): Promise<MergeResult> {
  const { keepId, dropId, instructions: ins } = plan;
  const now = NOW();
  const keep = (await tx.patient.findUnique({ where: { id: keepId }, include: { contactProfile: true } }))!;
  const drop = (await tx.patient.findUnique({ where: { id: dropId }, include: { contactProfile: true } }))!;
  const audit: Record<string, AuditValue> = { keptId: keepId, droppedId: dropId };

  // ── RSVPs (before members, so attendee rows of a losing RSVP are gone before members are re-pointed) ──
  const rsvpDropped: AuditValue[] = [];
  for (const c of ins.rsvps.conflicts) {
    const loser = c.winner === "keep" ? c.dropId : c.keepId;
    await tx.rsvp.delete({ where: { id: loser } }); // attendees cascade; its QR / check-in link stops working (the winner's still works)
    rsvpDropped.push({ droppedId: loser, keptId: c.winner === "keep" ? c.keepId : c.dropId, eventId: c.eventId, rule: c.rule });
  }
  const rsvpMoveIds = [...ins.rsvps.move, ...ins.rsvps.conflicts.filter((c) => c.winner === "drop").map((c) => c.dropId)];
  if (rsvpMoveIds.length) await tx.rsvp.updateMany({ where: { id: { in: rsvpMoveIds } }, data: { patientId: keepId } });
  audit.rsvps = { moved: rsvpMoveIds, dropped: rsvpDropped };

  // ── check-ins ──
  const ciDropped: AuditValue[] = [];
  for (const c of ins.checkIns.conflicts) {
    const loser = c.winner === "keep" ? c.dropId : c.keepId;
    await tx.checkIn.delete({ where: { id: loser } });
    ciDropped.push({ droppedId: loser, keptId: c.winner === "keep" ? c.keepId : c.dropId, eventId: c.eventId });
    await tx.checkIn.update({ where: { id: c.winner === "keep" ? c.keepId : c.dropId }, data: { headcount: c.headcount } });
  }
  const ciMoveIds = [...ins.checkIns.move, ...ins.checkIns.conflicts.filter((c) => c.winner === "drop").map((c) => c.dropId)];
  if (ciMoveIds.length) await tx.checkIn.updateMany({ where: { id: { in: ciMoveIds } }, data: { patientId: keepId } });
  audit.checkIns = { moved: ciMoveIds, dropped: ciDropped };

  // ── invitations (removed ones included, so matching never re-adds a household an officer removed) ──
  const invDropped: AuditValue[] = [];
  for (const c of ins.invitations.conflicts) {
    const loser = c.winner === "keep" ? c.dropId : c.keepId;
    await tx.invitation.delete({ where: { id: loser } });
    invDropped.push({ droppedId: loser, keptId: c.winner === "keep" ? c.keepId : c.dropId, eventId: c.eventId, rule: c.rule });
  }
  const invMoveIds = [...ins.invitations.move, ...ins.invitations.conflicts.filter((c) => c.winner === "drop").map((c) => c.dropId)];
  if (invMoveIds.length) await tx.invitation.updateMany({ where: { id: { in: invMoveIds } }, data: { patientId: keepId } });
  audit.invitations = { moved: invMoveIds, dropped: invDropped };

  // ── household members ──
  const memberDropped: AuditValue[] = [];
  for (const p of ins.members.pairs) {
    const winnerId = p.winner === "keep" ? p.keepId : p.dropId;
    const loserId = p.winner === "keep" ? p.dropId : p.keepId;
    // attendance: re-point the loser's attendee rows (a row for the same RSVP on the winner already means "listed once")
    const rows = await tx.rsvpAttendee.findMany({ where: { householdMemberId: loserId }, select: { id: true, rsvpId: true, checkedInAt: true } });
    const winnerRows = new Map((await tx.rsvpAttendee.findMany({ where: { householdMemberId: winnerId }, select: { id: true, rsvpId: true, checkedInAt: true } })).map((r) => [r.rsvpId, r]));
    for (const r of rows) {
      const w = winnerRows.get(r.rsvpId);
      if (w) {
        if (r.checkedInAt && !w.checkedInAt) await tx.rsvpAttendee.update({ where: { id: w.id }, data: { checkedInAt: r.checkedInAt } });
        await tx.rsvpAttendee.delete({ where: { id: r.id } });
      } else await tx.rsvpAttendee.update({ where: { id: r.id }, data: { householdMemberId: winnerId } });
    }
    await tx.$queryRaw`SELECT merge_member_consents(${loserId}, ${winnerId})`;
    // a sign-in as the duplicate member, and guardian designations, follow the entry that is kept (deleting the loser would cascade them away)
    await tx.userIdentity.updateMany({ where: { householdMemberId: loserId }, data: { householdMemberId: winnerId } });
    for (const g of await tx.memberGuardianship.findMany({ where: { OR: [{ childMemberId: loserId }, { guardianMemberId: loserId }] } })) {
      const childMemberId = g.childMemberId === loserId ? winnerId : g.childMemberId;
      const guardianMemberId = g.guardianMemberId === loserId ? winnerId : g.guardianMemberId;
      const existing = childMemberId === guardianMemberId ? null : await tx.memberGuardianship.findUnique({ where: { childMemberId_guardianMemberId: { childMemberId, guardianMemberId } } });
      if (childMemberId === guardianMemberId || existing) await tx.memberGuardianship.delete({ where: { id: g.id } }); // the kept entry already has it
      else await tx.memberGuardianship.update({ where: { id: g.id }, data: { childMemberId, guardianMemberId } });
    }
    const mc = ins.memberConsents.find((m) => m.winnerId === winnerId && (m.keepMemberId === p.keepId));
    for (const r of mc?.resolutions.filter((x) => x.appendRefusal) ?? [])
      await tx.consentRecord.create({ data: { householdMemberId: winnerId, type: r.type, granted: false, textVersion: CONSENT_TEXT_VERSION, method: "merge", reasonCode: "MERGE", recordedByBoardUserId: actorId } });
    const [w, l] = await Promise.all([tx.householdMember.findUnique({ where: { id: winnerId } }), tx.householdMember.findUnique({ where: { id: loserId } })]);
    if (w && l && w.ageGroup !== "18_plus") await tx.householdMember.update({ where: { id: winnerId }, data: { statedDiagnoses: unionList(w.statedDiagnoses, l.statedDiagnoses) } }); // a minor's diagnoses (the parent answered for them)
    await tx.householdMember.delete({ where: { id: loserId } });
    memberDropped.push({ droppedId: loserId, keptId: winnerId });
    if (p.winner === "drop") await tx.householdMember.update({ where: { id: winnerId }, data: { patientId: keepId } });
  }
  if (ins.members.move.length) await tx.householdMember.updateMany({ where: { id: { in: ins.members.move } }, data: { patientId: keepId } });
  audit.members = { moved: [...ins.members.move, ...ins.members.pairs.filter((p) => p.winner === "drop").map((p) => p.dropId)], dropped: memberDropped };

  // RSVP party sizes follow the attendee rows
  for (const rsvpId of [...rsvpMoveIds, ...ins.rsvps.conflicts.filter((c) => c.winner === "keep").map((c) => c.keepId)]) {
    const [n, r] = await Promise.all([tx.rsvpAttendee.count({ where: { rsvpId } }), tx.rsvp.findUnique({ where: { id: rsvpId }, select: { guestCount: true } })]);
    if (r) await tx.rsvp.update({ where: { id: rsvpId }, data: { attendeeCount: n + r.guestCount } });
  }

  // ── consents: the ORIGINAL rows move (ids and dates intact) through the merge window ──
  const consentIds = ids(await tx.consentRecord.findMany({ where: { patientId: dropId }, select: { id: true } }));
  const recordedIds = ids(await tx.consentRecord.findMany({ where: { recordedByBoardUserId: dropId, patientId: { not: dropId } }, select: { id: true } }));
  await tx.$queryRaw`SELECT merge_consent_records(${dropId}, ${keepId})`;
  const refusals: string[] = [];
  for (const r of ins.consents.filter((x) => x.appendRefusal)) {
    const row = await tx.consentRecord.create({ data: { patientId: keepId, type: r.type, granted: false, textVersion: CONSENT_TEXT_VERSION, method: "merge", reasonCode: "MERGE", recordedByBoardUserId: actorId } });
    refusals.push(row.id);
  }
  audit.consents = { moved: consentIds, recordedByRepointed: recordedIds, refusalsAppended: refusals };

  // ── identities, board roles ──
  const identities = await tx.userIdentity.findMany({ where: { patientId: dropId }, select: { id: true, linkedVia: true } });
  for (const i of identities) {
    await tx.userIdentity.update({ where: { id: i.id }, data: { patientId: keepId, linkedVia: i.linkedVia === "backfill" ? "backfill" : "merge", linkedByPatientId: actorId } });
  }
  await tx.userIdentity.updateMany({ where: { linkedByPatientId: dropId }, data: { linkedByPatientId: keepId } });
  audit.identities = ids(identities);

  if (ins.boardRoles.move.length) await tx.boardRole.updateMany({ where: { id: { in: ins.boardRoles.move } }, data: { patientId: keepId } });
  for (const m of ins.boardRoles.merged) {
    const [k, d] = await Promise.all([tx.boardRole.findUnique({ where: { id: m.keepRoleId } }), tx.boardRole.findUnique({ where: { id: m.dropRoleId } })]);
    if (d?.active && k && !k.active) await tx.boardRole.update({ where: { id: k.id }, data: { active: true } });
    await tx.communicationLog.updateMany({ where: { boardRoleId: m.dropRoleId }, data: { boardRoleId: m.keepRoleId } });
    const onb = await tx.boardOnboarding.findUnique({ where: { boardRoleId: m.dropRoleId } });
    if (onb && !(await tx.boardOnboarding.findUnique({ where: { boardRoleId: m.keepRoleId } }))) await tx.boardOnboarding.update({ where: { id: onb.id }, data: { boardRoleId: m.keepRoleId } });
    await tx.boardRole.delete({ where: { id: m.dropRoleId } });
  }
  audit.boardRoles = { moved: ins.boardRoles.move, folded: ins.boardRoles.merged.map((m) => m.dropRoleId) };
  if ((await tx.boardRole.count({ where: { patientId: keepId, active: true } })) > 0 && keep.role !== "board" && keep.role !== "admin") await tx.patient.update({ where: { id: keepId }, data: { role: "board" } });

  // ── everything else the dropped record owned (history follows the household) ──
  const other: Record<string, number> = {};
  other.emailLogs = (await tx.emailLog.updateMany({ where: { patientId: dropId }, data: { patientId: keepId } })).count;
  other.communicationLogs = (await tx.communicationLog.updateMany({ where: { patientId: dropId }, data: { patientId: keepId } })).count;
  other.eventQuestions = (await tx.eventQuestion.updateMany({ where: { patientId: dropId }, data: { patientId: keepId } })).count;
  other.assistanceApplications = (await tx.financialAssistanceApplication.updateMany({ where: { patientId: dropId }, data: { patientId: keepId } })).count;
  other.legacyFamilyMembers = (await tx.familyMember.updateMany({ where: { patientId: dropId }, data: { patientId: keepId } })).count;
  other.familyMemberships = (await tx.familyMembership.updateMany({ where: { patientId: dropId }, data: { patientId: keepId } })).count;
  if (ins.other.preferences === "move") await tx.patientPreferences.update({ where: { patientId: dropId }, data: { patientId: keepId } });
  if (ins.other.volunteer === "move") await tx.volunteerProfile.update({ where: { patientId: dropId }, data: { patientId: keepId } });
  if (ins.other.family === "move") await tx.family.update({ where: { primaryPatientId: dropId }, data: { primaryPatientId: keepId } });
  // officers' own ids stored as plain strings
  await Promise.all([
    tx.emailRoute.updateMany({ where: { updatedBy: dropId }, data: { updatedBy: keepId } }),
    tx.rolePermission.updateMany({ where: { updatedBy: dropId }, data: { updatedBy: keepId } }),
    tx.featureFlag.updateMany({ where: { enabledBy: dropId }, data: { enabledBy: keepId } }),
    tx.appSetting.updateMany({ where: { updatedBy: dropId }, data: { updatedBy: keepId } }),
    tx.boardRole.updateMany({ where: { gmailConnectedBy: dropId }, data: { gmailConnectedBy: keepId } }),
    // what this person did as an actor now points at the survivor instead of going null
    tx.auditLog.updateMany({ where: { patientId: dropId }, data: { patientId: keepId } }),
    tx.invitation.updateMany({ where: { sentByBoardUserId: dropId }, data: { sentByBoardUserId: keepId } }),
    tx.invitation.updateMany({ where: { removedByBoardUserId: dropId }, data: { removedByBoardUserId: keepId } }),
  ]);
  audit.other = other;

  // ── contact details and scalars ──
  const kcp = keep.contactProfile, dcp = drop.contactProfile;
  if (kcp && dcp) {
    await tx.contactProfile.update({
      where: { id: kcp.id },
      data: {
        phone: ins.phone ?? null,
        addressLine1: kcp.addressLine1 ?? dcp.addressLine1, addressLine2: kcp.addressLine2 ?? dcp.addressLine2,
        city: kcp.city ?? dcp.city, state: kcp.state ?? dcp.state, zipCode: kcp.zipCode ?? dcp.zipCode, dateOfBirth: kcp.dateOfBirth ?? dcp.dateOfBirth,
      },
    });
    await tx.contactProfile.delete({ where: { id: dcp.id } });
  } else if (dcp && !kcp) {
    await tx.contactProfile.update({ where: { id: dcp.id }, data: { patientId: keepId, phone: ins.phone ?? dcp.phone } });
  }

  const earliest = (x: Date | null, y: Date | null) => (x && y ? (x < y ? x : y) : x ?? y);
  await tx.patient.update({
    where: { id: keepId },
    data: {
      email: ins.email.primary,
      emailOptOut: keep.emailOptOut || drop.emailOptOut, // an unsubscribe is never undone by a merge
      wantsToVolunteer: keep.wantsToVolunteer || drop.wantsToVolunteer,
      volunteerRequestedAt: earliest(keep.volunteerRequestedAt, drop.volunteerRequestedAt),
      registrationCompletedAt: earliest(keep.registrationCompletedAt, drop.registrationCompletedAt),
      consentDate: keep.consentDate ?? drop.consentDate,
      primaryDiagnoses: unionList(keep.primaryDiagnoses, drop.primaryDiagnoses),
      emergencyContactName: keep.emergencyContactName ?? drop.emergencyContactName,
      emergencyContactPhone: keep.emergencyContactPhone ?? drop.emergencyContactPhone,
      emergencyContactRelationship: keep.emergencyContactRelationship ?? drop.emergencyContactRelationship,
      diagnosisGracePeriodEndsAt: keep.diagnosisGracePeriodEndsAt ?? drop.diagnosisGracePeriodEndsAt,
      diagnosisGracePeriodSource: keep.diagnosisGracePeriodSource ?? drop.diagnosisGracePeriodSource,
    },
  });
  await recomputeHousehold(tx, keepId);

  // the other address stays a sign-in alias (matching only; never emailed). The dropped record's own aliases follow.
  const aliasSet = new Set<string>([...(ins.email.alias ? [ins.email.alias] : []), ...(await tx.patientAlias.findMany({ where: { patientId: dropId }, select: { email: true } })).map((a) => a.email)]);
  if (ins.email.primary) aliasSet.delete(ins.email.primary);
  await tx.patientAlias.deleteMany({ where: { patientId: dropId } });
  if (aliasSet.size) await tx.patientAlias.createMany({ data: Array.from(aliasSet).map((email) => ({ patientId: keepId, email, source: "merge" })), skipDuplicates: true });

  // ── duplicate bookkeeping ──
  await tx.patient.updateMany({ where: { possibleDuplicateOfId: dropId, id: { not: keepId } }, data: { possibleDuplicateOfId: keepId } });
  await tx.patient.update({ where: { id: keepId }, data: { possibleDuplicateOfId: null } });
  const dismissals = await tx.duplicateDismissal.findMany({ where: { OR: [{ patientAId: dropId }, { patientBId: dropId }] } });
  const carry = dismissals.map((d) => (d.patientAId === dropId ? d.patientBId : d.patientAId)).filter((x) => x !== keepId);
  await tx.duplicateDismissal.deleteMany({ where: { OR: [{ patientAId: dropId }, { patientBId: dropId }] } });
  if (carry.length) await tx.duplicateDismissal.createMany({ data: carry.map((x) => (x < keepId ? { patientAId: x, patientBId: keepId } : { patientAId: keepId, patientBId: x })), skipDuplicates: true });
  await tx.patient.updateMany({ where: { mergedIntoId: dropId }, data: { mergedIntoId: keepId } }); // earlier tombstones now point at the survivor

  // ── tombstone ──
  if (ins.other.preferences !== "none" && ins.other.preferences === "keep") await tx.patientPreferences.deleteMany({ where: { patientId: dropId } });
  if (ins.other.volunteer === "keep") await tx.volunteerProfile.deleteMany({ where: { patientId: dropId } });
  await tx.patient.update({
    where: { id: dropId },
    data: {
      role: "merged", mergedIntoId: keepId, mergedAt: now,
      email: null, auth0Id: null, possibleDuplicateOfId: null, familySize: 1,
      primaryDiagnoses: [], statedDiagnoses: [],
      emergencyContactName: null, emergencyContactPhone: null, emergencyContactRelationship: null,
      wantsToVolunteer: false, volunteerRequestedAt: null, registrationCompletedAt: null, consentDate: null,
      consentToContact: false, consentToPhotos: false, diagnosisGracePeriodEndsAt: null, diagnosisGracePeriodSource: null,
    },
  });

  const moved = {
    rsvps: rsvpMoveIds.length, checkIns: ciMoveIds.length, consents: consentIds.length, identities: identities.length,
    boardRoles: ins.boardRoles.move.length, invitations: invMoveIds.length, members: (audit.members as { moved: string[] }).moved.length,
  };
  audit.conflicts = plan.conflicts.map((c) => ({ kind: c.kind, rule: c.rule, keptId: c.ids?.keptId ?? null, droppedId: c.ids?.droppedId ?? null }));
  await tx.auditLog.create({
    data: auditData({
      actorType: "board", actorPatientId: actorId, action: AuditAction.PATIENT_MERGED, resourceType: "Patient", resourceId: keepId,
      details: `Merged ${dropId} into ${keepId}`, changes: { ...audit, counts: moved },
    }) as Prisma.AuditLogUncheckedCreateInput,
  });
  return { ok: true, keptId: keepId, droppedId: dropId, moved };
}

export type { Db };
