/**
 * Why a board member removed a household from an event's invitation list. CODES ONLY, never free text: a free-text
 * box in an audit trail is where names and diagnoses end up. Pure (no DB) so it is unit-testable.
 */
export const REMOVAL_REASONS = [
  "ASKED_NOT_INVITED",
  "DUPLICATE_HOUSEHOLD",
  "MOVED_AWAY",
  "NOT_ELIGIBLE_FOR_EVENT",
  "CONTACTING_BY_PHONE",
  "OTHER",
] as const;
export type RemovalReason = (typeof REMOVAL_REASONS)[number];

export const isRemovalReason = (v: unknown): v is RemovalReason =>
  typeof v === "string" && (REMOVAL_REASONS as readonly string[]).includes(v);

export const REMOVAL_REASON_LABELS: Record<RemovalReason, string> = {
  ASKED_NOT_INVITED: "Asked not to be invited",
  DUPLICATE_HOUSEHOLD: "Duplicate household",
  MOVED_AWAY: "Moved away",
  NOT_ELIGIBLE_FOR_EVENT: "Not eligible for this event",
  CONTACTING_BY_PHONE: "Contacting by phone instead",
  OTHER: "Other",
};

/** What triggered an automatic or manual match (stored in the audit row's `changes.trigger`). */
export const MATCH_TRIGGERS = ["publish", "edit", "manual_regenerate", "manual_add", "manual_restore"] as const;
export type MatchTrigger = (typeof MATCH_TRIGGERS)[number];
