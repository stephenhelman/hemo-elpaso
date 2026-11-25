import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { generateToken, hashToken } from "@/lib/tokens";
import { isFeatureEnabled } from "@/lib/features";
import { getGateCutoff } from "@/lib/review/service";
import { cancelRsvp, reissueCheckInToken, rsvpYes, type RsvpSource } from "./actions";
import { activeHeadcount } from "./eligibility";
import { parseSelection, selectableMembers, selectionTotal, type AttendeeSelection } from "./attendees";
import { sendRequestEmail } from "./emails";
import {
  confirmBlock, decideRsvpPath, isDeclineReason, isOpen, mayResubmit, requestWindowOpen,
  type AttendanceType, type ConfirmBlock, type DeclineReason, type RequestSource,
} from "./request-rules";

/**
 * RSVP requests: a household that wasn't invited asks to attend; the board decides in person or virtual.
 * Every audit row here holds ids, statuses and reason codes only.
 */

const EMAIL_SELECT = { id: true, email: true, preferredLanguage: true, reviewStatus: true, contactProfile: { select: { firstName: true } } } as const;

export type SubmitResult =
  | { kind: "rsvp"; rsvpId: string; token: string | null }
  | { kind: "request"; requestId: string; status: string; existing: boolean }
  | { kind: "already" }
  | { kind: "closed" }
  | { kind: "by_invitation" }
  | { kind: "blocked" } // an earlier request was declined in a way that doesn't reopen
  | { kind: "error"; code: "NOT_FOUND" | "BAD_SELECTION" | "FULL" | "FAILED"; status: number };

/** Map the entry point to the Rsvp.source / request source. */
const rsvpSource = (s: RequestSource): RsvpSource => (s === "emailed_link" ? "link" : "portal");

/**
 * The ONE entry for "this household wants to attend this event" (modal, emailed link, family page).
 *  - active RSVP already: nothing to do
 *  - invited and approved (or invited before the review cutoff): RSVP right away, as before
 *  - otherwise: a request (waiting on household review until the household is approved)
 */
export async function rsvpOrRequest(params: {
  eventId: string; patientId: string; source: RequestSource; selection: unknown; actorMemberId?: string | null;
}): Promise<SubmitResult> {
  const [event, patient, invitation, cutoff, active] = await Promise.all([
    prisma.event.findUnique({ where: { id: params.eventId } }),
    prisma.patient.findUnique({ where: { id: params.patientId }, select: EMAIL_SELECT }),
    prisma.invitation.findUnique({ where: { eventId_patientId: { eventId: params.eventId, patientId: params.patientId } }, select: { createdAt: true, status: true } }),
    getGateCutoff(),
    prisma.rsvp.findFirst({ where: { eventId: params.eventId, patientId: params.patientId, cancelledAt: null }, select: { id: true } }),
  ]);
  if (!event || !patient) return { kind: "error", code: "NOT_FOUND", status: 404 };
  if (active) return { kind: "already" };

  const decision = decideRsvpPath({ reviewStatus: patient.reviewStatus, invitation, event, cutoff });

  if (decision.path === "direct") {
    const r = await rsvpYes({ eventId: event.id, patientId: patient.id, selection: params.selection, source: rsvpSource(params.source) });
    if (r.ok) return { kind: "rsvp", rsvpId: r.rsvpId, token: r.token };
    if (r.code === "AT_CAPACITY") return { kind: "error", code: "FULL", status: 409 };
    if (r.code === "DEADLINE_PASSED" || r.code === "ENDED" || r.code === "NOT_PUBLISHED") return { kind: "closed" };
    if (r.code === "NOT_FOUND") return { kind: "error", code: "BAD_SELECTION", status: 400 };
    return { kind: "error", code: "FAILED", status: r.status };
  }

  if (!requestWindowOpen(event)) return { kind: "closed" };
  if (decision.path === "refuse") return { kind: "by_invitation" };

  const members = await selectableMembers(patient.id);
  const sel = parseSelection(params.selection, members.map((m) => m.id));
  if (!sel) return { kind: "error", code: "BAD_SELECTION", status: 400 };

  // One open request per event and household: a second submit updates who is coming and returns the same request.
  const open = await prisma.rsvpRequest.findFirst({ where: { eventId: event.id, patientId: patient.id, status: { in: ["waiting_household_review", "pending", "waitlisted"] } } });
  if (open) {
    const updated = await prisma.rsvpRequest.update({ where: { id: open.id }, data: selectionData(sel) });
    return { kind: "request", requestId: updated.id, status: updated.status, existing: true };
  }
  const last = await prisma.rsvpRequest.findFirst({ where: { eventId: event.id, patientId: patient.id }, orderBy: { createdAt: "desc" }, select: { status: true, declineReason: true } });
  if (!mayResubmit(last)) return { kind: "blocked" };

  const created = await createRequest({ eventId: event.id, patientId: patient.id, source: params.source, status: decision.initialStatus, sel, actorMemberId: params.actorMemberId ?? null });
  if (!created) { // lost a race with another submit: return the winner
    const winner = await prisma.rsvpRequest.findFirst({ where: { eventId: event.id, patientId: patient.id, status: { in: ["waiting_household_review", "pending", "waitlisted"] } } });
    return winner ? { kind: "request", requestId: winner.id, status: winner.status, existing: true } : { kind: "error", code: "FAILED", status: 500 };
  }
  await sendRequestEmail({ kind: "received", patient, event });
  return { kind: "request", requestId: created.id, status: created.status, existing: false };
}

const selectionData = (sel: AttendeeSelection) => ({ selPrimary: sel.primary, selMemberIds: sel.memberIds, selGuests: sel.guests, partySize: selectionTotal(sel) });

async function createRequest(i: { eventId: string; patientId: string; source: RequestSource; status: "pending" | "waiting_household_review"; sel: AttendeeSelection; actorMemberId: string | null; actorBoardId?: string }) {
  try {
    const row = await prisma.rsvpRequest.create({ data: { eventId: i.eventId, patientId: i.patientId, source: i.source, status: i.status, ...selectionData(i.sel) } });
    await audit({
      actorType: i.actorBoardId ? "board" : "family", actorPatientId: i.actorBoardId ?? i.patientId, actorMemberId: i.actorMemberId,
      action: AuditAction.RSVP_REQUEST_CREATED, resourceType: "RsvpRequest", resourceId: row.id,
      details: `RSVP request created (${i.source}, ${i.status})`,
      changes: { eventId: i.eventId, householdId: i.patientId, requestId: row.id, source: i.source, status: i.status, partySize: row.partySize },
    });
    return row;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return null; // the one-open-request index
    throw e;
  }
}

/**
 * A household that just registered from the modal asks to attend that event. It waits on household review.
 * Silent when the event can't take a request (unknown, unpublished, closed, by invitation): registration itself never fails because of it.
 */
export async function createRegistrationRequest(eventId: unknown, patientId: string): Promise<string | null> {
  if (typeof eventId !== "string" || !eventId) return null;
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || !requestWindowOpen(event) || !event.allowUninvitedRequests) return null;
  const members = await selectableMembers(patientId);
  const sel: AttendeeSelection = { primary: true, memberIds: members.map((m) => m.id), guests: 0 };
  const patient = await prisma.patient.findUnique({ where: { id: patientId }, select: { reviewStatus: true } });
  const created = await createRequest({ eventId, patientId, source: "registration", status: patient?.reviewStatus === "approved" ? "pending" : "waiting_household_review", sel, actorMemberId: null });
  return created?.id ?? null;
}

/** An approved household's waiting requests become pending. Called when the household is approved. Returns how many moved. */
export async function promoteWaitingRequests(householdId: string, actorId: string | null): Promise<number> {
  const waiting = await prisma.rsvpRequest.findMany({ where: { patientId: householdId, status: "waiting_household_review" }, select: { id: true, eventId: true } });
  let n = 0;
  for (const w of waiting) {
    const r = await prisma.rsvpRequest.updateMany({ where: { id: w.id, status: "waiting_household_review" }, data: { status: "pending" } });
    if (r.count === 0) continue;
    n++;
    await audit({
      actorType: actorId ? "board" : "system", actorPatientId: actorId, action: AuditAction.RSVP_REQUEST_PROMOTED, resourceType: "RsvpRequest", resourceId: w.id,
      details: "RSVP request: household approved, now pending", changes: { eventId: w.eventId, householdId, requestId: w.id, from: "waiting_household_review", status: "pending" },
    });
  }
  return n;
}

// ── board decisions ───────────────────────────────────────────────────────────────────────────────────────────
export type ConfirmResult = { ok: true; rsvpId: string; invitationId: string } | { ok: false; code: ConfirmBlock | "NOT_FOUND" | "FAILED"; error: string; status: number };

/** Lock key so two board members confirming at once can't both take the last spots. */
const lockEvent = (tx: Prisma.TransactionClient, eventId: string) => tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${eventId}))`;

/**
 * Confirm a request in person or virtual. Creates exactly ONE invitation (origin "request", the chosen attendance type)
 * and ONE RSVP, then sends the matching confirmation (QR for in person, Meet + YouTube links for virtual).
 * In person is blocked at capacity (confirmed in-person spots only). Virtual needs the event's virtual option AND the "recordings" toggle.
 */
export async function confirmRequest(params: { requestId: string; type: AttendanceType; adminId: string; /** tests only: the routes never set it */ recordingsOn?: boolean }): Promise<ConfirmResult> {
  const recordingsOn = params.recordingsOn ?? (await isFeatureEnabled("recordings"));
  const claimed = await prisma.$transaction(async (tx) => {
    const req = await tx.rsvpRequest.findUnique({ where: { id: params.requestId }, include: { event: true, patient: { select: { reviewStatus: true } } } });
    if (!req) return { fail: { ok: false as const, code: "NOT_FOUND" as const, error: "Request not found", status: 404 } };
    await lockEvent(tx, req.eventId);
    const fresh = await tx.rsvpRequest.findUnique({ where: { id: req.id }, select: { status: true } });
    const taken = await tx.rsvp.aggregate({ where: { eventId: req.eventId, cancelledAt: null, attendanceType: "in_person" }, _sum: { attendeeCount: true } });
    const block = confirmBlock({
      type: params.type, status: fresh?.status ?? req.status, householdApproved: req.patient.reviewStatus === "approved", partySize: req.partySize,
      inPersonTaken: taken._sum.attendeeCount ?? 0, event: req.event, recordingsOn,
    });
    if (block) return { fail: { ok: false as const, code: block, error: block, status: 409 } };

    const existing = await tx.invitation.findUnique({ where: { eventId_patientId: { eventId: req.eventId, patientId: req.patientId } } });
    let created = false;
    let invitationId: string;
    if (existing) {
      invitationId = existing.id;
      await tx.invitation.update({
        where: { id: existing.id },
        data: { attendanceType: params.type, ...(existing.status === "removed" ? { status: "pending", origin: "request", removedAt: null, removedByBoardUserId: null, removalReason: null } : {}) },
      });
    } else {
      created = true;
      invitationId = (await tx.invitation.create({ data: { eventId: req.eventId, patientId: req.patientId, tokenHash: hashToken(generateToken()), status: "pending", origin: "request", attendanceType: params.type } })).id;
    }
    await tx.rsvpRequest.update({
      where: { id: req.id },
      data: { status: params.type === "virtual" ? "confirmed_virtual" : "confirmed_in_person", decidedByPatientId: params.adminId, decidedAt: new Date(), invitationId },
    });
    return { req, invitationId, created, prevStatus: fresh?.status ?? req.status, prevInvitation: existing };
  });
  if ("fail" in claimed && claimed.fail) return claimed.fail;
  const { req, invitationId, created, prevStatus, prevInvitation } = claimed as Exclude<typeof claimed, { fail: unknown }>;

  const sel: AttendeeSelection = { primary: req.selPrimary, memberIds: req.selMemberIds, guests: req.selGuests };
  const r = await rsvpYes({
    eventId: req.eventId, patientId: req.patientId, selection: sel, source: "request", actorId: params.adminId,
    attendanceType: params.type, boardOverride: true, ignoreDeadline: true, ignoreCapacity: true,
  });
  if (!r.ok) {
    // Undo the claim so the request can be decided again. A new invitation made by this call is removed; an old one is put back.
    await prisma.rsvpRequest.update({ where: { id: req.id }, data: { status: prevStatus, decidedByPatientId: null, decidedAt: null, invitationId: null } }).catch(() => {});
    if (created) await prisma.invitation.delete({ where: { id: invitationId } }).catch(() => {});
    else if (prevInvitation) await prisma.invitation.update({ where: { id: invitationId }, data: { attendanceType: prevInvitation.attendanceType, status: prevInvitation.status } }).catch(() => {});
    return { ok: false, code: "FAILED", error: r.error, status: r.status };
  }
  await prisma.rsvpRequest.update({ where: { id: req.id }, data: { rsvpId: r.rsvpId } });
  await audit({
    actorType: "board", actorPatientId: params.adminId, action: AuditAction.RSVP_REQUEST_CONFIRMED, resourceType: "RsvpRequest", resourceId: req.id,
    details: `RSVP request confirmed ${params.type}`,
    changes: { eventId: req.eventId, householdId: req.patientId, requestId: req.id, invitationId, rsvpId: r.rsvpId, attendanceType: params.type, partySize: req.partySize, from: prevStatus },
  });
  return { ok: true, rsvpId: r.rsvpId, invitationId };
}

/** pending -> waitlisted (the in-person spots are taken). The board can still confirm later. */
export async function waitlistRequest(params: { requestId: string; adminId: string }): Promise<{ ok: boolean; error?: string }> {
  const req = await prisma.rsvpRequest.findUnique({ where: { id: params.requestId }, include: { event: true, patient: { select: EMAIL_SELECT } } });
  if (!req) return { ok: false, error: "Request not found" };
  const r = await prisma.rsvpRequest.updateMany({ where: { id: req.id, status: "pending" }, data: { status: "waitlisted", decidedByPatientId: params.adminId, decidedAt: new Date() } });
  if (r.count === 0) return { ok: false, error: "Only a pending request can be waitlisted" };
  await audit({
    actorType: "board", actorPatientId: params.adminId, action: AuditAction.RSVP_REQUEST_WAITLISTED, resourceType: "RsvpRequest", resourceId: req.id,
    details: "RSVP request waitlisted", changes: { eventId: req.eventId, householdId: req.patientId, requestId: req.id, status: "waitlisted" },
  });
  await sendRequestEmail({ kind: "waitlisted", patient: req.patient, event: req.event });
  return { ok: true };
}

/** Decline with a reason code (stored, never shown to the family). EVENT_FULL is not accepted: a full event waitlists instead. */
export async function declineRequest(params: { requestId: string; reason: unknown; adminId: string }): Promise<{ ok: boolean; error?: string }> {
  if (!isDeclineReason(params.reason) || params.reason === "EVENT_FULL") return { ok: false, error: "Choose a reason" };
  const req = await prisma.rsvpRequest.findUnique({ where: { id: params.requestId }, include: { event: true, patient: { select: EMAIL_SELECT } } });
  if (!req) return { ok: false, error: "Request not found" };
  const r = await prisma.rsvpRequest.updateMany({
    where: { id: req.id, status: { in: ["waiting_household_review", "pending", "waitlisted"] } },
    data: { status: "declined", declineReason: params.reason, decidedByPatientId: params.adminId, decidedAt: new Date() },
  });
  if (r.count === 0) return { ok: false, error: "This request is already decided" };
  await audit({
    actorType: "board", actorPatientId: params.adminId, action: AuditAction.RSVP_REQUEST_DECLINED, resourceType: "RsvpRequest", resourceId: req.id,
    details: "RSVP request declined", changes: { eventId: req.eventId, householdId: req.patientId, requestId: req.id, from: req.status, reasonCode: params.reason },
  });
  await sendRequestEmail({ kind: "declined", patient: req.patient, event: req.event }); // no reason in the email
  return { ok: true };
}

/**
 * The family cancels. An unconfirmed request becomes `withdrawn`. A confirmed request cancels its RSVP through the
 * existing path (the request keeps its confirmed status as the record of what was decided).
 */
export async function withdrawRequest(params: { requestId: string; patientId: string; actorMemberId?: string | null }): Promise<{ ok: boolean; error?: string }> {
  const req = await prisma.rsvpRequest.findUnique({ where: { id: params.requestId } });
  if (!req || req.patientId !== params.patientId) return { ok: false, error: "Request not found" };
  if (isOpen(req.status)) {
    const r = await prisma.rsvpRequest.updateMany({ where: { id: req.id, status: { in: ["waiting_household_review", "pending", "waitlisted"] } }, data: { status: "withdrawn" } });
    if (r.count === 0) return { ok: false, error: "This request is already decided" };
  } else if (req.status === "confirmed_in_person" || req.status === "confirmed_virtual") {
    if (!req.rsvpId) return { ok: false, error: "Nothing to cancel" };
    const c = await cancelRsvp({ rsvpId: req.rsvpId, actorId: params.patientId });
    if (!c.ok) return { ok: false, error: c.error };
  } else return { ok: false, error: "This request is already closed" };
  await audit({
    actorType: "family", actorPatientId: params.patientId, actorMemberId: params.actorMemberId ?? null, action: AuditAction.RSVP_REQUEST_WITHDRAWN, resourceType: "RsvpRequest", resourceId: req.id,
    details: "RSVP request withdrawn by the family", changes: { eventId: req.eventId, householdId: req.patientId, requestId: req.id, from: req.status },
  });
  return { ok: true };
}

/** Switch a (matched or any) invitation's attendance type. Moves an active RSVP with it and sends the matching email. Virtual needs the same gates as confirming. */
export async function setInvitationAttendance(params: { invitationId: string; type: AttendanceType; adminId: string; /** tests only */ recordingsOn?: boolean }): Promise<{ ok: boolean; error?: string; code?: ConfirmBlock }> {
  const inv = await prisma.invitation.findUnique({ where: { id: params.invitationId }, include: { event: true } });
  if (!inv || inv.status === "removed") return { ok: false, error: "Invitation not found" };
  if (inv.attendanceType === params.type) return { ok: true };
  if (params.type === "virtual") {
    const block = confirmBlock({ type: "virtual", status: "pending", householdApproved: true, partySize: 1, inPersonTaken: 0, event: inv.event, recordingsOn: params.recordingsOn ?? (await isFeatureEnabled("recordings")) });
    if (block) return { ok: false, code: block, error: block };
  }
  const rsvp = await prisma.rsvp.findFirst({ where: { eventId: inv.eventId, patientId: inv.patientId, cancelledAt: null } });
  if (rsvp && params.type === "in_person" && inv.event.maxCapacity) {
    const taken = await activeHeadcount(inv.eventId, rsvp.id);
    if (taken + rsvp.attendeeCount > inv.event.maxCapacity) return { ok: false, code: "AT_CAPACITY", error: "AT_CAPACITY" };
  }
  await prisma.$transaction([
    prisma.invitation.update({ where: { id: inv.id }, data: { attendanceType: params.type } }),
    ...(rsvp ? [prisma.rsvp.update({ where: { id: rsvp.id }, data: { attendanceType: params.type } })] : []),
  ]);
  await audit({
    actorType: "board", actorPatientId: params.adminId, action: AuditAction.INVITATION_ATTENDANCE_CHANGED, resourceType: "Invitation", resourceId: inv.id,
    details: `Attendance ${inv.attendanceType} -> ${params.type}`, changes: { eventId: inv.eventId, householdId: inv.patientId, invitationId: inv.id, from: inv.attendanceType, attendanceType: params.type, rsvpId: rsvp?.id ?? null },
  });
  // Someone already RSVPed: send the confirmation that matches the new type (links for virtual, QR for in person).
  if (rsvp) await reissueCheckInToken(rsvp.id, "confirmation").catch(() => null);
  return { ok: true };
}
