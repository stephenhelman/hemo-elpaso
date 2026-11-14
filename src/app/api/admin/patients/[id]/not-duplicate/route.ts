import { NextRequest, NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { auditPatient } from "@/lib/patients/audit";

/**
 * "Not a duplicate": clears possibleDuplicateOfId WITHOUT merging.
 * Only that one field changes; the audit entry records the field name only.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;

  const res = await prisma.patient.updateMany({
    where: { id: params.id, ...PATIENT_ONLY, possibleDuplicateOfId: { not: null } },
    data: { possibleDuplicateOfId: null },
  });
  if (res.count === 0) return NextResponse.json({ error: "Not flagged as a duplicate" }, { status: 404 });

  await auditPatient(admin!.id, AuditAction.PATIENT_UPDATED, params.id, "Patient updated; fields: possibleDuplicateOfId");
  return NextResponse.json({ ok: true });
}
