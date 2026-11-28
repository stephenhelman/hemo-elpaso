/**
 * Which storage is PRODUCTION, so that it is refused everywhere else (as scripts/db-endpoints.json does for the database
 * and lib/twilio/production-account.ts for the phone). SHA-256 hashes, so no bucket or host name is written in the code
 * (npm run check:r2-config):
 *
 *   printf '%s' '<bucket name>' | shasum -a 256
 *
 * EITHER match makes a configuration production: the bucket's name, or the host the live site serves files from.
 * Update both if production storage ever moves.
 */
export const PRODUCTION_STORAGE = {
  bucketSha256: "8ac70e6fdd9ae4fe0d7190d27a05e8e8451645fe2bcef1fb152e9ea6a196b4db",
  publicHostSha256: "2d9cbf09dba956b48bab2e0556a2930383e4955950a0d27c82f9b3bbb4c837eb",
} as const;

export type ProductionStorage = { bucketSha256: string; publicHostSha256: string };
