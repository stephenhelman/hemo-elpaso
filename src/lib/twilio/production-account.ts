/**
 * Which Twilio account is PRODUCTION, so that it is refused everywhere else (like scripts/db-endpoints.json does for
 * the database). The SHA-256 of the account SID, not the SID itself:
 *
 *   printf '%s' 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' | shasum -a 256
 *
 * While this is empty, TWILIO_MODE=allowlist is refused outside production (nothing can prove the development
 * credentials are not the production ones). capture mode works regardless: it reaches no phone.
 */
export const PRODUCTION_ACCOUNT_SID_SHA256 = "";
