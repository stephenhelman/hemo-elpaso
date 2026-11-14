/**
 * "The event is over" for RSVP/QR/past-event purposes: Event.endDate when set,
 * otherwise start + 12h (events created before endDate existed, or without one).
 * Pure functions: safe to import from client components.
 */
import { SITE_PHONE } from "@/lib/site";

const DEFAULT_LENGTH_MS = 12 * 60 * 60 * 1000;

type EventTimes = { eventDate: Date | string; endDate?: Date | string | null };

export const eventEndsAt = (e: EventTimes): Date =>
  e.endDate ? new Date(e.endDate) : new Date(new Date(e.eventDate).getTime() + DEFAULT_LENGTH_MS);

export const eventHasEnded = (e: EventTimes, now = new Date()): boolean =>
  now >= eventEndsAt(e);

/** Shown when an event is full or registration closed. */
export const CALL_US_PHONE: string = SITE_PHONE.dashed;
