/**
 * Board-recorded consent changes (President/VP on the patient page). PURE: unit-tested in scripts/check-merge.ts.
 *
 *  - A change appends a ConsentRecord (method "board", recordedByBoardUserId = the officer, reasonCode). Never an update.
 *  - A reason is required. Withdrawing is ALWAYS allowed, with any reason.
 *  - Turning a consent ON is allowed only when the family asked (FAMILY_ASKED_*): the board never opts a family in on its own.
 */
export const BOARD_REASONS = ["FAMILY_ASKED_PHONE", "FAMILY_ASKED_EMAIL", "FAMILY_ASKED_IN_PERSON", "OTHER"] as const;
export type BoardReason = (typeof BOARD_REASONS)[number];
export const isBoardReason = (r: unknown): r is BoardReason => typeof r === "string" && (BOARD_REASONS as readonly string[]).includes(r);
export const isFamilyAsked = (r: BoardReason) => r.startsWith("FAMILY_ASKED_");

/** The household's own consents. */
export const PATIENT_BOARD_TYPES = ["data_and_contact", "media", "sms", "newsletter"] as const;
/** What a confirmed adult member answers for themselves. */
export const MEMBER_BOARD_TYPES = ["data_and_contact", "media"] as const;
export type BoardConsentType = (typeof PATIENT_BOARD_TYPES)[number];

export const isBoardTypeFor = (subject: "patient" | "member", t: unknown): t is BoardConsentType =>
  typeof t === "string" && ((subject === "patient" ? PATIENT_BOARD_TYPES : MEMBER_BOARD_TYPES) as readonly string[]).includes(t);

export type BoardChangeCheck = { ok: true } | { ok: false; error: "bad_reason" | "family_ask_required" | "no_change" };

/** `current` = the newest record's value (null: never recorded). */
export function checkBoardChange(current: boolean | null, granted: boolean, reason: unknown): BoardChangeCheck {
  if (!isBoardReason(reason)) return { ok: false, error: "bad_reason" };
  if (current === granted) return { ok: false, error: "no_change" };
  if (granted && !isFamilyAsked(reason)) return { ok: false, error: "family_ask_required" };
  return { ok: true };
}
