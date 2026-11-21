/**
 * Structured legal text. Strings may use a tiny inline markup (see components/legal/RichText.tsx):
 *   **bold**   [label](/path or https://…)   and the placeholders {EMAIL} {PHONE} {HOST} {BACKUP}
 * which render from lib/site.ts (PRIVACY_EMAIL, SITE_PHONE, SITE_URL) and content/legal/meta.ts.
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
