import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { checkRsvpEligibility } from "./eligibility";
import {
  sendRsvpCancellationEmail,
  sendRsvpConfirmationEmail,
} from "./emails";

/**
 * Create an RSVP (eligibility check → insert → audit → confirmation email).
 * `actorId` is the Patient id recorded in the audit log (the patient for
 * self-service, the board member for call-in RSVPs). Defaults to the patient.
 */
export async function createRsvp(params: {
  eventId: string;
  patientId: string;
  attendeeCount: number;
  familyMembershipIds?: string[];
  dietaryRestrictions?: string | null;
  specialNeeds?: string | null;
  actorId?: string;
  ignoreDeadline?: boolean;
}) {
  const eligibility = await checkRsvpEligibility({
    eventId: params.eventId,
    patientId: params.patientId,
    ignoreDeadline: params.ignoreDeadline,
  });
  if (!eligibility.ok) return eligibility;
  const { event } = eligibility;

  const rsvp = await prisma.rsvp.create({
    data: {
      patientId: params.patientId,
      eventId: event.id,
      status: "confirmed",
      attendeeCount: params.attendeeCount,
      familyMembershipIds: params.familyMembershipIds ?? [],
      dietaryRestrictions: params.dietaryRestrictions,
      specialNeeds: params.specialNeeds,
      rsvpDate: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      patientId: params.actorId ?? params.patientId,
      action: AuditAction.RSVP_CREATED,
      resourceType: "Rsvp",
      resourceId: rsvp.id,
      details: `RSVPed for event: ${event.titleEn}`,
    },
  });

  const patient = await prisma.patient.findUnique({
    where: { id: params.patientId },
    include: { contactProfile: true },
  });
  if (patient) {
    await sendRsvpConfirmationEmail({
      patient,
      event,
      attendeeCount: params.attendeeCount,
    });
  }

  return { ok: true as const, rsvp, event };
}

/** Cancel an RSVP (delete → audit → cancellation email). */
export async function cancelRsvp(params: { rsvpId: string; actorId?: string }) {
  const rsvp = await prisma.rsvp.findUnique({
    where: { id: params.rsvpId },
    include: { event: true, patient: { include: { contactProfile: true } } },
  });
  if (!rsvp) return { ok: false as const, error: "RSVP not found", status: 404 };

  await prisma.rsvp.delete({ where: { id: rsvp.id } });

  await prisma.auditLog.create({
    data: {
      patientId: params.actorId ?? rsvp.patientId,
      action: AuditAction.RSVP_CANCELLED,
      resourceType: "Rsvp",
      resourceId: rsvp.id,
      details: `Cancelled RSVP for event: ${rsvp.event.titleEn}`,
    },
  });

  await sendRsvpCancellationEmail({ patient: rsvp.patient, event: rsvp.event });

  return { ok: true as const };
}
