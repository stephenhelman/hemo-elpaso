import { prisma } from "@/lib/db";
import { eventHasEnded } from "./window";

export type RsvpBlock = "EVENT_NOT_FOUND" | "ENDED" | "NOT_PUBLISHED" | "DEADLINE_PASSED" | "AT_CAPACITY";

export type RsvpEligibility =
  | { ok: true; event: NonNullable<Awaited<ReturnType<typeof loadEvent>>> }
  | { ok: false; code: RsvpBlock; error: string; status: number };

const loadEvent = (eventId: string) => prisma.event.findUnique({ where: { id: eventId } });

/** People already counted against capacity (active RSVPs), optionally excluding one RSVP. */
export async function activeHeadcount(eventId: string, excludeRsvpId?: string) {
  const agg = await prisma.rsvp.aggregate({
    where: { eventId, cancelledAt: null, ...(excludeRsvpId ? { id: { not: excludeRsvpId } } : {}) },
    _sum: { attendeeCount: true },
  });
  return agg._sum.attendeeCount ?? 0;
}

/**
 * Event-level checks for a YES / party-size change. No session dependency.
 * Capacity is in PEOPLE (sum of party sizes), not RSVP rows. The deadline
 * applies to new RSVPs and increases; callers lowering a party size or
 * cancelling should not call this. `ignoreDeadline` is for board call-ins.
 */
export async function checkRsvpEligibility(params: {
  eventId: string;
  partySize: number;
  excludeRsvpId?: string; // the patient's own current RSVP when editing
  ignoreDeadline?: boolean;
  ignoreCapacity?: boolean; // board walk-ins at the door
  requirePublished?: boolean;
  now?: Date;
}): Promise<RsvpEligibility> {
  const { eventId, partySize, excludeRsvpId, ignoreDeadline = false, ignoreCapacity = false, requirePublished = true, now = new Date() } = params;
  const event = await loadEvent(eventId);
  if (!event) return { ok: false, code: "EVENT_NOT_FOUND", error: "Event not found", status: 404 };
  if (eventHasEnded(event, now))
    return { ok: false, code: "ENDED", error: "This event has ended", status: 400 };
  if (requirePublished && event.status !== "published")
    return { ok: false, code: "NOT_PUBLISHED", error: "This event is not open for RSVPs", status: 400 };
  if (!ignoreDeadline && event.rsvpDeadline && event.rsvpDeadline < now)
    return { ok: false, code: "DEADLINE_PASSED", error: "Registration is closed", status: 400 };
  if (event.maxCapacity && !ignoreCapacity) {
    const taken = await activeHeadcount(eventId, excludeRsvpId);
    if (taken + partySize > event.maxCapacity)
      return { ok: false, code: "AT_CAPACITY", error: "This event is full", status: 400 };
  }
  return { ok: true, event };
}

/** For the public page: can a NEW public RSVP happen right now? */
export async function registrationState(event: {
  id: string; status: string; eventDate: Date; rsvpDeadline: Date | null; maxCapacity: number | null; registrationEnabled: boolean;
}): Promise<"open" | "full" | "closed" | "disabled"> {
  if (!event.registrationEnabled || event.status !== "published") return "disabled";
  if (eventHasEnded(event)) return "closed";
  if (event.rsvpDeadline && event.rsvpDeadline < new Date()) return "closed";
  if (event.maxCapacity && (await activeHeadcount(event.id)) >= event.maxCapacity) return "full";
  return "open";
}
