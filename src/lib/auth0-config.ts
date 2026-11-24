/**
 * Session lifetime, stated explicitly (never left to the SDK's defaults). PURE and Edge-safe: the Node and Edge Auth0
 * instances (lib/auth0.ts, middleware.ts) both read this, so they always agree.
 *
 * Matches the published Privacy Policy retention row: "Sessions: up to 7 days, and you're signed out after 24 hours
 * of inactivity". If you change a number, change that text (src/content/legal/privacy.ts) and re-run
 * `npm run check:identities`, which compares the two.
 */
export const SESSION_ABSOLUTE_DAYS = 7;
export const SESSION_IDLE_HOURS = 24;

export const SESSION_CONFIG = {
  rolling: true,
  rollingDuration: SESSION_IDLE_HOURS * 60 * 60, // seconds of inactivity
  absoluteDuration: SESSION_ABSOLUTE_DAYS * 24 * 60 * 60, // seconds since sign-in, no matter what
} as const;
