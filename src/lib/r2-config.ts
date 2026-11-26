/**
 * THE one place Cloudflare R2 settings are read. Every value comes from the environment: there are no defaults and no
 * fallbacks, so a missing setting is an error and never a silent write somewhere else.
 *
 * Checked when the server starts (src/instrumentation.ts) and at the start of a production build
 * (scripts/require-r2-env.ts). `npm run check:r2-config` fails if a bucket, endpoint or account id is written anywhere
 * else. None of these are NEXT_PUBLIC_: the browser never sees them (it only gets presigned and public URLs).
 */
export const R2_ENV_VARS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
] as const;

export type R2EnvVar = (typeof R2_ENV_VARS)[number];
type Env = Record<string, string | undefined>;

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Base URL the bucket is served on, without a trailing slash. */
  publicUrl: string;
  /** S3 API endpoint, built from the account id. */
  endpoint: string;
}

export class R2ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "R2ConfigError";
  }
}

/** Names of the variables that are unset or blank. */
export const missingR2Env = (env: Env = process.env): R2EnvVar[] => R2_ENV_VARS.filter((name) => !env[name]?.trim());

/** Reads and validates the settings. Throws R2ConfigError naming every problem (never printing a value). */
export function readR2Config(env: Env = process.env): R2Config {
  const missing = missingR2Env(env);
  if (missing.length) {
    throw new R2ConfigError(
      `R2 storage is not configured. Missing environment variable(s): ${missing.join(", ")}. ` +
        "Set them in .env.local for development, or in Vercel > Settings > Environment Variables, then redeploy.",
    );
  }
  const get = (name: R2EnvVar) => env[name]!.trim();

  const accountId = get("R2_ACCOUNT_ID");
  if (!/^[A-Za-z0-9-]+$/.test(accountId)) {
    throw new R2ConfigError("R2_ACCOUNT_ID must be the account id on its own, not a URL or host name.");
  }
  const publicUrl = get("R2_PUBLIC_URL").replace(/\/+$/, "");
  if (!/^https?:\/\/[^/\s]+/.test(publicUrl)) {
    throw new R2ConfigError("R2_PUBLIC_URL must be a full URL starting with https://");
  }

  return {
    accountId,
    accessKeyId: get("R2_ACCESS_KEY_ID"),
    secretAccessKey: get("R2_SECRET_ACCESS_KEY"),
    bucket: get("R2_BUCKET_NAME"),
    publicUrl,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  };
}

let cached: R2Config | undefined;

/** The settings for this process (read once). */
export const r2Config = (): R2Config => (cached ??= readR2Config());
