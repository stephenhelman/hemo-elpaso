import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { checkInRsvp, undoAttendeeCheckIn, undoCheckIn } from "@/lib/checkin";

/**
 * Confirm a check-in (QR scan, guest-list tap, manual button).
 * Body: { rsvpId, eventId, attendeeIds?: string[], guests?: number, headcount?: number, manual? }
 * No attendeeIds/guests = everyone not yet in plus the RSVP's guest count.
 */
export async function POST(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;
  const b = await req.json().catch(() => ({}));
  const r = await checkInRsvp({
    rsvpId: b.rsvpId,
    eventId: b.eventId,
    attendeeIds: Array.isArray(b.attendeeIds) ? b.attendeeIds.filter((x: unknown) => typeof x === "string") : undefined,
    guests: b.guests === undefined ? undefined : Number(b.guests),
    headcount: b.headcount === undefined ? undefined : Number(b.headcount),
    admin: { id: admin!.id, email: admin!.email },
    manual: b.manual === true,
  });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true, checkInId: r.checkInId, headcount: r.headcount });
}

/** Undo: ?attendeeId= undoes ONE person; ?checkInId= undoes the whole household's check-in. */
export async function DELETE(req: NextRequest) {
  const { admin, error } = await requirePermission("canManageEvents");
  if (error) return error;
  const sp = new URL(req.url).searchParams;
  const attendeeId = sp.get("attendeeId");
  const checkInId = sp.get("checkInId");
  if (!attendeeId && !checkInId) return NextResponse.json({ error: "attendeeId or checkInId required" }, { status: 400 });
  const r = attendeeId ? await undoAttendeeCheckIn(attendeeId, { id: admin!.id }) : await undoCheckIn(checkInId!, { id: admin!.id });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true });
}
