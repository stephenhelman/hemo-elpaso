import { prisma } from "@/lib/db";
import { decideRsvpPath } from "@/lib/rsvp/request-rules";
import { getGateCutoff } from "./service";

/**
 * Upcoming published events this household may RSVP to right now, or ask to attend (`asRequest`). Not already RSVPed, deadline not passed. Titles and ids only. Used by the family page.
 */
export async function openEventsFor(householdId: string, now = new Date()) {
  const [p, cutoff] = await Promise.all([prisma.patient.findUnique({ where: { id: householdId }, select: { reviewStatus: true } }), getGateCutoff()]);
  if (!p) return [];
  const events = await prisma.event.findMany({
    where: {
      status: "published", eventDate: { gte: now }, OR: [{ rsvpDeadline: null }, { rsvpDeadline: { gte: now } }],
      NOT: { rsvps: { some: { patientId: householdId, cancelledAt: null } } },
    },
    orderBy: { eventDate: "asc" }, take: 20,
    select: { id: true, slug: true, titleEn: true, titleEs: true, eventDate: true, allowUninvitedRequests: true,
      invitations: { where: { patientId: householdId }, select: { createdAt: true, status: true } } },
  });
  return events
    .map((e) => ({ e, path: decideRsvpPath({ reviewStatus: p.reviewStatus, invitation: e.invitations[0] ?? null, event: e, cutoff }) }))
    .filter((x) => x.path.path !== "refuse")
    .map(({ e, path }) => ({ id: e.id, slug: e.slug, title: { en: e.titleEn, es: e.titleEs }, eventDate: e.eventDate.toISOString(), asRequest: path.path === "request" }));
}
