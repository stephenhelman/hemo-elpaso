/**
 * Which Twilio account is PRODUCTION, so that it is refused everywhere else (like scripts/db-endpoints.json does for
 * the database). The SHA-256 of the account SID, not the SID itself:
 *
 *   printf '%s' 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' | shasum -a 256
 *
 * While this is empty, TWILIO_MODE=allowlist is refused outside production (nothing can prove the development
 * credentials are not the production ones). capture mode works regardless: it reaches no phone.
 */
export const PRODUCTION_ACCOUNT_SID_SHA256 =
  "4d74a167c3dc508c42319c190e0d86b5063a1a902f0c71afd22591a5a0493b49";
