/**
 * One place for every date/time the site shows or computes. HOEP lives in
 * Mountain Time (SITE_TIMEZONE); servers run in UTC, so NEVER call
 * toLocale*String, getHours(), getDate() etc. on an event date without a zone.
 * Pure functions: safe to import from client and server code.
 */
import { SITE_TIMEZONE } from "@/lib/site";

export type DateLang = "en" | "es";
type DateInput = Date | string | number;

const TZ = SITE_TIMEZONE;
const intlLocale = (lang: DateLang) => (lang === "es" ? "es-US" : "en-US");
const toDate = (d: DateInput) => (d instanceof Date ? d : new Date(d));

/** "Tuesday, November 17, 2026" / "martes, 17 de noviembre de 2026" (year optional). */
export function formatEventDate(d: DateInput, lang: DateLang = "en", opts: { year?: boolean } = {}): string {
  const year = opts.year ?? true;
  return new Intl.DateTimeFormat(intlLocale(lang), {
    timeZone: TZ, weekday: "long", month: "long", day: "numeric", ...(year ? { year: "numeric" } : {}),
  }).format(toDate(d));
}

/** "6:30 PM" / "6:30 p. m." */
export function formatEventTime(d: DateInput, lang: DateLang = "en"): string {
  return new Intl.DateTimeFormat(intlLocale(lang), { timeZone: TZ, hour: "numeric", minute: "2-digit" }).format(toDate(d));
}

/** "Tuesday, November 17, 2026, 6:30 PM" */
export function formatEventDateTime(d: DateInput, lang: DateLang = "en", opts: { year?: boolean } = {}): string {
  return `${formatEventDate(d, lang, opts)}, ${formatEventTime(d, lang)}`;
}

/** Arbitrary Intl options, always pinned to the site zone (admin tables, badges, etc.). */
export function formatInSiteZone(d: DateInput, lang: DateLang, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(intlLocale(lang), { ...options, timeZone: TZ }).format(toDate(d));
}

/** Compact "Nov 17, 2026" */
export const formatShortDate = (d: DateInput, lang: DateLang = "en") =>
  formatInSiteZone(d, lang, { month: "short", day: "numeric", year: "numeric" });

/** Calendar parts of an instant as seen on a Mountain Time wall clock. */
export function siteParts(d: DateInput) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23",
  }).formatToParts(toDate(d));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" of the Mountain Time calendar day an instant falls on. */
export function siteDateKey(d: DateInput): string {
  const p = siteParts(d);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Day of month on the Mountain Time calendar (for date badges). */
export const siteDayOfMonth = (d: DateInput) => siteParts(d).day;

/** Weekday 0 (Sun) – 6 (Sat) and hour 0–23 on the Mountain Time wall clock. */
export function siteWeekdayHour(d: DateInput): { weekday: number; hour: number } {
  const weekday = new Date(Date.UTC(siteParts(d).year, siteParts(d).month - 1, siteParts(d).day)).getUTCDay();
  return { weekday, hour: siteParts(d).hour };
}

/** UTC instant for a Mountain Time wall-clock time. DST-safe (re-checks the offset at the result). */
export function siteWallTimeToUtc(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): Date {
  const wall = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetAt = (ms: number) => {
    const p = siteParts(ms);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
  };
  let guess = wall - offsetAt(wall);
  guess = wall - offsetAt(guess); // offset can differ across a DST switch
  return new Date(guess);
}

/** Add whole calendar days to a "YYYY-MM-DD" key (pure calendar math, no zone). */
export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** [start, end) as UTC instants of the Mountain Time calendar day `key`. 23/25h long on DST days. */
export function siteDayRangeUtc(key: string): { start: Date; end: Date } {
  const [y, m, d] = key.split("-").map(Number);
  const [ny, nm, nd] = addDaysToKey(key, 1).split("-").map(Number);
  return { start: siteWallTimeToUtc(y, m, d), end: siteWallTimeToUtc(ny, nm, nd) };
}

/** Tomorrow (Mountain Time calendar) relative to `now`, as a UTC [start, end) window. */
export function tomorrowRangeUtc(now: Date = new Date()): { start: Date; end: Date } {
  return siteDayRangeUtc(addDaysToKey(siteDateKey(now), 1));
}

/** Value for <input type="datetime-local"> showing `d` in Mountain Time. */
export function toSiteDatetimeLocal(d: DateInput): string {
  const p = siteParts(d);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Parse a datetime-local value ("2026-11-17T18:30") as Mountain Time. Returns null if invalid. */
export function fromSiteDatetimeLocal(v: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);
  if (!m) return null;
  return siteWallTimeToUtc(+m[1], +m[2], +m[3], +m[4], +m[5]);
}
