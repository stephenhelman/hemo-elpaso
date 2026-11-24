/**
 * Structured legal text. Strings may use a tiny inline markup (see components/legal/RichText.tsx):
 *   **bold**   [label](/path or https://…)
 *   {EMAIL} {PHONE} {HOST}                       from lib/site.ts (PRIVACY_EMAIL, SITE_PHONE, SITE_URL)
 *   {BACKUP} {TRANSCRIPT} {ADDRESS} {PROCESSOR} {ASSISTANCE_RETENTION}   from content/legal/meta.ts (PLACEHOLDERS)
 *   {STATUS:<feature key>}   the feature's live label: "Not yet available" while its toggle is off, then
 *                            "Available since <date>". Keys are the toggle keys of lib/features/registry.ts.
 *
 * A paragraph, bullet or table row that contains a {STATUS:key} token is bound to that feature: the check
 * scripts/check-legal-placeholders.ts treats any placeholder in the same paragraph, bullet or row as belonging to it.
 */
export type LegalBlock =
  | { t: "h2"; text: string }
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] };

export type LegalLang = { title: string; blocks: LegalBlock[] };

export type LegalDoc = {
  version: string;
  effectiveDate: string; // ISO date, from LEGAL_EFFECTIVE_DATE
  en: LegalLang;
  es: LegalLang;
};
