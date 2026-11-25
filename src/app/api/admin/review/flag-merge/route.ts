import { NextRequest, NextResponse } from "next/server";
import { requireAnyPermission } from "@/lib/permissions";
import { flagNeedsMerge } from "@/lib/review/reviewer";

/** "Needs merge": records a duplicate flag between two households. It never merges (that is POST /api/admin/patients/:id/merge, canManageUsers). Body: { aId, bId }. */
export async function POST(req: NextRequest) {
  const { admin, error } = await requireAnyPermission(["canManageUsers", "canReviewRegistrations"]);
  if (error) return error;
  const b = await req.json().catch(() => ({}));
  const ok = typeof b.aId === "string" && typeof b.bId === "string" && (await flagNeedsMerge(admin!.id, b.aId, b.bId));
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "invalid" }, { status: 400 });
}
