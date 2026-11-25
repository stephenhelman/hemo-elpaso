import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/tokens";
import { decryptCheckInToken, encryptCheckInToken } from "@/lib/crypto/checkin-token";
import { checkRsvpEligibility, type RsvpBlock } from "./eligibility";
import { eventHasEnded } from "./window";
import { sendRsvpEmail } from "./emails";
import { rsvpGate } from "@/lib/review/service";
import { applyAttendees, parseSelection, selectableMembers, selectionTotal, type AttendeeSelection } from "./attendees";

const MAX_PARTY_LEGACY = 30;
// "public" = the retired anonymous event-page form (old rows only). "portal" = a signed-in household. "link" = an emailed RSVP link.
export type RsvpSource = "invite" | "public" | "manual" | "portal" | "link" | "request";

type Fail = { ok: false; code: RsvpBlock | "NOT_FOUND" | "NOT_APPROVED" | "NOT_INVITED"; error: string; status: number };

/** Mark any invitation for this patient/event as answered. */
async function markInvitation(eventId: string, patientId: string, status: "rsvp_yes" | "rsvp_no") {
  await prisma.invitation.updateMany({ where: { eventId, patientId, status: { not: "removed" } }, data: { status } });
}

async function audit(actorId: string | null, action: AuditAction, rsvpId: string, details: string) {
  await prisma.auditLog.create({
    data: { patientId: actorId, action, resourceType: "Rsvp", resourceId: rsvpId, details },
  });
}

/**
 * Create / reactivate / update a YES RSVP for a chosen set of people.
 * `selection` = who is coming (primary, household members, unlisted guests); the
 * legacy `partySize` means "the primary plus (partySize - 1) guests" (walk-ins).
 * attendeeCount is DERIVED (attendee rows + guests) and written with them.
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
  selection?: unknown; // AttendeeSelection-shaped, validated here
  partySize?: number;
  source: RsvpSource;
  actorId?: string;
  ignoreDeadline?: boolean;
  ignoreCapacity?: boolean;
  sendEmail?: boolean;
  /** in_person (default): counts against capacity, gets the QR. virtual: takes no seat, gets the Meet and YouTube links. Only set for a NEW RSVP. */
  attendanceType?: "in_person" | "virtual";
  /**
   * Board-entered RSVP (call-in, walk-in): bypasses the registration-review gate. If the gate WOULD have refused, one
   * RSVP_APPROVAL_OVERRIDDEN audit row (ids and codes only) records it. Self-service callers never set this.
   */
  boardOverride?: boolean;
}): Promise<
  | { ok: true; rsvpId: string; token: string | null; created: boolean }
  | Fail
> {
  let sel: AttendeeSelection | null;
  if (params.selection !== undefined) {
    const members = await selectableMembers(params.patientId);
    sel = parseSelection(params.selection, members.map((m) => m.id));
  } else {
    const n = Math.floor(params.partySize ?? 0);
    sel = Number.isInteger(n) && n >= 1 && n <= MAX_PARTY_LEGACY ? { primary: true, memberIds: [], guests: n - 1 } : null;
  }
  if (!sel) return { ok: false, code: "NOT_FOUND", error: "Choose at least one person (guests 0 to 10)", status: 400 };
  const partySize = selectionTotal(sel);
  // A NEW RSVP follows its invitation (the board may have switched a matched invitation to virtual) unless the caller says otherwise.
  const invitedType = params.attendanceType ? null : (await prisma.invitation.findUnique({ where: { eventId_patientId: { eventId: params.eventId, patientId: params.patientId } }, select: { attendanceType: true, status: true } }));
  const attendanceType: "in_person" | "virtual" = params.attendanceType ?? (invitedType && invitedType.status !== "removed" && invitedType.attendanceType === "virtual" ? "virtual" : "in_person");

  const existing = await prisma.rsvp.findUnique({
    where: { eventId_patientId: { eventId: params.eventId, patientId: params.patientId } },
  });
  const active = existing && !existing.cancelledAt;

  // Registration review: a NEW (or reactivated) RSVP needs an approved household (and an invitation where the event
  // requires one). An RSVP that is already active is never re-gated, so existing RSVPs stay valid.
  let overridden: string | null = null;
  if (!active) {
    const gate = await rsvpGate(params.eventId, params.patientId);
    if (!gate.ok) {
      if (!params.boardOverride) {
        return { ok: false, code: gate.code, error: gate.code === "NOT_APPROVED" ? "Registration is under review" : "This event is by invitation", status: 403 };
      }
      overridden = gate.code;
    }
  }

  // Deadline only blocks NEW yes or an INCREASE; lowering is always fine.
  const increasing = !active || partySize > existing!.attendeeCount;
  const elig = await checkRsvpEligibility({
    eventId: params.eventId,
    partySize,
    excludeRsvpId: active ? existing!.id : undefined,
    ignoreDeadline: params.ignoreDeadline || !increasing,
    ignoreCapacity: params.ignoreCapacity || attendanceType === "virtual",
  });
  if (!elig.ok) return elig;
  const { event } = elig;

  const patient = await prisma.patient.findUnique({
    where: { id: params.patientId },
    include: { contactProfile: true },
  });
  if (!patient) return { ok: false, code: "NOT_FOUND", error: "Patient not found", status: 404 };

  if (active) {
    await prisma.$transaction((tx) => applyAttendees(tx, existing!.id, sel!));
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
    checkInTokenEnc: encryptCheckInToken(token),
    cancelledAt: null,
    reminderSent: false,
    rsvpDate: new Date(),
    attendanceType,
  };
  const rsvp = await prisma.$transaction(async (tx) => {
    const row = existing
      ? await tx.rsvp.update({ where: { id: existing.id }, data })
      : await tx.rsvp.create({ data: { eventId: params.eventId, patientId: params.patientId, ...data } });
    await applyAttendees(tx, row.id, sel!);
    return row;
  });

  await markInvitation(params.eventId, params.patientId, "rsvp_yes");
  await audit(params.actorId ?? params.patientId, AuditAction.RSVP_CREATED, rsvp.id, `RSVP yes via ${params.source}, party of ${partySize}`);
  if (overridden) {
    await prisma.auditLog.create({
      data: {
        patientId: params.actorId ?? null, actorType: "board", action: AuditAction.RSVP_APPROVAL_OVERRIDDEN, resourceType: "Rsvp", resourceId: rsvp.id,
        details: `Board entered an RSVP past the review gate (${overridden})`, changes: { eventId: params.eventId, householdId: params.patientId, code: overridden },
      },
    });
  }

  if (params.sendEmail !== false) {
    await sendRsvpEmail({ kind: "confirmation", patient, event, partySize, token, attendanceType });
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
  if (eventHasEnded(rsvp.event))
    return { ok: false as const, error: "This event has ended", status: 400 };

  await prisma.rsvp.update({
    where: { id: rsvp.id },
    data: { cancelledAt: new Date(), status: "cancelled", checkInTokenHash: null, checkInTokenEnc: null },
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
 * Re-deliver an active RSVP's QR/link by email ("resend my QR", day-before
 * reminder). Each RSVP keeps ONE QR for its lifetime (until cancelled and
 * reactivated): the stored encrypted token is decrypted and reused.
 * Only a legacy RSVP with no encrypted copy (or an undecryptable one) gets a
 * one-time new token, which is then stored encrypted too.
 */
export async function reissueCheckInToken(rsvpId: string, kind: "confirmation" | "reminder") {
  const rsvp = await prisma.rsvp.findUnique({
    where: { id: rsvpId },
    include: { event: true, patient: { include: { contactProfile: true } } },
  });
  if (!rsvp || rsvp.cancelledAt || eventHasEnded(rsvp.event)) return null;

  let token = decryptCheckInToken(rsvp.checkInTokenEnc);
  if (!token || hashToken(token) !== rsvp.checkInTokenHash) {
    token = generateToken();
    await prisma.rsvp.update({
      where: { id: rsvp.id },
      data: { checkInTokenHash: hashToken(token), checkInTokenEnc: encryptCheckInToken(token) },
    });
  }
  const sent = await sendRsvpEmail({ kind, patient: rsvp.patient, event: rsvp.event, partySize: rsvp.attendeeCount, token, attendanceType: rsvp.attendanceType === "virtual" ? "virtual" : "in_person" });
  return { token, sent };
}
