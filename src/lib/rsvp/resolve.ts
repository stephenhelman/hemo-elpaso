import { prisma } from "@/lib/db";
import { hashToken, looksLikeToken } from "@/lib/tokens";
import { eventHasEnded } from "./window";

/**
 * Resolve a raw token from a link to its context. Three token kinds exist:
 * - check-in token  -> an active RSVP (shown with QR)
 * - invitation token -> an invitation (may or may not have an RSVP yet)
 * - RSVP access link -> emailed on request from the event page; works like an invitation token but does NOT count as invited
 * Unknown/invalid tokens all return null (callers show one generic message).
 */
export async function resolveRsvpToken(raw: unknown) {
  if (!looksLikeToken(raw)) return null;
  const hash = hashToken(raw);

  const rsvp = await prisma.rsvp.findUnique({
    where: { checkInTokenHash: hash },
    include: { event: true, patient: { include: { contactProfile: true } } },
  });
  if (rsvp && !rsvp.cancelledAt) {
    return { via: "checkin" as const, event: rsvp.event, patient: rsvp.patient, rsvp, invitation: null, ended: eventHasEnded(rsvp.event) };
  }

  const inv = await prisma.invitation.findUnique({
    where: { tokenHash: hash },
    include: { event: true, patient: { include: { contactProfile: true } } },
  });
  if (inv) {
    const r = await prisma.rsvp.findUnique({
      where: { eventId_patientId: { eventId: inv.eventId, patientId: inv.patientId } },
    });
    return {
      via: "invitation" as const,
      event: inv.event,
      patient: inv.patient,
      rsvp: r && !r.cancelledAt ? r : null,
      invitation: inv,
      ended: eventHasEnded(inv.event),
    };
  }

  const link = await prisma.rsvpAccessLink.findUnique({
    where: { tokenHash: hash },
    include: { event: true, patient: { include: { contactProfile: true } } },
  });
  if (link && link.expiresAt > new Date() && !link.patient.mergedIntoId) {
    const r = await prisma.rsvp.findUnique({ where: { eventId_patientId: { eventId: link.eventId, patientId: link.patientId } } });
    return {
      via: "link" as const,
      event: link.event,
      patient: link.patient,
      rsvp: r && !r.cancelledAt ? r : null,
      invitation: null,
      ended: eventHasEnded(link.event),
    };
  }
  return null;
}
