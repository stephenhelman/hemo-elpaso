/**
 * ONE place to set when the legal pages go live. Format: YYYY-MM-DD.
 * TODO(deploy day): set this to the day the pages are published.
 */
export const LEGAL_EFFECTIVE_DATE = "2026-11-01";

/**
 * How long deleted data can linger in database backups (Neon point-in-time history). NOT VERIFIED from the repo:
 * 30 days is the draft policy's example. Confirm in the Neon console (Project > Settings > Storage / history
 * retention) and change both strings if the plan's window is different.
 */
export const BACKUP_WINDOW = {
  en: "up to 14 days",
  es: "hasta 14 días",
} as const;

/**
 * The policy version that is LIVE on /privacy. Feature toggles read this: a feature can be switched on only if the
 * live policy version covers it (src/lib/features/registry.ts). Bump it in the same change that publishes a new
 * version of the policy text.
 */
export const LIVE_POLICY_VERSION = 1;
