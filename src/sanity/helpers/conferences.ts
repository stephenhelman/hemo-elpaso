/**
 * Rules for conferences: EXTERNAL events run by other organizations that HOEP shares. HOEP takes no registrations.
 * PURE (no server or Studio imports): used by the Studio warnings, the Resources page and the tests.
 * All calendar days are Mountain Time days (lib/datetime).
 */
import { siteDateKey } from "@/lib/datetime";
import type { Lang } from "@/types";
import { INTERNAL_ROUTES } from "../options";
import type { ConferenceItem, Section } from "../types";

/** The Studio warns when `lastVerified` is older than this. */
export const CONFERENCE_STALE_AFTER_DAYS = 60;

export const CONFERENCE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
export const isDateKey = (v: unknown): v is string => typeof v === "string" && DATE_KEY.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

/** The instant in an ISO datetime string, or null when missing or unreadable. */
export const instant = (v: unknown): number | null => {
  const t = typeof v === "string" ? Date.parse(v) : NaN;
  return Number.isNaN(t) ? null : t;
};

/** Shown through its end date; hidden from the following Mountain Time day. */
export const conferenceIsUpcoming = (endDate: unknown, now: Date = new Date()): boolean =>
  isDateKey(endDate) && endDate >= siteDateKey(now);

export type RegistrationState = "upcoming" | "open" | "closed" | null;

/** Where the organizer's registration window stands. Null when no dates were entered. */
export function registrationState(opensAt: unknown, closesAt: unknown, now: Date = new Date()): RegistrationState {
  const opens = instant(opensAt), closes = instant(closesAt), t = now.getTime();
  if (closes != null && t >= closes) return "closed";
  if (opens != null && t < opens) return "upcoming";
  return opens != null || closes != null ? "open" : null;
}

/** HOEP travel assistance is advertised while it is switched on and its deadline (inclusive) has not passed. */
export const travelAssistanceOpen = (c: Pick<ConferenceItem, "travelAssistance" | "travelAssistanceDeadline">, now: Date = new Date()): boolean =>
  c.travelAssistance === true && (!isDateKey(c.travelAssistanceDeadline) || c.travelAssistanceDeadline >= siteDateKey(now));

/** True when `lastVerified` is missing or more than CONFERENCE_STALE_AFTER_DAYS calendar days old. */
export function verificationIsStale(lastVerified: unknown, now: Date = new Date()): boolean {
  if (!isDateKey(lastVerified)) return true;
  const days = (Date.parse(`${siteDateKey(now)}T00:00:00Z`) - Date.parse(`${lastVerified}T00:00:00Z`)) / 86_400_000;
  return days > CONFERENCE_STALE_AFTER_DAYS;
}

/** Registration has closed but the conference is still switched on: the editor should check it. */
export const closedButShown = (closesAt: unknown, active: unknown, now: Date = new Date()): boolean => {
  const closes = instant(closesAt);
  return active !== false && closes != null && now.getTime() >= closes;
};

/** "March 5, 2027" / "5 de marzo de 2027" for a date-only value (formatted in UTC, so the day never shifts). */
export const formatDateKey = (key: string, lang: Lang): string =>
  new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" })
    .format(new Date(`${key}T12:00:00Z`));

export const formatDateSpan = (start: string | null | undefined, end: string | null | undefined, lang: Lang): string =>
  [start, end].filter(isDateKey).filter((v, i, a) => a.indexOf(v) === i).map((v) => formatDateKey(v, lang)).join(" – ");

/** Only https addresses are ever rendered, even if a document was written around the Studio's validation. */
export const safeHttpsUrl = (v: unknown): string | null => (typeof v === "string" && /^https:\/\/[^\s]+$/.test(v) ? v : null);

/** A "site page or https URL" value turned into something safe to link to. */
export function travelLink(link: ConferenceItem["travelAssistanceLink"]): { href: string; external: boolean } | null {
  if (!link?.value) return null;
  if (link.type === "internal") return INTERNAL_ROUTES.some(([p]) => p === link.value) ? { href: link.value, external: false } : null;
  const url = link.type === "external" ? safeHttpsUrl(link.value) : null;
  return url ? { href: url, external: true } : null;
}

export const conferenceAnchor = (slug: string) => `conference-${slug}`;

/**
 * What the Resources page shows at `now`: ended conferences removed, soonest first, with the request-time facts the
 * component needs (so the browser's clock plays no part). A repeated slug gets no second anchor.
 */
export function prepareConferenceSections(sections: Section[], now: Date = new Date()): Section[] {
  const used = new Set<string>();
  return sections.map((s) => {
    if (s._type !== "conferenceList") return s;
    const items = (s.items ?? [])
      .filter((c) => conferenceIsUpcoming(c.endDate, now))
      .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))
      .map((c) => {
        const anchor = c.slug && CONFERENCE_SLUG.test(c.slug) && !used.has(c.slug) ? conferenceAnchor(c.slug) : null;
        if (anchor) used.add(c.slug!);
        return { ...c, anchor, registration: registrationState(c.registrationOpensAt, c.registrationClosesAt, now), travelOpen: travelAssistanceOpen(c, now) };
      });
    return { ...s, items };
  });
}
