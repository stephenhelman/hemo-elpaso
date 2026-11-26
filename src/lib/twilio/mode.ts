/**
 * TWILIO_MODE: whether anything may reach a real phone. PURE (no SDK, no DB, no Next): unit-tested in
 * scripts/check-twilio-guard.ts. Mirrors EMAIL_MODE (lib/email/mode.ts).
 *
 *   live       calls go out. The DEFAULT only when VERCEL_ENV === "production".
 *   capture    nothing is sent to Twilio and nothing rings: outbound calls are not placed and TwiML never dials.
 *              The DEFAULT everywhere else: local dev, preview deploys and every check script.
 *   allowlist  a development account: only the numbers in TWILIO_DEV_ALLOWLIST can be called or dialed.
 *
 * Hard guard: "live" outside production THROWS, and so does an unknown value. src/instrumentation.ts resolves the mode
 * when the server starts, so a bad setting stops the app. Missing CREDENTIALS do not: see ./config.ts.
 *
 * TwiML is an outbound channel too (a <Dial> from a development webhook rings a real phone), so ./twiml.ts asks
 * mayReach() as well as ./client.ts.
 */
export type TwilioMode = "live" | "capture" | "allowlist";
type Env = Record<string, string | undefined>;

export function resolveTwilioMode(env: Env): TwilioMode {
  const production = env.VERCEL_ENV === "production";
  const raw = (env.TWILIO_MODE ?? "").trim().toLowerCase();
  if (raw === "") return production ? "live" : "capture";
  if (raw !== "live" && raw !== "capture" && raw !== "allowlist") {
    throw new Error(`TWILIO_MODE must be "live", "capture" or "allowlist" (got "${raw}")`);
  }
  if (raw === "live" && !production) {
    throw new Error(`TWILIO_MODE=live is only allowed when VERCEL_ENV=production (VERCEL_ENV is "${env.VERCEL_ENV ?? ""}"). Use "capture", or "allowlist" with TWILIO_DEV_ALLOWLIST.`);
  }
  return raw;
}

/** US (NANP) number in E.164 form: +1, area code and exchange starting 2-9. */
export const US_E164 = /^\+1[2-9]\d{2}[2-9]\d{6}$/;

/** "(915) 555-0100", "9155550100", "+1 915 555 0100" -> "+19155550100"; anything else -> null. */
export function toUsE164(input: unknown): string | null {
  if (typeof input !== "string" || !/^[+\d\s().-]+$/.test(input.trim())) return null;
  const d = input.replace(/\D/g, "");
  const e164 = d.length === 10 && !input.trim().startsWith("+") ? `+1${d}` : d.length === 11 && d.startsWith("1") ? `+${d}` : null;
  return e164 && US_E164.test(e164) ? e164 : null;
}

/** The only form of a phone number that may be shown on a screen, in an email or in a message. */
export const maskNumber = (number: string): string => `(•••) •••-${number.replace(/\D/g, "").slice(-4).padStart(4, "•")}`;

export interface Reach { mode: TwilioMode; allowlist: string[] }

export function reachFrom(env: Env): Reach {
  const mode = resolveTwilioMode(env);
  const allowlist = mode === "allowlist" ? (env.TWILIO_DEV_ALLOWLIST ?? "").split(",").map((x) => toUsE164(x)).filter((x): x is string => !!x) : [];
  return { mode, allowlist };
}

export const mayReach = (number: string, reach: Reach): boolean =>
  reach.mode === "live" || (reach.mode === "allowlist" && reach.allowlist.includes(number));
