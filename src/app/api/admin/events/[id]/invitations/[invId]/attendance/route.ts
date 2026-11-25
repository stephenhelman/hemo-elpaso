import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { setInvitationAttendance } from "@/lib/rsvp/requests";
import { CONFIRM_BLOCK_TEXT, isAttendanceType } from "@/lib/rsvp/request-rules";

/** Switch an invitation between in person and virtual. Body: { attendanceType }. Virtual needs the event's virtual option and the "recordings" toggle. */
export async function POST(req: NextRequest, { params }: { params: { id: string; invId: string } }) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;
  const body = await req.json().catch(() => ({}));
  if (!isAttendanceType(body.attendanceType)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const inv = await prisma.invitation.findUnique({ where: { id: params.invId }, select: { eventId: true } });
  if (!inv || inv.eventId !== params.id) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  const r = await setInvitationAttendance({ invitationId: params.invId, type: body.attendanceType, adminId: admin!.id });
  if (!r.ok) return NextResponse.json({ error: r.code ? CONFIRM_BLOCK_TEXT[r.code] : r.error }, { status: 409 });
  return NextResponse.json({ ok: true });
}
