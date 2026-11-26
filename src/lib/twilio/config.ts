/**
 * THE one place Twilio settings are read (TWILIO_MODE and the allowlist: ./mode.ts). No other module reads a TWILIO_*
 * variable and none is NEXT_PUBLIC_ (npm run check:twilio-guard).
 *
 * Read when a phone route or a call needs it, never at server start: missing or wrong credentials stop the PHONE routes
 * only, not the website. Errors name variables and never print values.
 */
import { createHash } from "node:crypto";
import { siteUrl } from "@/lib/site";
import { reachFrom, toUsE164, type Reach } from "./mode";
import { PRODUCTION_ACCOUNT_SID_SHA256 } from "./production-account";

export const TWILIO_REQUIRED_VARS = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"] as const;
type Env = Record<string, string | undefined>;

export class TwilioConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TwilioConfigError";
  }
}

export interface TwilioConfig {
  accountSid: string;
  /** Verifies webhook signatures. */
  authToken: string;
  /** HOEP's Twilio number (E.164): the caller ID of everything we place. */
  phoneNumber: string;
  /** Preferred for REST calls when both are set. */
  apiKey: { sid: string; secret: string } | null;
  /** The address Twilio is configured with, without a trailing slash. Signatures are computed against it. */
  publicBaseUrl: string;
  reach: Reach;
}

export const sha256Hex = (v: string) => createHash("sha256").update(v).digest("hex");

export function readTwilioConfig(env: Env = process.env, productionHash: string = PRODUCTION_ACCOUNT_SID_SHA256): TwilioConfig {
  const production = env.VERCEL_ENV === "production";
  const get = (name: string) => env[name]?.trim() ?? "";
  const missing = TWILIO_REQUIRED_VARS.filter((name) => !get(name));
  if (missing.length) throw new TwilioConfigError(`The phone system is not configured. Missing environment variable(s): ${missing.join(", ")}.`);

  const accountSid = get("TWILIO_ACCOUNT_SID");
  if (!/^AC[0-9a-zA-Z]{32}$/.test(accountSid)) throw new TwilioConfigError("TWILIO_ACCOUNT_SID must start with AC and be 34 characters long.");
  const phoneNumber = toUsE164(get("TWILIO_PHONE_NUMBER"));
  if (!phoneNumber) throw new TwilioConfigError("TWILIO_PHONE_NUMBER must be a US number, for example +19155550100.");

  const reach = reachFrom(env);
  if (!production) {
    if (productionHash && sha256Hex(accountSid) === productionHash) {
      throw new TwilioConfigError("TWILIO_ACCOUNT_SID is the PRODUCTION account. It is refused outside production: use a development account or subaccount.");
    }
    if (reach.mode === "allowlist" && !productionHash) {
      throw new TwilioConfigError("TWILIO_MODE=allowlist needs the production account recorded first (src/lib/twilio/production-account.ts).");
    }
  }

  const keySid = get("TWILIO_API_KEY_SID"), keySecret = get("TWILIO_API_KEY_SECRET");
  if (!!keySid !== !!keySecret) throw new TwilioConfigError("Set both TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET, or neither.");

  // A tunnel address (local development only). Production always uses the site's own address.
  const override = production ? "" : get("TWILIO_WEBHOOK_BASE_URL");
  const publicBaseUrl = (override || get("NEXT_PUBLIC_SITE_URL") || get("NEXT_PUBLIC_BASE_URL") || siteUrl()).replace(/\/+$/, "");
  if (!/^https:\/\/[^/\s]+$/.test(publicBaseUrl) && !(!production && /^http:\/\/localhost(:\d+)?$/.test(publicBaseUrl))) {
    throw new TwilioConfigError("The webhook base address (NEXT_PUBLIC_SITE_URL, or TWILIO_WEBHOOK_BASE_URL in development) must be https://host with no path.");
  }

  return { accountSid, authToken: get("TWILIO_AUTH_TOKEN"), phoneNumber, apiKey: keySid ? { sid: keySid, secret: keySecret } : null, publicBaseUrl, reach };
}

export const twilioConfig = (): TwilioConfig => readTwilioConfig(process.env);

/** HOEP's number if it is set (used to refuse it as a forwarding destination). */
export const hoepNumber = (env: Env = process.env): string | null => toUsE164(env.TWILIO_PHONE_NUMBER);

/** Rung (with screening) only when the routing settings can't be read. Never HOEP's own number: that would loop. */
export function fallbackNumber(env: Env = process.env): string | null {
  const n = toUsE164(env.TWILIO_FALLBACK_NUMBER);
  return n && n !== hoepNumber(env) ? n : null;
}
