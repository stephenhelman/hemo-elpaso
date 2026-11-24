import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { recomputeHousehold } from "@/lib/households/sync";
import { HOUSEHOLD_EVIDENCE } from "@/lib/patients/query";
import { chooseSurvivor, type MergeChoice } from "./rules";

export type MergeResult =
  | { ok: true; keptId: string; droppedId: string; moved: { rsvps: number; checkIns: number; consents: number; identities: number; boardRoles: number } }
  | { ok: false; status: number; error: string; candidates?: string[] };

const REFUSAL: Record<Exclude<MergeChoice, { ok: true }>["error"], { status: number; error: string }> = {
  admin_record: { status: 409, error: "admin_record" },
  same_record: { status: 400, error: "same_record" },
  needs_keep_choice: { status: 409, error: "needs_keep_choice" },
  bad_keep: { status: 400, error: "bad_keep" },
};

/**
 * Merge two person records (President/VP, canManageUsers). Moves identities, board roles, consents, RSVPs, check-ins
 * and household members to the surviving record, then deletes the other. Two records that BOTH carry a household need
 * an explicit `keepId`: the officer confirms which household survives. The settings-only admin account is never
 * merged. The audit row holds ids and counts only.
 */
export async function mergePeople(aId: string, bId: string, actorId: string, keepId?: string | null): Promise<MergeResult> {
  const load = async (id: string) => {
    const p = await prisma.patient.findUnique({ where: { id }, include: { contactProfile: true } });
    if (!p) return null;
    const hasHousehold = (await prisma.patient.count({ where: { id, ...HOUSEHOLD_EVIDENCE } })) > 0;
    return { p, hasHousehold };
  };
  const [a, b] = await Promise.all([load(aId), load(bId)]);
  if (!a || !b) return { ok: false, status: 404, error: "not_found" };

  const choice = chooseSurvivor(
    { id: a.p.id, role: a.p.role, hasHousehold: a.hasHousehold, createdAt: a.p.createdAt },
    { id: b.p.id, role: b.p.role, hasHousehold: b.hasHousehold, createdAt: b.p.createdAt },
    keepId,
  );
  if (!choice.ok) {
    const refusal = REFUSAL[choice.error];
    return { ok: false, status: refusal.status, error: refusal.error, ...(choice.error === "needs_keep_choice" ? { candidates: [a.p.id, b.p.id] } : {}) };
  }

  const keep = choice.keepId === a.p.id ? a.p : b.p;
  const drop = choice.keepId === a.p.id ? b.p : a.p;

  const moved = await prisma.$transaction(async (tx) => {
    // RSVPs / check-ins: unique per (event, patient): skip events the kept record already has
    const keptRsvpEvents = (await tx.rsvp.findMany({ where: { patientId: keep.id }, select: { eventId: true } })).map((r) => r.eventId);
    const keptCheckInEvents = (await tx.checkIn.findMany({ where: { patientId: keep.id }, select: { eventId: true } })).map((r) => r.eventId);
    const rsvps = await tx.rsvp.updateMany({ where: { patientId: drop.id, eventId: { notIn: keptRsvpEvents } }, data: { patientId: keep.id } });
    const checkIns = await tx.checkIn.updateMany({ where: { patientId: drop.id, eventId: { notIn: keptCheckInEvents } }, data: { patientId: keep.id } });

    // Consents are append-only: copy with the original timestamps (the originals cascade away with `drop`)
    const consents = await tx.consentRecord.findMany({ where: { patientId: drop.id } });
    if (consents.length) {
      await tx.consentRecord.createMany({
        data: consents.map((c) => ({ patientId: keep.id, type: c.type, granted: c.granted, textVersion: c.textVersion, method: c.method, recordedByBoardUserId: c.recordedByBoardUserId, createdAt: c.createdAt })),
      });
    }
    await tx.householdMember.updateMany({ where: { patientId: drop.id }, data: { patientId: keep.id } });
    await recomputeHousehold(tx, keep.id);

    // Sign-in identities follow the person. Grandfathered ("backfill") ones keep that mark so officers don't lose access.
    const identities = await tx.userIdentity.findMany({ where: { patientId: drop.id }, select: { id: true, linkedVia: true } });
    for (const i of identities) {
      await tx.userIdentity.update({ where: { id: i.id }, data: { patientId: keep.id, linkedVia: i.linkedVia === "backfill" ? "backfill" : "merge", linkedByPatientId: actorId } });
    }

    // Board roles: (patientId, role) is unique, so a role both hold stays on the survivor (active if either was)
    const keepRoles = await tx.boardRole.findMany({ where: { patientId: keep.id } });
    const dropRoles = await tx.boardRole.findMany({ where: { patientId: drop.id } });
    let rolesMoved = 0;
    for (const r of dropRoles) {
      const same = keepRoles.find((k) => k.role === r.role);
      if (same) {
        if (r.active && !same.active) await tx.boardRole.update({ where: { id: same.id }, data: { active: true } });
      } else {
        await tx.boardRole.update({ where: { id: r.id }, data: { patientId: keep.id } });
        rolesMoved++;
      }
    }
    const activeRoles = await tx.boardRole.count({ where: { patientId: keep.id, active: true } });
    if (activeRoles > 0 && keep.role !== "board") await tx.patient.update({ where: { id: keep.id }, data: { role: "board" } });

    // Keep the trail: what this person did as an actor now points at the survivor instead of going null
    await tx.auditLog.updateMany({ where: { patientId: drop.id }, data: { patientId: keep.id } });
    await tx.invitation.updateMany({ where: { sentByBoardUserId: drop.id }, data: { sentByBoardUserId: keep.id } });
    await tx.invitation.updateMany({ where: { removedByBoardUserId: drop.id }, data: { removedByBoardUserId: keep.id } });
    await tx.consentRecord.updateMany({ where: { recordedByBoardUserId: drop.id, patientId: { not: drop.id } }, data: { recordedByBoardUserId: keep.id } });

    // Fill gaps only
    if (!keep.email && drop.email) await tx.patient.update({ where: { id: keep.id }, data: { email: drop.email } });
    const kcp = keep.contactProfile, dcp = drop.contactProfile;
    if (kcp && dcp) {
      await tx.contactProfile.update({ where: { id: kcp.id }, data: { phone: kcp.phone ?? dcp.phone, addressLine1: kcp.addressLine1 ?? dcp.addressLine1 } });
    }
    await tx.patient.updateMany({ where: { possibleDuplicateOfId: drop.id, id: { not: keep.id } }, data: { possibleDuplicateOfId: keep.id } });
    await tx.patient.update({ where: { id: keep.id }, data: { possibleDuplicateOfId: null } });

    await tx.patient.delete({ where: { id: drop.id } });

    const result = { rsvps: rsvps.count, checkIns: checkIns.count, consents: consents.length, identities: identities.length, boardRoles: rolesMoved };
    await tx.auditLog.create({
      data: auditData({
        actorType: "board", actorPatientId: actorId, action: AuditAction.PATIENT_MERGED, resourceType: "Patient", resourceId: keep.id,
        details: `Merged ${drop.id} into ${keep.id}`,
        changes: { keptId: keep.id, droppedId: drop.id, ...result },
      }) as Prisma.AuditLogUncheckedCreateInput,
    });
    return result;
  });

  return { ok: true, keptId: keep.id, droppedId: drop.id, moved };
}
