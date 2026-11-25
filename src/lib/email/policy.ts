import type { CodeEmailKind } from "@/lib/email/send";
import { currentConsents } from "@/lib/patients/query";

/**
 * Which emails still go to someone who withdrew their "store my information and contact me" consent.
 *
 * ESSENTIAL (still sent): the confirmation, reminder and cancellation for an RSVP the person keeps. They are part of
 * the event they signed up for and stop on their own when the RSVP is cancelled (the reminder cron skips cancelled RSVPs).
 * EVERYTHING ELSE is non-essential and is blocked once the latest data_and_contact record is a withdrawal:
 * invitations, the registration confirmation re-send, adult-member confirmation links, and any future mail.
 *
 * "Withdrawn" means the NEWEST data_and_contact record has granted = false. Never recorded (null) is not a
 * withdrawal: invitations separately require an affirmative grant (emailBlocker in lib/invitations/match.ts).
 */
export const ESSENTIAL_EMAIL_KINDS: ReadonlySet<CodeEmailKind> = new Set<CodeEmailKind>([
  "RSVP_CONFIRMATION",
  "RSVP_REMINDER",
  "RSVP_CANCELLATION",
  "RSVP_CONFIRMED_VIRTUAL", // the virtual versions of the confirmation and the reminder
  "RSVP_REMINDER_VIRTUAL",
]);

export const isEssentialEmail = (kind: CodeEmailKind) => ESSENTIAL_EMAIL_KINDS.has(kind);

export function hasWithdrawnContactConsent(records: { type: string; granted: boolean; createdAt: Date }[]): boolean {
  return currentConsents(records).data_and_contact === false;
}

/** True when this email must not be sent because contact consent was withdrawn. */
export function blockedByWithdrawal(kind: CodeEmailKind, records: { type: string; granted: boolean; createdAt: Date }[]): boolean {
  return !isEssentialEmail(kind) && hasWithdrawnContactConsent(records);
}
