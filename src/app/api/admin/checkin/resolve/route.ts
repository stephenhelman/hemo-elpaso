import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { hashToken, looksLikeToken } from "@/lib/tokens";
import { noPhotosFlag } from "@/lib/checkin";

/**
 * Resolve a scanned QR (the raw check-in token) to its RSVP for THIS event.
 * Returns name, party size, NO PHOTOS flag, and whether already checked in.
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
      patient: { include: { contactProfile: true, consentRecords: true } },
    },
  });
  if (!rsvp || rsvp.cancelledAt)
    return NextResponse.json({ error: "QR code not recognised or RSVP cancelled" }, { status: 404 });
  if (rsvp.eventId !== eventId)
    return NextResponse.json({ error: `This QR code is for "${rsvp.event.titleEn}", not this event` }, { status: 400 });

  const checkIn = await prisma.checkIn.findUnique({
    where: { eventId_patientId: { eventId, patientId: rsvp.patientId } },
    select: { id: true },
  });
  return NextResponse.json({
    rsvpId: rsvp.id,
    name: `${rsvp.patient.contactProfile?.firstName ?? ""} ${rsvp.patient.contactProfile?.lastName ?? ""}`.trim(),
    partySize: rsvp.attendeeCount,
    noPhotos: noPhotosFlag(rsvp.patient.consentRecords),
    alreadyCheckedIn: !!checkIn,
  });
}
