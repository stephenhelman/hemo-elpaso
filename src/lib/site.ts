/**
 * Single source for "where does this site live" and "which mailbox domain do we
 * use". Nothing else in the app should hardcode a domain.
 *
 *   NEXT_PUBLIC_BASE_URL     the site's public URL (https://hemoelpaso.org)
 *   NEXT_PUBLIC_EMAIL_DOMAIN domain of the org's mailboxes (info@, events@, ...).
 *                            Kept separate because the website can move to a new
 *                            domain before mail does. Default: hemo-el-paso.org
 *                            (the Resend-verified sending domain).
 */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function siteHost(): string {
  try {
    return new URL(siteUrl()).host;
  } catch {
    return siteUrl();
  }
}

export function emailDomain(): string {
  return process.env.NEXT_PUBLIC_EMAIL_DOMAIN || "hemo-el-paso.org";
}

export const mailbox = (local: string) => `${local}@${emailDomain()}`;
export const contactEmail = () => mailbox("info");

/**
 * HOEP operates in Mountain Time. An IANA zone (never a fixed offset) so daylight
 * saving is handled. Every date or time shown on the server, in an email or on a
 * page must be formatted with this zone (see lib/datetime.ts): servers run in UTC.
 */
export const SITE_TIMEZONE = "America/Denver";

/** Year HOEP was founded. Derive every "N years" claim from this. */
export const FOUNDING_YEAR = 1993;
export const yearsSinceFounding = (now: Date = new Date()) =>
  now.getFullYear() - FOUNDING_YEAR;
/** "30+" style figure: whole decades, floored. */
export const decadesSinceFounding = (now: Date = new Date()) =>
  Math.floor(yearsSinceFounding(now) / 10);

/** Org phone, one source. */
export const SITE_PHONE = {
  display: "(915) 539-7353",
  dashed: "915-539-7353",
  tel: "tel:+19155397353",
  e164: "+19155397353",
  schema: "+1-915-539-7353",
} as const;

/** The only correct Facebook URL. */
export const FACEBOOK_URL = "https://www.facebook.com/groups/4HOEP";
export const FACEBOOK_LABEL = {
  en: "HOEP on Facebook",
  es: "HOEP en Facebook",
} as const;

/** Replace {phone} in a translated sentence. */
export const withPhone = (s: string) => s.replace(/\{phone\}/g, SITE_PHONE.dashed);

const DECADE_WORDS = {
  en: ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"],
  es: ["", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"],
} as const;

/**
 * Fill age-of-the-org placeholders in a translated string so it never goes stale:
 *   {years}       33            {decadeYears}  30  (floored to the decade)
 *   {decades}     three / tres (capitalised at the start of a sentence)   {Decades}  always Three / Tres
 */
export function fillYears(s: string, locale: "en" | "es", now: Date = new Date()): string {
  const d = decadesSinceFounding(now);
  const w = DECADE_WORDS[locale][d] ?? String(d);
  const cap = w.charAt(0).toUpperCase() + w.slice(1);
  return s
    .replace(/\{years\}/g, String(yearsSinceFounding(now)))
    .replace(/\{decadeYears\}/g, String(d * 10))
    // {decades}: capitalised at the start of the text or of a sentence ("{decades} Decades of Hope"), lower-case mid-sentence ("over {decades} decades")
    .replace(/\{decades\}/g, (_m, offset: number, whole: string) =>
      offset === 0 || /[.!?¿¡]\s*$/.test(whole.slice(0, offset)) ? cap : w,
    )
    .replace(/\{Decades\}/g, cap);
}

/** Append ?lang=en|es (or &lang=) so a link opened from an email renders in the patient's language. */
export function withLang(url: string, lang: "en" | "es"): string {
  return url + (url.includes("?") ? "&" : "?") + `lang=${lang}`;
}

/** Short form of the org name, used in person subtitles ("President, HOEP"). */
export const ORG_ABBR = "HOEP";
