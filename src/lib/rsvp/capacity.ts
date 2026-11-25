import { prisma } from "@/lib/db";

/** In-person people (sum of party sizes, cancelled and virtual RSVPs excluded) per event. Same basis as the capacity check. */
export async function rsvpPeopleByEvent(eventIds: string[]): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {};
  const rows = await prisma.rsvp.groupBy({
    by: ["eventId"],
    where: { eventId: { in: eventIds }, cancelledAt: null, attendanceType: "in_person" },
    _sum: { attendeeCount: true },
  });
  return Object.fromEntries(rows.map((r) => [r.eventId, r._sum.attendeeCount ?? 0]));
}

export async function withRsvpPeople<T extends { id: string }>(events: T[]) {
  const people = await rsvpPeopleByEvent(events.map((e) => e.id));
  return events.map((e) => ({ ...e, rsvpPeople: people[e.id] ?? 0 }));
}
