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
 * Check people in on an active RSVP. Single place for the rules:
 * event must match and the RSVP must be active. A household can arrive in pieces,
 * so this can be called again for late arrivals (it never "double checks in").
 *
 *   attendeeIds  which listed people are here (default: everyone not yet in)
 *   guests       unlisted guests confirmed at the door (default: the RSVP's guest count)
 *   headcount    legacy/walk-in shortcut: the primary plus (headcount - 1) guests
 *
 * CheckIn.headcount = checked-in people + guestsCheckedIn, kept in sync here.
 * PHI: nothing health-related is read or returned here.
 */
export async function checkInRsvp(params: {
  rsvpId: string;
  eventId: string;
  attendeeIds?: string[];
  guests?: number;
  headcount?: number;
  admin: { id: string; email: string };
  manual?: boolean; // guest-list tap / walk-in vs QR scan
}): Promise<
  | { ok: true; checkInId: string; headcount: number }
  | { ok: false; error: string; status: number }
> {
  const rsvp = await prisma.rsvp.findUnique({ where: { id: params.rsvpId }, include: { attendees: true } });
  if (!rsvp || rsvp.eventId !== params.eventId || rsvp.cancelledAt)
    return { ok: false, error: "RSVP not found for this event", status: 404 };

  let ids: string[];
  let guests: number;
  if (params.headcount !== undefined) {
    const h = Math.floor(params.headcount);
    if (!Number.isInteger(h) || h < 1 || h > MAX_HEADCOUNT) return { ok: false, error: "Invalid headcount", status: 400 };
    const primary = rsvp.attendees.find((a) => a.isPrimary);
    ids = primary ? [primary.id] : [];
    guests = h - ids.length;
  } else {
    ids = params.attendeeIds ?? rsvp.attendees.filter((a) => !a.checkedInAt).map((a) => a.id);
    guests = Math.floor(params.guests ?? rsvp.guestCount);
  }
  const valid = new Set(rsvp.attendees.map((a) => a.id));
  if (!ids.every((id) => valid.has(id))) return { ok: false, error: "Unknown person for this RSVP", status: 400 };
  if (!Number.isInteger(guests) || guests < 0) return { ok: false, error: "Invalid guest count", status: 400 };

  const already = new Set(rsvp.attendees.filter((a) => a.checkedInAt).map((a) => a.id));
  const checkedAfter = new Set([...Array.from(already), ...ids]).size;
  const total = checkedAfter + guests;
  if (total < 1 || total > MAX_HEADCOUNT) return { ok: false, error: "Invalid headcount", status: 400 };

  const existing = await prisma.checkIn.findUnique({
    where: { eventId_patientId: { eventId: rsvp.eventId, patientId: rsvp.patientId } },
  });
  const newPeople = ids.filter((id) => !already.has(id));
  if (existing && newPeople.length === 0 && guests === existing.guestsCheckedIn)
    return { ok: false, error: "Already checked in", status: 409 };

  const ci = await prisma.$transaction(async (tx) => {
    if (newPeople.length)
      await tx.rsvpAttendee.updateMany({ where: { id: { in: newPeople }, checkedInAt: null }, data: { checkedInAt: new Date() } });
    const row = existing
      ? await tx.checkIn.update({ where: { id: existing.id }, data: { guestsCheckedIn: guests, headcount: total } })
      : await tx.checkIn.create({
          data: {
            eventId: rsvp.eventId,
            patientId: rsvp.patientId,
            headcount: total,
            guestsCheckedIn: guests,
            checkedInBy: params.admin.email,
            attendeeRole: "patient",
            sessionToken: crypto.randomBytes(24).toString("hex"),
            sessionExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          },
        });
    return row;
  });
  await prisma.auditLog.create({
    data: {
      patientId: params.admin.id,
      action: params.manual ? AuditAction.MANUAL_CHECKIN : AuditAction.CHECKIN_CREATED,
      resourceType: "CheckIn",
      resourceId: ci.id,
      details: `Checked in ${total} (${checkedAfter} listed + ${guests} guests; RSVP party ${rsvp.attendeeCount})`,
    },
  });
  return { ok: true, checkInId: ci.id, headcount: total };
}

/** Recompute CheckIn.headcount after a per-person change; drop the CheckIn when nobody is left. */
async function syncCheckIn(rsvp: { id: string; eventId: string; patientId: string }) {
  const ci = await prisma.checkIn.findUnique({ where: { eventId_patientId: { eventId: rsvp.eventId, patientId: rsvp.patientId } } });
  if (!ci) return null;
  const checked = await prisma.rsvpAttendee.count({ where: { rsvpId: rsvp.id, checkedInAt: { not: null } } });
  if (checked === 0 && ci.guestsCheckedIn === 0) {
    await prisma.checkIn.delete({ where: { id: ci.id } });
    return null;
  }
  return prisma.checkIn.update({ where: { id: ci.id }, data: { headcount: checked + ci.guestsCheckedIn } });
}

/** Undo ONE person's check-in (mistaken tap). */
export async function undoAttendeeCheckIn(attendeeId: string, admin: { id: string }) {
  const a = await prisma.rsvpAttendee.findUnique({ where: { id: attendeeId }, include: { rsvp: true } });
  if (!a || !a.checkedInAt) return { ok: false as const, error: "Not found", status: 404 };
  await prisma.rsvpAttendee.update({ where: { id: a.id }, data: { checkedInAt: null } });
  const ci = await syncCheckIn(a.rsvp);
  await prisma.auditLog.create({
    data: { patientId: admin.id, action: AuditAction.CHECKIN_REMOVED, resourceType: "RsvpAttendee", resourceId: a.id, details: "One person's check-in undone" },
  });
  return { ok: true as const, headcount: ci?.headcount ?? 0 };
}

/** Undo the whole household's check-in. */
export async function undoCheckIn(checkInId: string, admin: { id: string }) {
  const ci = await prisma.checkIn.findUnique({ where: { id: checkInId } });
  if (!ci) return { ok: false as const, error: "Not found", status: 404 };
  const rsvp = await prisma.rsvp.findUnique({ where: { eventId_patientId: { eventId: ci.eventId, patientId: ci.patientId } } });
  await prisma.$transaction(async (tx) => {
    if (rsvp) await tx.rsvpAttendee.updateMany({ where: { rsvpId: rsvp.id }, data: { checkedInAt: null } });
    await tx.checkIn.delete({ where: { id: ci.id } });
  });
  await prisma.auditLog.create({
    data: { patientId: admin.id, action: AuditAction.CHECKIN_REMOVED, resourceType: "CheckIn", resourceId: ci.id, details: "Check-in undone" },
  });
  return { ok: true as const };
}
