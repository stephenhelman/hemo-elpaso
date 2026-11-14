import { NextRequest, NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { auditPatient } from "@/lib/patients/audit";

/**
 * Merge a flagged duplicate into the OLDER of the two records.
 * POST /api/admin/patients/:id/merge   (:id = either record; the other is
 * `possibleDuplicateOfId` or body.otherId)
 *
 * Moves RSVPs and check-ins (skipping events both already have), copies consent
 * records (consent_records is append-only, so rows are re-inserted for the kept
 * patient with their original timestamps instead of UPDATEd), fills EMPTY
 * contact fields on the kept record, then hard-deletes the newer record.
 * Diagnoses are not combined or changed.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const a = await prisma.patient.findFirst({
    where: { id: params.id, ...PATIENT_ONLY },
    include: { contactProfile: true },
  });
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const otherId: string | null = body.otherId ?? a.possibleDuplicateOfId;
  const b = otherId
    ? await prisma.patient.findFirst({ where: { id: otherId, ...PATIENT_ONLY }, include: { contactProfile: true } })
    : null;
  if (!b) return NextResponse.json({ error: "No duplicate to merge with" }, { status: 400 });

  const [keep, drop] = a.createdAt <= b.createdAt ? [a, b] : [b, a];

  const result = await prisma.$transaction(async (tx) => {
    // RSVPs / check-ins: unique per (event, patient) — skip events the kept record already has
    const keptRsvpEvents = (await tx.rsvp.findMany({ where: { patientId: keep.id }, select: { eventId: true } })).map((r) => r.eventId);
    const keptCheckInEvents = (await tx.checkIn.findMany({ where: { patientId: keep.id }, select: { eventId: true } })).map((r) => r.eventId);
    const movedRsvps = await tx.rsvp.updateMany({
      where: { patientId: drop.id, eventId: { notIn: keptRsvpEvents } },
      data: { patientId: keep.id },
    });
    const movedCheckIns = await tx.checkIn.updateMany({
      where: { patientId: drop.id, eventId: { notIn: keptCheckInEvents } },
      data: { patientId: keep.id },
    });

    // Consents: append-only → copy with original timestamps (originals cascade away with `drop`)
    const consents = await tx.consentRecord.findMany({ where: { patientId: drop.id } });
    if (consents.length) {
      await tx.consentRecord.createMany({
        data: consents.map((c) => ({
          patientId: keep.id,
          type: c.type,
          granted: c.granted,
          textVersion: c.textVersion,
          method: c.method,
          recordedByBoardUserId: c.recordedByBoardUserId,
          createdAt: c.createdAt,
        })),
      });
    }

    // Fill gaps only
    if (!keep.email && drop.email) await tx.patient.update({ where: { id: keep.id }, data: { email: drop.email } });
    const kcp = keep.contactProfile, dcp = drop.contactProfile;
    if (kcp && dcp) {
      await tx.contactProfile.update({
        where: { id: kcp.id },
        data: {
          phone: kcp.phone ?? dcp.phone,
          addressLine1: kcp.addressLine1 ?? dcp.addressLine1,
        },
      });
    }

    // Anything flagged as a duplicate of the dropped row now points at the kept row
    await tx.patient.updateMany({
      where: { possibleDuplicateOfId: drop.id, id: { not: keep.id } },
      data: { possibleDuplicateOfId: keep.id },
    });
    await tx.patient.update({ where: { id: keep.id }, data: { possibleDuplicateOfId: null } });

    await tx.patient.delete({ where: { id: drop.id } });
    return { rsvps: movedRsvps.count, checkIns: movedCheckIns.count, consents: consents.length };
  });

  await auditPatient(
    admin!.id,
    AuditAction.PATIENT_MERGED,
    keep.id,
    `Merged duplicate ${drop.id} into ${keep.id} (moved ${result.rsvps} RSVPs, ${result.checkIns} check-ins; copied ${result.consents} consent records)`,
  );
  return NextResponse.json({ ok: true, keptId: keep.id });
}
