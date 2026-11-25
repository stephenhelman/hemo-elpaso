import { NextRequest, NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { validatePatientInput } from "@/lib/patients/create";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { recomputeHousehold } from "@/lib/households/sync";
import { auditPatient } from "@/lib/patients/audit";
import { addressColumns } from "@/lib/address/validate";

type Ctx = { params: { id: string } };

const load = (id: string) =>
  prisma.patient.findFirst({
    where: { id, ...PATIENT_ONLY },
    include: { contactProfile: true },
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
  const nextAddr = addressColumns(n.address);
  if ((["addressLine1", "addressLine2", "city", "state", "zipCode"] as const).some((k) => (cp?.[k] ?? null) !== nextAddr[k])) changed.push("address");
  if (existing.preferredLanguage !== n.language) changed.push("language");
  // familySize is derived (1 + household members); diagnoses edited here are the PRIMARY's own.
  const sameDx =
    existing.primaryDiagnoses.length === n.diagnoses.length &&
    existing.primaryDiagnoses.every((d) => n.diagnoses.includes(d));
  const updateDx = canPHI && !sameDx;
  if (updateDx) changed.push("diagnoses"); // field name only; never the values

  // Consent is NOT changed here. The consent panel (POST /api/admin/patients/:id/consents) is the only board path:
  // it requires a reason and never lets the board turn a consent on without the family having asked.

  await prisma.$transaction(async (tx) => {
    await tx.patient.update({
      where: { id: existing.id },
      data: {
        email: n.email,
        preferredLanguage: n.language,
        ...(updateDx ? { primaryDiagnoses: n.diagnoses } : {}),
      },
    });
    if (updateDx) await recomputeHousehold(tx, existing.id);
    await tx.contactProfile.upsert({
      where: { patientId: existing.id },
      update: { firstName: n.firstName, lastName: n.lastName, phone: n.phone, ...nextAddr },
      create: { patientId: existing.id, firstName: n.firstName, lastName: n.lastName, phone: n.phone, ...nextAddr },
    });
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
