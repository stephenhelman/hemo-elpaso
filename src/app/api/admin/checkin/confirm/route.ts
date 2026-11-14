import { NextRequest, NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { checkInRsvp } from "@/lib/checkin";

/** Confirm a check-in (QR scan with edited headcount, or a guest-list tap). */
export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;
  const b = await req.json().catch(() => ({}));
  const r = await checkInRsvp({
    rsvpId: b.rsvpId,
    eventId: b.eventId,
    headcount: b.headcount === undefined ? undefined : Number(b.headcount),
    admin: { id: admin!.id, email: admin!.email },
    manual: b.manual === true,
  });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true, checkInId: r.checkInId, headcount: r.headcount });
}

/** Undo a check-in (mistaken tap). */
export async function DELETE(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;
  const checkInId = new URL(req.url).searchParams.get("checkInId");
  if (!checkInId) return NextResponse.json({ error: "checkInId required" }, { status: 400 });
  const res = await prisma.checkIn.deleteMany({ where: { id: checkInId } });
  if (res.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.auditLog.create({
    data: { patientId: admin!.id, action: AuditAction.CHECKIN_REMOVED, resourceType: "CheckIn", resourceId: checkInId, details: "Check-in undone" },
  });
  return NextResponse.json({ ok: true });
}
