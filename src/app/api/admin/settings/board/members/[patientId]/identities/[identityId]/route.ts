import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { unlinkBoardOrgIdentity } from "@/lib/identity/admin";

/** Admin (settings-only): unlink an ORG sign-in from a board record. Family identities and household records are refused. */
export async function DELETE(_req: Request, { params }: { params: { patientId: string; identityId: string } }) {
  const { admin, error } = await requirePermission("canAssignBoardRoles");
  if (error) return error;
  const r = await unlinkBoardOrgIdentity(params.patientId, params.identityId, { id: admin!.id });
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: r.status });
}
