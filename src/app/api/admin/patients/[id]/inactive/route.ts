import { NextRequest, NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { auditPatient } from "@/lib/patients/audit";
import { CONTACTED_MARK } from "@/lib/retention";

/**
 * "Mark contacted" on the Inactive households page. Writes an audit row only: it does NOT touch the patient record,
 * so the household stays on the list (and keeps its original last-activity date) until it replies (any edit or RSVP
 * clears it from the list) or a President/VP deletes it. Same permission as the Patients directory.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;
  const p = await prisma.patient.findFirst({ where: { id: params.id, ...PATIENT_ONLY }, select: { id: true } });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await auditPatient(admin!.id, AuditAction.PATIENT_UPDATED, p.id, CONTACTED_MARK);
  return NextResponse.json({ ok: true });
}
