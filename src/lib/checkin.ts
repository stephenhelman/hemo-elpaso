import crypto from "crypto";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { currentConsents } from "@/lib/patients/query";

import { MAX_HEADCOUNT } from "@/lib/checkin-constants";
export { MAX_HEADCOUNT };

/** "NO PHOTOS" unless the LATEST media consent record is granted (none = no). */
export function noPhotosFlag(records: { type: string; granted: boolean; createdAt: Date }[]) {
  return currentConsents(records as any).media !== true;
}

/**
 * Check an active RSVP in. Single place for the rules:
 * event must match, RSVP must be active, one check-in per patient per event.
 * `headcount` is how many people actually showed up (defaults to party size).
 * PHI: nothing health-related is read or returned here.
 */
export async function checkInRsvp(params: {
  rsvpId: string;
  eventId: string;
  headcount?: number;
  admin: { id: string; email: string };
  manual?: boolean; // guest-list tap / walk-in vs QR scan
}): Promise<
  | { ok: true; checkInId: string; headcount: number }
  | { ok: false; error: string; status: number }
> {
  const rsvp = await prisma.rsvp.findUnique({ where: { id: params.rsvpId } });
  if (!rsvp || rsvp.eventId !== params.eventId || rsvp.cancelledAt)
    return { ok: false, error: "RSVP not found for this event", status: 404 };

  const headcount = Math.floor(params.headcount ?? rsvp.attendeeCount);
  if (!Number.isInteger(headcount) || headcount < 1 || headcount > MAX_HEADCOUNT)
    return { ok: false, error: "Invalid headcount", status: 400 };

  const existing = await prisma.checkIn.findUnique({
    where: { eventId_patientId: { eventId: rsvp.eventId, patientId: rsvp.patientId } },
  });
  if (existing) return { ok: false, error: "Already checked in", status: 409 };

  const ci = await prisma.checkIn.create({
    data: {
      eventId: rsvp.eventId,
      patientId: rsvp.patientId,
      headcount,
      checkedInBy: params.admin.email,
      attendeeRole: "patient",
      sessionToken: crypto.randomBytes(24).toString("hex"),
      sessionExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });
  await prisma.auditLog.create({
    data: {
      patientId: params.admin.id,
      action: params.manual ? AuditAction.MANUAL_CHECKIN : AuditAction.CHECKIN_CREATED,
      resourceType: "CheckIn",
      resourceId: ci.id,
      details: `Checked in ${headcount} (RSVP party ${rsvp.attendeeCount})`,
    },
  });
  return { ok: true, checkInId: ci.id, headcount };
}
