import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { normalizeChange, parseCutoff, type RsvpDecision } from "./rules";
import { decideRsvpPath } from "@/lib/rsvp/request-rules";
import { promoteWaitingRequests } from "@/lib/rsvp/requests";

export const CUTOFF_KEY = "review_gate_cutoff";

export async function getGateCutoff(): Promise<Date | null> {
  const row = await prisma.appSetting.findUnique({ where: { key: CUTOFF_KEY } });
  return parseCutoff(row?.value);
}

/** The gate for one household and event, from the database. Callers decide what to do with a refusal. */
export async function rsvpGate(eventId: string, patientId: string): Promise<RsvpDecision & { reviewStatus: string }> {
  const [patient, event, invitation, cutoff] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId }, select: { reviewStatus: true } }),
    prisma.event.findUnique({ where: { id: eventId }, select: { allowUninvitedRequests: true } }),
    prisma.invitation.findUnique({ where: { eventId_patientId: { eventId, patientId } }, select: { createdAt: true, status: true } }),
    getGateCutoff(),
  ]);
  const reviewStatus = patient?.reviewStatus ?? "pending_review";
  if (!event) return { ok: false, code: "NOT_APPROVED", reviewStatus };
  // Only the direct path (invited, and approved or invited before the cutoff) may RSVP right away. Everyone else asks to attend (lib/rsvp/requests).
  const d = decideRsvpPath({ reviewStatus, invitation, event, cutoff });
  if (d.path === "direct") return { ok: true, reason: reviewStatus === "approved" ? "approved" : "grandfathered_invitation", reviewStatus };
  return { ok: false, code: d.path === "request" && d.initialStatus === "waiting_household_review" ? "NOT_APPROVED" : "NOT_INVITED", reviewStatus };
}

/**
 * Change a household's review status. The audit row holds ids, the new status and the reason code only.
 * Returns false when the request is invalid or the household does not exist.
 */
export async function setReviewStatus(actorId: string, householdId: string, status: unknown, reason: unknown): Promise<boolean> {
  const change = normalizeChange(status, reason);
  if (!change) return false;
  const p = await prisma.patient.findUnique({ where: { id: householdId }, select: { reviewStatus: true, role: true, mergedIntoId: true } });
  if (!p || p.mergedIntoId || p.role === "merged") return false;
  await prisma.patient.update({
    where: { id: householdId },
    data: { reviewStatus: change.status, reviewHoldReason: change.reason, reviewedAt: new Date(), reviewedByPatientId: actorId },
  });
  await audit({
    actorType: "board", actorPatientId: actorId, action: AuditAction.REVIEW_STATUS_CHANGED, resourceType: "Patient", resourceId: householdId,
    details: `Review status ${p.reviewStatus} -> ${change.status}`,
    changes: { householdId, from: p.reviewStatus, status: change.status, reasonCode: change.reason },
  });
  // Requests that were waiting on this household's review move to pending.
  if (change.status === "approved") await promoteWaitingRequests(householdId, actorId);
  return true;
}
