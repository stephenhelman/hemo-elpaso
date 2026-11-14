import { prisma } from "@/lib/db";

export type RsvpEligibility =
  | { ok: true; event: NonNullable<Awaited<ReturnType<typeof loadEvent>>> }
  | {
      ok: false;
      code:
        | "EVENT_NOT_FOUND"
        | "ALREADY_RSVPED"
        | "AT_CAPACITY"
        | "DEADLINE_PASSED";
      error: string;
      status: number;
    };

function loadEvent(eventId: string) {
  return prisma.event.findUnique({ where: { id: eventId } });
}

/**
 * Event-level RSVP checks: existence, duplicate, capacity, deadline.
 * No session dependency — callers (patient self-service, board call-ins,
 * tokenized links) supply the patient id and decide who is allowed to ask.
 *
 * `ignoreDeadline` lets a board member RSVP on someone's behalf after the
 * public deadline. Capacity is always enforced here; callers that want to
 * override it must do so explicitly.
 */
export async function checkRsvpEligibility(params: {
  eventId: string;
  patientId: string;
  ignoreDeadline?: boolean;
  now?: Date;
}): Promise<RsvpEligibility> {
  const { eventId, patientId, ignoreDeadline = false, now = new Date() } = params;

  const event = await loadEvent(eventId);
  if (!event) {
    return {
      ok: false,
      code: "EVENT_NOT_FOUND",
      error: "Event not found",
      status: 404,
    };
  }

  const existing = await prisma.rsvp.findFirst({
    where: { patientId, eventId: event.id },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      code: "ALREADY_RSVPED",
      error: "Already RSVPed",
      status: 400,
    };
  }

  if (!ignoreDeadline && event.rsvpDeadline && event.rsvpDeadline < now) {
    return {
      ok: false,
      code: "DEADLINE_PASSED",
      error: "The RSVP deadline for this event has passed",
      status: 400,
    };
  }

  if (event.maxCapacity) {
    const currentRsvps = await prisma.rsvp.count({
      where: { eventId: event.id },
    });
    if (currentRsvps >= event.maxCapacity) {
      return {
        ok: false,
        code: "AT_CAPACITY",
        error: "Event is at capacity",
        status: 400,
      };
    }
  }

  return { ok: true, event };
}
