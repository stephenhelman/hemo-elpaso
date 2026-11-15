import { prisma } from "@/lib/db";
import { noPhotosFlag } from "@/lib/checkin";

/**
 * How many families with an active RSVP to this event do NOT have a granted media consent (their LATEST media
 * consent record is a refusal, or they have none). Same rule as the sign-in sheet and the check-in "NO PHOTOS" badge.
 * Returns counts only, never names.
 */
export async function noMediaConsentCount(eventId: string): Promise<{ families: number; noPhotos: number }> {
  const rsvps = await prisma.rsvp.findMany({
    where: { eventId, cancelledAt: null },
    select: { patient: { select: { consentRecords: { where: { type: "media" }, select: { type: true, granted: true, createdAt: true } } } } },
  });
  return { families: rsvps.length, noPhotos: rsvps.filter((r) => noPhotosFlag(r.patient.consentRecords)).length };
}
