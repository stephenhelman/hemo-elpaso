/**
 * Registration review + RSVP access rules. PURE (no DB, no Next, no env): unit-tested in scripts/check-review.ts.
 *
 * Statuses: pending_review | approved | on_hold. On hold needs a reason code. No eligibility rules beyond that yet
 * (the board will write those): approving is a person's decision.
 */
export const REVIEW_STATUSES = ["pending_review", "approved", "on_hold"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export const HOLD_REASONS = ["NEEDS_CALL", "POSSIBLE_DUPLICATE", "NO_AFFECTED_MEMBER_STATED", "OTHER"] as const;
export type HoldReason = (typeof HOLD_REASONS)[number];

export const isReviewStatus = (v: unknown): v is ReviewStatus => typeof v === "string" && (REVIEW_STATUSES as readonly string[]).includes(v);
export const isHoldReason = (v: unknown): v is HoldReason => typeof v === "string" && (HOLD_REASONS as readonly string[]).includes(v);

/** A status change as the DB stores it, or null when the request is not valid (on_hold needs a reason; the others take none). */
export function normalizeChange(status: unknown, reason: unknown): { status: ReviewStatus; reason: HoldReason | null } | null {
  if (!isReviewStatus(status)) return null;
  if (status === "on_hold") return isHoldReason(reason) ? { status, reason } : null;
  return reason == null || reason === "" ? { status, reason: null } : null;
}

export const HOLD_REASON_LABEL: Record<HoldReason, { en: string; es: string }> = {
  NEEDS_CALL: { en: "Needs a call", es: "Necesita una llamada" },
  POSSIBLE_DUPLICATE: { en: "Possible duplicate", es: "Posible duplicado" },
  NO_AFFECTED_MEMBER_STATED: { en: "No affected member stated", es: "Sin persona afectada indicada" },
  OTHER: { en: "Other", es: "Otro" },
};

// ── RSVP access ───────────────────────────────────────────────────────────────────────────────────────────────
export type RsvpAccess = "invited_only" | "any_approved";
export const isRsvpAccess = (v: unknown): v is RsvpAccess => v === "invited_only" || v === "any_approved";

/** Diagnosis-targeted = the event targets conditions, severity or inhibitors. Age-only targeting does not count. */
export function isDiagnosisTargeted(t: { targetConditions: string[]; targetSeverity: string[]; requireInhibitors: boolean | null } | null | undefined): boolean {
  return !!t && (t.targetConditions.length > 0 || t.targetSeverity.length > 0 || t.requireInhibitors === true);
}

/** The cutoff stored in app_settings ("review_gate_cutoff", an ISO string written by the migration). Null = unknown. */
export function parseCutoff(v: unknown): Date | null {
  if (typeof v !== "string") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface InvitationFacts { createdAt: Date; status: string }

/** Invitations created before the cutoff keep working for households that are not approved. With no cutoff, nothing is grandfathered. */
export const invitationGrandfathered = (inv: InvitationFacts | null | undefined, cutoff: Date | null): boolean =>
  !!inv && inv.status !== "removed" && !!cutoff && inv.createdAt.getTime() < cutoff.getTime();

export type RsvpDecision =
  | { ok: true; reason: "approved" | "grandfathered_invitation" }
  | { ok: false; code: "NOT_APPROVED" | "NOT_INVITED" };

/**
 * May this household start (or restart) an RSVP for this event?
 *  1. An invitation created before the cutoff always works (grandfathered), whatever the household's status.
 *  2. Otherwise the household must be approved.
 *  3. Diagnosis-targeted and invited-only events additionally need a (non-removed) invitation.
 * Changing or cancelling an RSVP that is already active is not decided here: existing RSVPs stay valid.
 */
export function decideRsvp(i: {
  reviewStatus: string;
  invitation: InvitationFacts | null;
  event: { rsvpAccess: string; diagnosisTargeted: boolean };
  cutoff: Date | null;
}): RsvpDecision {
  if (invitationGrandfathered(i.invitation, i.cutoff)) return { ok: true, reason: "grandfathered_invitation" };
  if (i.reviewStatus !== "approved") return { ok: false, code: "NOT_APPROVED" };
  const invited = !!i.invitation && i.invitation.status !== "removed";
  const needsInvite = i.event.diagnosisTargeted || i.event.rsvpAccess !== "any_approved";
  if (needsInvite && !invited) return { ok: false, code: "NOT_INVITED" };
  return { ok: true, reason: "approved" };
}

// ── review flags ──────────────────────────────────────────────────────────────────────────────────────────────
export interface ReviewFacts {
  email: string | null;
  phone: string | null;
  /** Nobody in the household stated a bleeding disorder. A yes/no only: the diagnoses themselves never reach this code. */
  noAffected: boolean;
  adultsPending: number;
  addressLine1: string | null;
  city: string | null;
  zipCode: string | null;
  duplicate: boolean;
}
export interface ReviewFlags { phoneOnly: boolean; noAffectedMember: boolean; adultsPending: boolean; possibleDuplicate: boolean; unstructuredAddress: boolean }

/** A free-text address from before structured fields: line 1 present, no city and no ZIP. Never auto-parsed. */
export const isUnstructuredAddress = (a: { addressLine1: string | null; city: string | null; zipCode: string | null }) =>
  !!a.addressLine1?.trim() && !a.city?.trim() && !a.zipCode?.trim();

export function reviewFlags(f: ReviewFacts): ReviewFlags {
  return {
    phoneOnly: !f.email && !!f.phone,
    noAffectedMember: f.noAffected,
    adultsPending: f.adultsPending > 0,
    possibleDuplicate: f.duplicate,
    unstructuredAddress: isUnstructuredAddress(f),
  };
}
