import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { isRemovalReason } from "@/lib/invitations/removal";
import { removeInvitation } from "@/lib/invitations/remove";

/** Remove a PENDING invitation. Body: { reason: RemovalReason } (a code; required). The row is kept as "removed". */
export async function POST(req: NextRequest, { params }: { params: { id: string; invId: string } }) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  if (!isRemovalReason(body?.reason)) {
    return NextResponse.json({ error: "A removal reason is required" }, { status: 400 });
  }
  const ok = await removeInvitation(params.id, params.invId, body.reason, admin!.id);
  if (!ok) return NextResponse.json({ error: "Only pending invitations can be removed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
