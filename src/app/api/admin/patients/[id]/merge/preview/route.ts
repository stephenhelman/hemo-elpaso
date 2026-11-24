import { NextRequest, NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { planMerge } from "@/lib/identity/merge-plan";
import { auditPatient } from "@/lib/patients/audit";

export const dynamic = "force-dynamic";

/**
 * Preview a merge: what moves, what conflicts and how each conflict is resolved. WRITES NOTHING except an audit row
 * (ids only). President/VP only. POST /api/admin/patients/:id/merge/preview  body: { otherId?, keepId?, primaryEmail?, primaryPhone? }
 * Two records that both carry a household answer 409 needs_keep_choice with a summary of each, until `keepId` is sent.
 * The returned `fingerprint` must be sent back to confirm.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  const a = await prisma.patient.findUnique({ where: { id: params.id }, select: { id: true, possibleDuplicateOfId: true } });
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const otherId: string | null = body.otherId ?? a.possibleDuplicateOfId;
  if (!otherId) return NextResponse.json({ error: "No duplicate to merge with" }, { status: 400 });

  const choice = (v: unknown) => (v === "other" ? ("other" as const) : ("survivor" as const));
  const r = await planMerge(prisma, a.id, otherId, {
    keepId: typeof body.keepId === "string" ? body.keepId : null,
    primaryEmail: choice(body.primaryEmail),
    primaryPhone: choice(body.primaryPhone),
  });
  await auditPatient(admin!.id, AuditAction.PATIENT_MERGE_PREVIEWED, a.id, `Merge preview opened for ${a.id} and ${otherId}`);
  if (!r.ok) return NextResponse.json({ error: r.error, candidates: r.candidates, summaries: r.summaries }, { status: r.status });
  const { instructions: _omit, ...plan } = r.plan;
  void _omit;
  return NextResponse.json({ plan });
}
