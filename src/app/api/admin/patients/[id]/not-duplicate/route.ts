import { NextRequest, NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { auditPatient } from "@/lib/patients/audit";
import { dismissDuplicate } from "@/lib/identity/duplicates";

/**
 * "Not a duplicate": clears possibleDuplicateOfId WITHOUT merging and remembers the pair (duplicate_dismissals).
 * The audit entries hold ids and field names only.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;

  const flagged = await prisma.patient.findFirst({ where: { id: params.id, ...PATIENT_ONLY, possibleDuplicateOfId: { not: null } }, select: { possibleDuplicateOfId: true } });
  if (!flagged?.possibleDuplicateOfId) return NextResponse.json({ error: "Not flagged as a duplicate" }, { status: 404 });
  // Remembers the pair too, so it never comes back in the duplicates list.
  await dismissDuplicate(admin!.id, params.id, flagged.possibleDuplicateOfId);

  await auditPatient(admin!.id, AuditAction.PATIENT_UPDATED, params.id, "Patient updated; fields: possibleDuplicateOfId");
  return NextResponse.json({ ok: true });
}
