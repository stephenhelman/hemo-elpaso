/**
 * Single source for "where does this site live" and "which mailbox domain do we
 * use". Nothing else in the app should hardcode a domain.
 *
 *   NEXT_PUBLIC_SITE_URL     the site's public URL, https://hemoelpaso.org in production (apex, no www).
 *                            NEXT_PUBLIC_BASE_URL is the old name and is still read as a fallback.
 *                            Production with neither set throws; previews fall back to VERCEL_URL so their
 *                            links work; local dev falls back to http://localhost:3000.
 *   NEXT_PUBLIC_EMAIL_DOMAIN domain of the org's mailboxes (info@, events@, ...).
 *                            Default: hemoelpaso.org (the Resend-verified sending domain). Kept as its own
 *                            variable so mail can be pointed elsewhere without moving the website.
 */
export function siteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  // Production must never guess: a *.vercel.app link in an email to a family would be a broken, off-brand link.
  if (process.env.VERCEL_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is not set for Production (the site's public URL, e.g. https://hemoelpaso.org)",
    );
  }
  // Previews build working links to themselves.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function siteHost(): string {
  try {
    return new URL(siteUrl()).host;
  } catch {
    return siteUrl();
  }
}

/**
 * Domain of every org mailbox (info@, events@, president@, ...) and of every "from" address. It must be the
 * domain verified in Resend. Production must set NEXT_PUBLIC_EMAIL_DOMAIN=hemoelpaso.org and EMAIL_FROM to a
 * sender on it (see .env.example). The email-routing allowed-domain check also reads this.
 */
export function emailDomain(): string {
  return process.env.NEXT_PUBLIC_EMAIL_DOMAIN || "hemoelpaso.org";
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
export const withPhone = (s: string) =>
  s.replace(/\{phone\}/g, SITE_PHONE.dashed);

const DECADE_WORDS = {
  en: [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ],
  es: [
    "",
    "una",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
  ],
} as const;

/**
 * Fill age-of-the-org placeholders in a translated string so it never goes stale:
 *   {years}       33            {decadeYears}  30  (floored to the decade)
 *   {decades}     three / tres (capitalised at the start of a sentence)   {Decades}  always Three / Tres
 */
export function fillYears(
  s: string,
  locale: "en" | "es",
  now: Date = new Date(),
): string {
  const d = decadesSinceFounding(now);
  const w = DECADE_WORDS[locale][d] ?? String(d);
  const cap = w.charAt(0).toUpperCase() + w.slice(1);
  return (
    s
      .replace(/\{years\}/g, String(yearsSinceFounding(now)))
      .replace(/\{decadeYears\}/g, String(d * 10))
      // {decades}: capitalised at the start of the text or of a sentence ("{decades} Decades of Hope"), lower-case mid-sentence ("over {decades} decades")
      .replace(/\{decades\}/g, (_m, offset: number, whole: string) =>
        offset === 0 || /[.!?¿¡]\s*$/.test(whole.slice(0, offset)) ? cap : w,
      )
      .replace(/\{Decades\}/g, cap)
  );
}

/** Append ?lang=en|es (or &lang=) so a link opened from an email renders in the patient's language. */
export function withLang(url: string, lang: "en" | "es"): string {
  return url + (url.includes("?") ? "&" : "?") + `lang=${lang}`;
}

/** Short form of the org name, used in person subtitles ("President, HOEP"). */
export const ORG_ABBR = "HOEP";

/**
 * DEFAULT address for privacy requests (privacy@ forwards to the President and VP). The live value is the
 * "privacy" email route that officers can change in Admin > Settings > Email routing (lib/email-routing), and that
 * is what the legal pages print (see getPrivacyEmail()). This constant is the code default and the fallback.
 */
export const PRIVACY_EMAIL = mailbox("privacy");

/** The site's public URL (https://hemoelpaso.org after cutover). Terms of Use render its host. */
export const SITE_URL = siteUrl();
