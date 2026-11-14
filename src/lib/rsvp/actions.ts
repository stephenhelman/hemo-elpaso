import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/tokens";
import { checkRsvpEligibility, type RsvpBlock } from "./eligibility";
import { eventHasEnded } from "./window";
import { sendRsvpEmail } from "./emails";

export type RsvpSource = "invite" | "public" | "manual";

type Fail = { ok: false; code: RsvpBlock | "NOT_FOUND"; error: string; status: number };

/** Mark any invitation for this patient/event as answered. */
async function markInvitation(eventId: string, patientId: string, status: "rsvp_yes" | "rsvp_no") {
  await prisma.invitation.updateMany({ where: { eventId, patientId }, data: { status } });
}

async function audit(actorId: string | null, action: AuditAction, rsvpId: string, details: string) {
  await prisma.auditLog.create({
    data: { patientId: actorId, action, resourceType: "Rsvp", resourceId: rsvpId, details },
  });
}

/**
 * Create / reactivate / update a YES RSVP.
 * - New or reactivated RSVP: mints a check-in token (hash stored, raw returned
 *   ONCE) and sends the confirmation email with the QR.
 * - Existing active RSVP: updates party size only (token untouched, so no raw
 *   token is returned).
 * No session dependency; callers decide who may ask. `actorId` is recorded in
 * the audit log (board user for call-ins; defaults to the patient).
 */
export async function rsvpYes(params: {
  eventId: string;
  patientId: string;
  partySize: number;
  source: RsvpSource;
  actorId?: string;
  ignoreDeadline?: boolean;
  sendEmail?: boolean;
}): Promise<
  | { ok: true; rsvpId: string; token: string | null; created: boolean }
  | Fail
> {
  const partySize = Math.floor(params.partySize);
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 30)
    return { ok: false, code: "NOT_FOUND", error: "Invalid party size", status: 400 };

  const existing = await prisma.rsvp.findUnique({
    where: { eventId_patientId: { eventId: params.eventId, patientId: params.patientId } },
  });
  const active = existing && !existing.cancelledAt;

  // Deadline only blocks NEW yes or an INCREASE; lowering is always fine.
  const increasing = !active || partySize > existing!.attendeeCount;
  const elig = await checkRsvpEligibility({
    eventId: params.eventId,
    partySize,
    excludeRsvpId: active ? existing!.id : undefined,
    ignoreDeadline: params.ignoreDeadline || !increasing,
  });
  if (!elig.ok) return elig;
  const { event } = elig;

  const patient = await prisma.patient.findUnique({
    where: { id: params.patientId },
    include: { contactProfile: true },
  });
  if (!patient) return { ok: false, code: "NOT_FOUND", error: "Patient not found", status: 404 };

  if (active) {
    await prisma.rsvp.update({ where: { id: existing!.id }, data: { attendeeCount: partySize } });
    await markInvitation(params.eventId, params.patientId, "rsvp_yes");
    await audit(params.actorId ?? params.patientId, AuditAction.RSVP_UPDATED, existing!.id, `Party size set to ${partySize}`);
    return { ok: true, rsvpId: existing!.id, token: null, created: false };
  }

  const token = generateToken();
  const data = {
    status: "confirmed",
    attendeeCount: partySize,
    source: params.source,
    checkInTokenHash: hashToken(token),
    cancelledAt: null,
    reminderSent: false,
    rsvpDate: new Date(),
  };
  const rsvp = existing
    ? await prisma.rsvp.update({ where: { id: existing.id }, data })
    : await prisma.rsvp.create({ data: { eventId: params.eventId, patientId: params.patientId, ...data } });

  await markInvitation(params.eventId, params.patientId, "rsvp_yes");
  await audit(params.actorId ?? params.patientId, AuditAction.RSVP_CREATED, rsvp.id, `RSVP yes via ${params.source}, party of ${partySize}`);

  if (params.sendEmail !== false) {
    await sendRsvpEmail({ kind: "confirmation", patient, event, partySize, token });
  }
  return { ok: true, rsvpId: rsvp.id, token, created: true };
}

/** Cancel (soft): invalidates the QR/token, updates the invitation, sends the cancellation email. */
export async function cancelRsvp(params: { rsvpId: string; actorId?: string; sendEmail?: boolean }) {
  const rsvp = await prisma.rsvp.findUnique({
    where: { id: params.rsvpId },
    include: { event: true, patient: { include: { contactProfile: true } } },
  });
  if (!rsvp || rsvp.cancelledAt) return { ok: false as const, error: "RSVP not found", status: 404 };
  if (eventHasEnded(rsvp.event.eventDate))
    return { ok: false as const, error: "This event has ended", status: 400 };

  await prisma.rsvp.update({
    where: { id: rsvp.id },
    data: { cancelledAt: new Date(), status: "cancelled", checkInTokenHash: null },
  });
  await markInvitation(rsvp.eventId, rsvp.patientId, "rsvp_no");
  await audit(params.actorId ?? rsvp.patientId, AuditAction.RSVP_CANCELLED, rsvp.id, "RSVP cancelled");
  if (params.sendEmail !== false) {
    await sendRsvpEmail({ kind: "cancelled", patient: rsvp.patient, event: rsvp.event, partySize: rsvp.attendeeCount });
  }
  return { ok: true as const };
}

/** An invitation answered "no" without ever having an RSVP. */
export async function declineInvitation(eventId: string, patientId: string) {
  await markInvitation(eventId, patientId, "rsvp_no");
}

/**
 * Issue a NEW check-in token for an active RSVP (the old QR/link stops working)
 * and email it. Used by "resend my QR" and by the day-before reminder: raw tokens
 * aren't stored, so they can only be re-delivered by minting a fresh one.
 */
export async function reissueCheckInToken(rsvpId: string, kind: "confirmation" | "reminder") {
  const rsvp = await prisma.rsvp.findUnique({
    where: { id: rsvpId },
    include: { event: true, patient: { include: { contactProfile: true } } },
  });
  if (!rsvp || rsvp.cancelledAt || eventHasEnded(rsvp.event.eventDate)) return null;
  const token = generateToken();
  await prisma.rsvp.update({ where: { id: rsvp.id }, data: { checkInTokenHash: hashToken(token) } });
  const sent = await sendRsvpEmail({ kind, patient: rsvp.patient, event: rsvp.event, partySize: rsvp.attendeeCount, token });
  return { token, sent };
}
