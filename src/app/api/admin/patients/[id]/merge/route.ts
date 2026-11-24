import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { mergePeople } from "@/lib/identity/merge";

/**
 * Merge two person records (a flagged duplicate, or a board member's record into their household).
 * POST /api/admin/patients/:id/merge   body: { otherId?, keepId? }   (otherId defaults to possibleDuplicateOfId)
 * President/VP only (canManageUsers): it touches family data. If BOTH records carry a household, `keepId` is required
 * and says which household survives (409 needs_keep_choice otherwise). Rules and the transaction: lib/identity/merge.ts.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requirePermission("canManageUsers");
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const a = await prisma.patient.findUnique({ where: { id: params.id }, select: { id: true, possibleDuplicateOfId: true } });
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const otherId: string | null = body.otherId ?? a.possibleDuplicateOfId;
  if (!otherId) return NextResponse.json({ error: "No duplicate to merge with" }, { status: 400 });

  const r = await mergePeople(a.id, otherId, admin!.id, typeof body.keepId === "string" ? body.keepId : null);
  if (!r.ok) return NextResponse.json({ error: r.error, candidates: r.candidates }, { status: r.status });
  return NextResponse.json({ ok: true, keptId: r.keptId });
}
