/**
 * ONE place to set when the legal pages go live. Format: YYYY-MM-DD.
 * TODO(merge day): set this to the day Privacy Policy v2, the Terms and the Children's policy are published.
 */
export const LEGAL_EFFECTIVE_DATE = "2026-11-01";

/**
 * The policy version that is LIVE on /privacy. Feature toggles read this: a feature can be switched on only if the
 * live policy version covers it (src/lib/features/registry.ts). Bump it in the same change that publishes a new
 * version of the policy text.
 */
export const LIVE_POLICY_VERSION = 2;

type Bilingual = { en: string; es: string };

/**
 * Values that fill {PLACEHOLDER} tokens in the legal text. `null` = not decided yet.
 *
 * Build rule (scripts/check-legal-placeholders.ts, run by the production build): a required placeholder that is still
 * null must not appear in an always-on part of the policy, or in a part whose feature toggle is ON. Placeholders that
 * only appear under a toggle that is OFF are allowed to stay null (the page then shows "to be set").
 * An optional placeholder that is null is simply left out of the sentence.
 */
export const PLACEHOLDERS = {
  /** How long deleted data can linger in database backups (Neon point-in-time history). Confirmed: 14 days. */
  BACKUP: { value: { en: "up to 14 days", es: "hasta 14 días" } as Bilingual | null, optional: false },
  /** Downloaded Puente Live transcripts (live_captions). Draft default, to confirm. */
  TRANSCRIPT: { value: { en: "90 days", es: "90 días" } as Bilingual | null, optional: false },
  /** HOEP's mailing address or PO box. Left out of the contact line while null. */
  ADDRESS: { value: null as Bilingual | null, optional: true },
  /** Donation payment processor (donations). Pick before turning donations on. */
  PROCESSOR: { value: null as Bilingual | null, optional: false },
  /** How long assistance records are kept (assistance). To be set with the accountant and attorney. */
  ASSISTANCE_RETENTION: { value: null as Bilingual | null, optional: false },
} as const;
export type PlaceholderKey = keyof typeof PLACEHOLDERS;
export const PLACEHOLDER_KEYS = Object.keys(PLACEHOLDERS) as PlaceholderKey[];

/** Kept for existing callers. */
export const BACKUP_WINDOW = PLACEHOLDERS.BACKUP.value!;
