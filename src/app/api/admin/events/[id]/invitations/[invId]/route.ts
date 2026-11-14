import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";

/** Remove a PENDING invitation (sent ones stay: their link is already out). */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; invId: string } }) {
  const { error } = await requirePermission("canManageEvents");
  if (error) return error;
  const res = await prisma.invitation.deleteMany({
    where: { id: params.invId, eventId: params.id, status: "pending" },
  });
  if (res.count === 0) return NextResponse.json({ error: "Only pending invitations can be removed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
