import { NextRequest, NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { validatePatientInput } from "@/lib/patients/create";
import { currentConsents, PATIENT_ONLY } from "@/lib/patients/query";
import { auditPatient } from "@/lib/patients/audit";
import { CONSENT_TEXT_VERSION } from "@/content/consent";

type Ctx = { params: { id: string } };

const load = (id: string) =>
  prisma.patient.findFirst({
    where: { id, ...PATIENT_ONLY },
    include: { contactProfile: true, consentRecords: true },
  });

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;

  const existing = await load(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const v = validatePatientInput(body, { requireConsent: false });
  if (!v.ok) {
    return NextResponse.json({ error: "invalid", field: v.field }, { status: 400 });
  }
  const n = v.value;
  const canPHI = admin!.can("canViewPHI");

  const changed: string[] = [];
  const cp = existing.contactProfile;
  if (cp?.firstName !== n.firstName || cp?.lastName !== n.lastName) changed.push("name");
  if (existing.email !== n.email) changed.push("email");
  if ((cp?.phone ?? null) !== n.phone) changed.push("phone");
  if ((cp?.addressLine1 ?? null) !== n.address) changed.push("address");
  if (existing.preferredLanguage !== n.language) changed.push("language");
  if (existing.familySize !== n.familySize) changed.push("familySize");
  const sameDx =
    existing.statedDiagnoses.length === n.diagnoses.length &&
    existing.statedDiagnoses.every((d) => n.diagnoses.includes(d));
  const updateDx = canPHI && !sameDx;
  if (updateDx) changed.push("diagnoses"); // field name only; never the values

  // Consent changes are NEW append-only rows, never edits.
  const cur = currentConsents(existing.consentRecords);
  const newConsents: { type: string; granted: boolean }[] = [];
  if (body.consentDataAndContact !== undefined && (body.consentDataAndContact === true) !== (cur.data_and_contact === true))
    newConsents.push({ type: "data_and_contact", granted: body.consentDataAndContact === true });
  if (body.consentMedia !== undefined && (body.consentMedia === true) !== (cur.media === true))
    newConsents.push({ type: "media", granted: body.consentMedia === true });
  if (newConsents.length) changed.push("consent");

  await prisma.$transaction(async (tx) => {
    await tx.patient.update({
      where: { id: existing.id },
      data: {
        email: n.email,
        preferredLanguage: n.language,
        familySize: n.familySize,
        ...(updateDx ? { statedDiagnoses: n.diagnoses } : {}),
      },
    });
    await tx.contactProfile.upsert({
      where: { patientId: existing.id },
      update: { firstName: n.firstName, lastName: n.lastName, phone: n.phone, addressLine1: n.address },
      create: { patientId: existing.id, firstName: n.firstName, lastName: n.lastName, phone: n.phone, addressLine1: n.address },
    });
    for (const c of newConsents) {
      await tx.consentRecord.create({
        data: {
          patientId: existing.id,
          type: c.type,
          granted: c.granted,
          textVersion: CONSENT_TEXT_VERSION,
          method: "phone",
          recordedByBoardUserId: admin!.id,
        },
      });
    }
  });

  await auditPatient(
    admin!.id,
    AuditAction.USER_UPDATED,
    existing.id,
    `Patient updated; fields: ${changed.join(", ") || "none"}`,
  );
  return NextResponse.json({ ok: true });
}

/** Deletion request: hard delete; RSVPs, check-ins and consents cascade. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (body.confirm !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm" }, { status: 400 });
  }
  const existing = await load(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [rsvps, checkIns, consents] = await Promise.all([
    prisma.rsvp.count({ where: { patientId: existing.id } }),
    prisma.checkIn.count({ where: { patientId: existing.id } }),
    prisma.consentRecord.count({ where: { patientId: existing.id } }),
  ]);

  // Duplicates flagged against this row lose the pointer (FK SET NULL).
  await prisma.patient.delete({ where: { id: existing.id } });

  await auditPatient(
    admin!.id,
    AuditAction.USER_DELETED,
    existing.id,
    `Patient hard-deleted on request (cascaded ${rsvps} RSVPs, ${checkIns} check-ins, ${consents} consent records)`,
  );
  return NextResponse.json({ ok: true });
}
