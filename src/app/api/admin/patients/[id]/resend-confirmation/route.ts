import { NextRequest, NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PATIENT_ONLY, currentConsents } from "@/lib/patients/query";
import { auditPatient } from "@/lib/patients/audit";
import { sendRegistrationConfirmation } from "@/lib/patients/confirmation";

/** Retry the registration confirmation. Only for people who consented to be contacted. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;

  const p = await prisma.patient.findFirst({
    where: { id: params.id, ...PATIENT_ONLY },
    include: { contactProfile: true, consentRecords: true },
  });
  if (!p || !p.email) return NextResponse.json({ error: "No email on file" }, { status: 404 });
  if (currentConsents(p.consentRecords).data_and_contact !== true)
    return NextResponse.json({ error: "No consent to contact this person" }, { status: 403 });

  const res = await sendRegistrationConfirmation({
    id: p.id,
    email: p.email,
    firstName: p.contactProfile?.firstName ?? "",
    language: p.preferredLanguage === "es" ? "es" : "en",
  });
  await auditPatient(admin!.id, AuditAction.PATIENT_UPDATED, p.id, "Confirmation email resent");
  if (!res.ok) return NextResponse.json({ ok: false, error: res.errorName }, { status: 502 });
  return NextResponse.json({ ok: true });
}
