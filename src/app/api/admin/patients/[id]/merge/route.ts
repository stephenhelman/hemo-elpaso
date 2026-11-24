import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { mergePeople } from "@/lib/identity/merge";
import { notifyMerged } from "@/lib/identity/merge-notice";

/**
 * Merge two person records (a flagged duplicate, or a board member's record into their household).
 * POST /api/admin/patients/:id/merge
 *   body: { otherId?, keepId?, primaryEmail?, primaryPhone?, fingerprint }
 * `otherId` defaults to possibleDuplicateOfId. `fingerprint` comes from the preview (…/merge/preview) and is REQUIRED:
 * the merge only runs if nothing changed since the officer looked (409 plan_changed otherwise). President/VP only
 * (canManageUsers). If BOTH records carry a household, `keepId` is required (409 needs_keep_choice).
 * Rules, conflict handling and the transaction: lib/identity/merge.ts and merge-plan.ts.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const a = await prisma.patient.findUnique({ where: { id: params.id }, select: { id: true, possibleDuplicateOfId: true } });
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const otherId: string | null = body.otherId ?? a.possibleDuplicateOfId;
  if (!otherId) return NextResponse.json({ error: "No duplicate to merge with" }, { status: 400 });
  if (typeof body.fingerprint !== "string" || !body.fingerprint) return NextResponse.json({ error: "preview_required" }, { status: 428 });

  const choice = (v: unknown) => (v === "other" ? ("other" as const) : ("survivor" as const));
  const r = await mergePeople(a.id, otherId, admin!.id, typeof body.keepId === "string" ? body.keepId : null, {
    primaryEmail: choice(body.primaryEmail),
    primaryPhone: choice(body.primaryPhone),
    expectFingerprint: body.fingerprint,
  });
  if (!r.ok) return NextResponse.json({ error: r.error, candidates: r.candidates }, { status: r.status });
  await notifyMerged(r.keptId);
  return NextResponse.json({ ok: true, keptId: r.keptId });
}
