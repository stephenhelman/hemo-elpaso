import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { actorFor } from "@/lib/email-routing/actor";
import { changeMatrix } from "@/lib/permission-matrix/change";
import { matrixDeps, readMatrixFresh } from "@/lib/permission-matrix";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requirePermission("canManagePermissions");
  if (error) return error;
  return NextResponse.json({ matrix: (await readMatrixFresh()).matrix });
}

/** Save the whole grid. Body: { matrix: { [role]: Permission[] } }. Locked cells are rejected, never silently fixed. */
export async function PUT(req: NextRequest) {
  const { admin, error } = await requirePermission("canManagePermissions");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const result = await changeMatrix(matrixDeps(), body?.matrix, await actorFor(admin));
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
