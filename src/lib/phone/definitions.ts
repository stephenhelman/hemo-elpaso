/**
 * Phone routing: who answers each menu option. PURE (no DB, no Next, no SDK): unit-tested in
 * scripts/check-phone-routing.ts.
 *
 *   numbers   duty numbers of board members. admin@ adds them; each is verified by a call before it can be rung.
 *   options   the menu (1 events in English, 2 Spanish, 3 an officer): which duty number rings, and during which hours.
 *
 * A number rings only if it is verified AND its owner still holds an active board role, so a departed officer stops
 * getting calls the moment their role ends.
 */
import { siteParts, siteWeekdayHour } from "@/lib/datetime";
import { toUsE164 } from "@/lib/twilio/mode";

export const OPTION_KEYS = ["events", "spanish", "officer"] as const;
export type OptionKey = (typeof OPTION_KEYS)[number];
export const isOptionKey = (k: unknown): k is OptionKey => typeof k === "string" && (OPTION_KEYS as readonly string[]).includes(k);

export interface OptionDef {
  digit: "1" | "2" | "3";
  /** Languages spoken to the caller and to the person answering. */
  languages: readonly ("en" | "es")[];
  label: { en: string; es: string };
}
export const OPTIONS: Record<OptionKey, OptionDef> = {
  events: { digit: "1", languages: ["en"], label: { en: "1 · Events (English)", es: "1 · Eventos (inglés)" } },
  spanish: { digit: "2", languages: ["es"], label: { en: "2 · Spanish", es: "2 · Español" } },
  officer: { digit: "3", languages: ["en", "es"], label: { en: "3 · Officer", es: "3 · Directivo" } },
};
export const optionForDigit = (digit: unknown): OptionKey | null => OPTION_KEYS.find((k) => OPTIONS[k].digit === digit) ?? null;

export const MAX_NUMBERS = 12;
export const CODE_DIGITS = 6;
export const CODE_TTL_MS = 10 * 60_000;
export const CODE_ATTEMPTS = 3;
/** Verification calls to one number. Counted from the audit log, so it holds across serverless instances. */
export const VERIFY_CALL_LIMIT = { max: 5, windowMs: 60 * 60_000 };
export const RING_SECONDS = 20;
export const MAX_CALL_SECONDS = 60 * 60;

// voicemail
export const VOICEMAIL_MAX_SECONDS = 120;
/** Shorter than this is a hang-up, not a message: it is deleted at once. */
export const VOICEMAIL_MIN_SECONDS = 2;
/** Times one caller (by keyed hash of the number) may be offered voicemail in 24 hours. */
export const VOICEMAIL_DAILY_LIMIT = 5;
/** All callers who hide their number share one allowance. */
export const VOICEMAIL_UNKNOWN_DAILY_LIMIT = 10;
/** Everybody together in 24 hours: the stop for a flood from many (or made-up) numbers. */
export const VOICEMAIL_TOTAL_DAILY_LIMIT = 60;
/** Nobody may keep a voicemail longer than this (the Privacy Policy says so). */
export const VOICEMAIL_RETENTION_DAYS = 30;
/** What is left after deletion (no audio, no number): the same as other call records. */
export const VOICEMAIL_RECORD_DAYS = 365;
/** How long a recording with no matching row (or a row with no recording) is left before it is cleaned up. */
export const VOICEMAIL_ORPHAN_HOURS = 24;

/** null = any time. Otherwise these weekdays (0 = Sunday) from start up to end, El Paso time. */
export type Hours = null | { days: number[]; start: string; end: string };

export interface DutyNumber {
  id: string;
  ownerId: string;
  /** E.164. Never sent to a browser, an email or a log: use maskNumber(). */
  number: string;
  addedAt: string;
  verifiedAt: string | null;
  challenge: { hash: string; expiresAt: string; attempts: number } | null;
}
export interface Routing {
  numbers: DutyNumber[];
  options: Record<OptionKey, { numberId: string | null; hours: Hours }>;
}

export const emptyRouting = (): Routing => ({
  numbers: [],
  options: Object.fromEntries(OPTION_KEYS.map((k) => [k, { numberId: null, hours: null }])) as Routing["options"],
});

// ── which numbers may be a destination ────────────────────────────────────────────────────────────────────────
/** +1 area codes that are NOT the United States (Canada, the Caribbean): international rates, a common fraud route. */
const NOT_US_AREA_CODES = new Set(
  ("204 226 236 249 250 263 289 306 343 354 365 367 368 382 403 416 418 428 431 437 438 450 468 474 506 514 519 548 579 581 584 587 604 613 639 647 672 683 705 709 742 753 778 780 782 807 819 825 867 873 879 902 905 942 " +
    "242 246 264 268 284 345 441 473 649 658 664 721 758 767 784 809 829 849 868 869 876").split(" "),
);
/** Toll-free, premium and "personal" service codes: never somebody's phone. */
const SERVICE_AREA_CODES = new Set("500 521 522 523 524 525 526 527 528 529 533 544 566 577 588 700 800 822 833 844 855 866 877 880 881 882 888 889 900".split(" "));

export type NumberError = "invalid" | "not_us" | "not_allowed" | "hoep_number";

export function checkDutyNumber(input: unknown, hoep: string | null): { ok: true; number: string } | { ok: false; error: NumberError } {
  const number = toUsE164(input);
  if (!number) return { ok: false, error: "invalid" };
  const area = number.slice(2, 5), exchange = number.slice(5, 8);
  if (/^[2-9]11$/.test(area) || /^[2-9]11$/.test(exchange) || exchange === "976" || SERVICE_AREA_CODES.has(area)) return { ok: false, error: "not_allowed" };
  if (NOT_US_AREA_CODES.has(area)) return { ok: false, error: "not_us" };
  if (number === hoep) return { ok: false, error: "hoep_number" }; // it would call itself
  return { ok: true, number };
}

// ── hours ─────────────────────────────────────────────────────────────────────────────────────────────────────
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function checkHours(input: unknown): { ok: true; hours: Hours } | { ok: false } {
  if (input === null) return { ok: true, hours: null };
  if (!input || typeof input !== "object") return { ok: false };
  const { days, start, end } = input as { days?: unknown; start?: unknown; end?: unknown };
  if (!Array.isArray(days) || days.length === 0 || !days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) return { ok: false };
  if (typeof start !== "string" || typeof end !== "string" || !TIME_RE.test(start) || !TIME_RE.test(end) || start >= end) return { ok: false };
  return { ok: true, hours: { days: Array.from(new Set(days as number[])).sort(), start, end } };
}

export function isOpenAt(hours: Hours, now: Date): boolean {
  if (!hours) return true;
  const { minute, hour } = siteParts(now);
  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return hours.days.includes(siteWeekdayHour(now).weekday) && time >= hours.start && time < hours.end;
}

// ── who rings ─────────────────────────────────────────────────────────────────────────────────────────────────
export type Destination = { ring: true; number: string } | { ring: false; reason: "unassigned" | "unverified" | "not_board" | "closed" };

export function destinationFor(routing: Routing, option: OptionKey, boardIds: ReadonlySet<string>, now: Date, hoep: string | null): Destination {
  const { numberId, hours } = routing.options[option];
  const n = routing.numbers.find((x) => x.id === numberId);
  if (!n || n.number === hoep) return { ring: false, reason: "unassigned" };
  if (!n.verifiedAt) return { ring: false, reason: "unverified" };
  if (!boardIds.has(n.ownerId)) return { ring: false, reason: "not_board" };
  if (!isOpenAt(hours, now)) return { ring: false, reason: "closed" };
  return { ring: true, number: n.number };
}

// ── reading the stored value ──────────────────────────────────────────────────────────────────────────────────
const str = (v: unknown): v is string => typeof v === "string" && v.length > 0;

/** The stored JSON, trusting nothing: a damaged entry is dropped, never rung. */
export function parseRouting(raw: unknown): Routing {
  const out = emptyRouting();
  const r = (raw ?? {}) as { numbers?: unknown; options?: Record<string, { numberId?: unknown; hours?: unknown }> };
  for (const x of Array.isArray(r.numbers) ? (r.numbers as Partial<DutyNumber>[]) : []) {
    if (!x || !str(x.id) || !str(x.ownerId) || !str(x.number) || toUsE164(x.number) !== x.number) continue;
    const c = x.challenge;
    out.numbers.push({
      id: x.id, ownerId: x.ownerId, number: x.number, addedAt: str(x.addedAt) ? x.addedAt : "",
      verifiedAt: str(x.verifiedAt) ? x.verifiedAt : null,
      challenge: c && str(c.hash) && str(c.expiresAt) && Number.isInteger(c.attempts) ? { hash: c.hash, expiresAt: c.expiresAt, attempts: c.attempts } : null,
    });
  }
  for (const key of OPTION_KEYS) {
    const o = r.options?.[key];
    if (!o) continue;
    const hours = checkHours(o.hours ?? null);
    // unreadable hours must not turn into "any time": the option is left unassigned instead
    out.options[key] = hours.ok && out.numbers.some((n) => n.id === o.numberId) ? { numberId: o.numberId as string, hours: hours.hours } : { numberId: null, hours: hours.ok ? hours.hours : null };
  }
  return out;
}
