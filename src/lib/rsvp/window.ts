/**
 * The Event model only has a start time. "Until the event ends" = start + 12h
 * (override in one place if events get an end time later).
 */
const EVENT_LENGTH_MS = 12 * 60 * 60 * 1000;

export const eventEndsAt = (eventDate: Date) =>
  new Date(eventDate.getTime() + EVENT_LENGTH_MS);

export const eventHasEnded = (eventDate: Date, now = new Date()) =>
  now >= eventEndsAt(eventDate);

/** Shown when an event is full or registration closed. */
export const CALL_US_PHONE = "915-621-8291";
