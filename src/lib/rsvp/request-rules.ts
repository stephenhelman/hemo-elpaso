import { invitationGrandfathered, type InvitationFacts } from "@/lib/review/rules";

/**
 * Pure rules for RSVP requests: no database, safe to unit-test. The services in requests.ts apply them.
 */

export const REQUEST_SOURCES = ["modal", "emailed_link", "portal", "registration", "board"] as const;
export type RequestSource = (typeof REQUEST_SOURCES)[number];

export const REQUEST_STATUSES = ["waiting_household_review", "pending", "waitlisted", "confirmed_in_person", "confirmed_virtual", "declined", "withdrawn"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** A household may have one of these per event (partial unique index in the migration). */
export const OPEN_STATUSES: RequestStatus[] = ["waiting_household_review", "pending", "waitlisted"];
export const isOpen = (s: string) => (OPEN_STATUSES as string[]).includes(s);

export const DECLINE_REASONS = ["EVENT_FULL", "NOT_ELIGIBLE_FOR_EVENT", "DUPLICATE_REQUEST", "FAMILY_WITHDREW", "OTHER"] as const;
export type DeclineReason = (typeof DECLINE_REASONS)[number];
/** What the board may choose. A full event is waitlisted, never declined, so EVENT_FULL stays valid in the database but is not offered. */
export const SELECTABLE_DECLINE_REASONS: DeclineReason[] = ["NOT_ELIGIBLE_FOR_EVENT", "DUPLICATE_REQUEST", "FAMILY_WITHDREW", "OTHER"];
export const DECLINE_LABELS: Record<DeclineReason, string> = {
  EVENT_FULL: "Event full",
  NOT_ELIGIBLE_FOR_EVENT: "Not eligible for this event",
  DUPLICATE_REQUEST: "Duplicate request",
  FAMILY_WITHDREW: "Family withdrew",
  OTHER: "Other",
};
export const isDeclineReason = (v: unknown): v is DeclineReason => typeof v === "string" && (DECLINE_REASONS as readonly string[]).includes(v);

/** A declined household may ask again only if it was NOT one of these (and FAMILY_WITHDREW reopens). */
export const BLOCKS_RESUBMIT: DeclineReason[] = ["NOT_ELIGIBLE_FOR_EVENT", "DUPLICATE_REQUEST", "OTHER"];

export type AttendanceType = "in_person" | "virtual";
export const isAttendanceType = (v: unknown): v is AttendanceType => v === "in_person" || v === "virtual";

export const CALL_OUTCOMES = ["REACHED", "VOICEMAIL", "NO_ANSWER", "WRONG_NUMBER", "CALLBACK_NEEDED"] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];
export const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  REACHED: "Reached", VOICEMAIL: "Left voicemail", NO_ANSWER: "No answer", WRONG_NUMBER: "Wrong number", CALLBACK_NEEDED: "Call back",
};
export const isCallOutcome = (v: unknown): v is CallOutcome => typeof v === "string" && (CALL_OUTCOMES as readonly string[]).includes(v);

// ── which path does this household take? ──────────────────────────────────────────────────────────────────────
export type RsvpPath =
  | { path: "direct" }
  | { path: "request"; initialStatus: "pending" | "waiting_household_review" }
  | { path: "refuse"; code: "BY_INVITATION" };

/**
 * Invited (and approved, or invited before the review cutoff) => RSVP right away, as before.
 * Anyone else asks to attend: "waiting_household_review" while the household isn't approved, "pending" once it is.
 * Events that don't take requests from uninvited households refuse them instead.
 */
export function decideRsvpPath(i: {
  reviewStatus: string;
  invitation: InvitationFacts | null;
  event: { allowUninvitedRequests: boolean };
  cutoff: Date | null;
}): RsvpPath {
  const invited = !!i.invitation && i.invitation.status !== "removed";
  if (invitationGrandfathered(i.invitation, i.cutoff)) return { path: "direct" };
  if (invited && i.reviewStatus === "approved") return { path: "direct" };
  if (!i.event.allowUninvitedRequests && !invited) return { path: "refuse", code: "BY_INVITATION" };
  return { path: "request", initialStatus: i.reviewStatus === "approved" ? "pending" : "waiting_household_review" };
}

/** New requests (not board decisions) stop at the RSVP deadline, and at the end of the event. */
export function requestWindowOpen(event: { status: string; eventDate: Date; endDate: Date | null; rsvpDeadline: Date | null }, now = new Date()): boolean {
  if (event.status !== "published") return false;
  const end = event.endDate ?? new Date(event.eventDate.getTime() + 12 * 60 * 60_000);
  if (now >= end) return false;
  if (event.rsvpDeadline && event.rsvpDeadline < now) return false;
  return true;
}

/** May a household with this latest (non-open) request for the event ask again? */
export function mayResubmit(last: { status: string; declineReason: string | null } | null): boolean {
  if (!last) return true;
  if (last.status === "declined") return !(BLOCKS_RESUBMIT as string[]).includes(last.declineReason ?? "OTHER");
  return true; // withdrawn, or confirmed and since cancelled
}

// ── confirming ────────────────────────────────────────────────────────────────────────────────────────────────
export type ConfirmBlock = "HOUSEHOLD_NOT_APPROVED" | "AT_CAPACITY" | "VIRTUAL_OFF" | "RECORDINGS_OFF" | "NO_VIRTUAL_LINKS" | "NOT_OPEN";

/**
 * Why the board cannot confirm this request this way (null = it can).
 * Capacity counts confirmed IN-PERSON spots only: pending and waitlisted requests and virtual attendees never count.
 */
export function confirmBlock(i: {
  type: AttendanceType;
  status: string;
  householdApproved: boolean;
  partySize: number;
  inPersonTaken: number;
  event: { maxCapacity: number | null; virtualEnabled: boolean; meetUrl: string | null; youtubeUrl: string | null };
  recordingsOn: boolean;
}): ConfirmBlock | null {
  if (i.status !== "pending" && i.status !== "waitlisted") return i.status === "waiting_household_review" ? "HOUSEHOLD_NOT_APPROVED" : "NOT_OPEN";
  if (!i.householdApproved) return "HOUSEHOLD_NOT_APPROVED";
  if (i.type === "in_person") {
    if (i.event.maxCapacity && i.inPersonTaken + i.partySize > i.event.maxCapacity) return "AT_CAPACITY";
    return null;
  }
  if (!i.event.virtualEnabled) return "VIRTUAL_OFF";
  if (!i.recordingsOn) return "RECORDINGS_OFF";
  if (!i.event.meetUrl || !i.event.youtubeUrl) return "NO_VIRTUAL_LINKS";
  return null;
}

export const CONFIRM_BLOCK_TEXT: Record<ConfirmBlock, string> = {
  HOUSEHOLD_NOT_APPROVED: "Approve the household first (Registrations review).",
  AT_CAPACITY: "Not enough in-person spots left. Waitlist it, or confirm virtual.",
  VIRTUAL_OFF: "This event does not offer virtual attendance.",
  RECORDINGS_OFF: "Virtual attendance is locked until the board turns on the \"recordings\" feature.",
  NO_VIRTUAL_LINKS: "Add the Meet and YouTube links in the event settings first.",
  NOT_OPEN: "This request is already decided.",
};

/** Event form rule: virtual can be switched on only with the recordings toggle on and both links present. */
export function virtualSettingError(i: { virtualEnabled: boolean; meetUrl: string | null; youtubeUrl: string | null; recordingsOn: boolean }): string | null {
  if (!i.virtualEnabled) return null;
  if (!i.recordingsOn) return "RECORDINGS_OFF";
  if (!i.meetUrl || !i.youtubeUrl) return "NO_VIRTUAL_LINKS";
  return null;
}

/** https only; returns the cleaned URL or null. Used for the Meet and YouTube links. */
export function cleanLinkUrl(v: unknown, hosts: string[]): string | null {
  if (typeof v !== "string") return null;
  try {
    const u = new URL(v.trim());
    if (u.protocol !== "https:") return null;
    const h = u.hostname.toLowerCase();
    return hosts.some((x) => h === x || h.endsWith(`.${x}`)) ? u.toString() : null;
  } catch { return null; }
}
export const MEET_HOSTS = ["meet.google.com"];
export const YOUTUBE_HOSTS = ["youtube.com", "youtu.be"];
