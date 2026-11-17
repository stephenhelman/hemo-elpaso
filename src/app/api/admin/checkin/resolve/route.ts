import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { hashToken, looksLikeToken } from "@/lib/tokens";
import { ATTENDEE_WITH_MEMBER, mapPeople } from "@/lib/rsvp/people";

/**
 * Resolve a scanned QR (the raw check-in token) to its RSVP for THIS event.
 * Returns the household's people (first name, relationship, per-person NO PHOTOS,
 * checked-in state), the guest counts, and whether everyone is already in.
 * No diagnoses, no contact details.
 */
export async function POST(req: NextRequest) {
  const { error } = await requirePermission("canManageEvents");
  if (error) return error;

  const { eventId, token } = await req.json().catch(() => ({}));
  if (!looksLikeToken(token) || typeof eventId !== "string")
    return NextResponse.json({ error: "Not a valid HOEP QR code" }, { status: 400 });

  const rsvp = await prisma.rsvp.findUnique({
    where: { checkInTokenHash: hashToken(token) },
    include: {
      event: { select: { titleEn: true } },
      patient: { select: { contactProfile: true, consentRecords: { where: { type: "media" }, orderBy: { createdAt: "desc" }, take: 1, select: { granted: true } } } },
      attendees: { include: ATTENDEE_WITH_MEMBER, orderBy: { createdAt: "asc" } },
    },
  });
  if (!rsvp || rsvp.cancelledAt)
    return NextResponse.json({ error: "QR code not recognised or RSVP cancelled" }, { status: 404 });
  if (rsvp.eventId !== eventId)
    return NextResponse.json({ error: `This QR code is for "${rsvp.event.titleEn}", not this event` }, { status: 400 });

  const checkIn = await prisma.checkIn.findUnique({
    where: { eventId_patientId: { eventId, patientId: rsvp.patientId } },
    select: { id: true, guestsCheckedIn: true },
  });
  const people = mapPeople(rsvp.attendees, rsvp.patient.contactProfile?.firstName ?? "", rsvp.patient.consentRecords[0]?.granted);
  const everyoneIn = people.every((p) => p.checkedIn) && (checkIn?.guestsCheckedIn ?? 0) >= rsvp.guestCount;
  return NextResponse.json({
    rsvpId: rsvp.id,
    name: `${rsvp.patient.contactProfile?.firstName ?? ""} ${rsvp.patient.contactProfile?.lastName ?? ""}`.trim(),
    partySize: rsvp.attendeeCount,
    people,
    guestCount: rsvp.guestCount,
    guestsCheckedIn: checkIn?.guestsCheckedIn ?? 0,
    noPhotos: people.some((p) => p.noPhotos),
    alreadyCheckedIn: !!checkIn && everyoneIn,
  });
}
