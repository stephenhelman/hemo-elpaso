/**
 * THE one place Cloudflare R2 settings are read. Every value comes from the environment: there are no defaults and no
 * fallbacks, so a missing setting is an error and never a silent write somewhere else.
 *
 * Read when a storage route needs it. A missing or refused setting stops the STORAGE routes only (they answer 503,
 * lib/storage-response.ts): the server logs it at start (src/instrumentation.ts) and keeps serving pages. A production
 * build still fails early (scripts/require-r2-env.ts), so a broken setting never replaces a working deployment.
 *
 * The PRODUCTION bucket (./r2-production.ts) is refused outside production, so local work, previews and scripts can't
 * touch families' photos. One deliberate command may opt in with R2_ALLOW_PROD_BUCKET=yes. Checks never may.
 * `npm run check:r2-config` fails if a bucket, endpoint or account id is written anywhere
 * else. None of these are NEXT_PUBLIC_: the browser never sees them (it only gets presigned and public URLs).
 */
import { createHash } from "node:crypto";
import { PRODUCTION_STORAGE, type ProductionStorage } from "./r2-production";

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

/** Not a setting to keep: put it in front of one command that has to work on production storage. */
export const ALLOW_PROD_VAR = "R2_ALLOW_PROD_BUCKET";

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
const hostOf = (url: string) => { try { return new URL(url).host.toLowerCase(); } catch { return ""; } };

export const isProductionStorage = (bucket: string, publicUrl: string, production: ProductionStorage = PRODUCTION_STORAGE): boolean =>
  sha256(bucket) === production.bucketSha256 || sha256(hostOf(publicUrl)) === production.publicHostSha256;

/** A check script: run by `npm run check:*` (or check:all), or marked by scripts/_load-env.ts. */
export const isCheckRun = (env: Env): boolean => env.HOEP_CHECK_RUN === "1" || !!env.npm_lifecycle_event?.startsWith("check:");

/** Why this process may not use production storage, or null if it may. */
function productionRefusal(env: Env): string | null {
  if (isCheckRun(env)) return "Checks never use the production bucket.";
  if (env.VERCEL_ENV === "production" || env[ALLOW_PROD_VAR]?.trim() === "yes") return null;
  return `It is refused outside production. For one deliberate command only, put ${ALLOW_PROD_VAR}=yes in front of it.`;
}

/** Names of the variables that are unset or blank. */
export const missingR2Env = (env: Env = process.env): R2EnvVar[] => R2_ENV_VARS.filter((name) => !env[name]?.trim());

/** Reads and validates the settings. Throws R2ConfigError naming every problem (never printing a value). */
export function readR2Config(env: Env = process.env, production: ProductionStorage = PRODUCTION_STORAGE): R2Config {
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

  if (isProductionStorage(get("R2_BUCKET_NAME"), publicUrl, production)) {
    const refusal = productionRefusal(env);
    if (refusal) {
      throw new R2ConfigError(`R2_BUCKET_NAME / R2_PUBLIC_URL point at the PRODUCTION storage bucket. ${refusal} Use a development bucket (docs/STORAGE.md).`);
    }
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
