/**
 * THE ONLY MODULE THAT USES THE TWILIO SDK (npm run check:twilio-guard fails if another file imports it, or calls
 * api.twilio.com). Server only.
 */
import twilio from "twilio";
import { twilioConfig, type TwilioConfig } from "./config";
import { mayReach, reachFrom } from "./mode";
import { holdBack } from "./outbox";

/** X-Twilio-Signature check: HMAC-SHA1 over the full URL and the sorted POST fields, keyed by the auth token. */
export const validSignature = (authToken: string, signature: string, url: string, params: Record<string, string>): boolean =>
  twilio.validateRequest(authToken, signature, url, params);

export interface CallRequest {
  /** E.164 */
  to: string;
  /** Path (with query) of the webhook that answers the call, e.g. "/api/twilio/voice/verify?n=..." */
  path: string;
  maxSeconds: number;
}
export type CallResult =
  | { ok: true; sid: string | null; /** TWILIO_MODE kept it from a real phone */ captured: boolean }
  | { ok: false; error: "not_configured" | "call_failed" };

export type CreateCall = (config: TwilioConfig, call: { to: string; from: string; url: string; timeLimit: number }) => Promise<{ sid: string }>;

const createWithSdk: CreateCall = (c, call) => {
  const client = c.apiKey ? twilio(c.apiKey.sid, c.apiKey.secret, { accountSid: c.accountSid }) : twilio(c.accountSid, c.authToken);
  return client.calls.create({ ...call, method: "POST" });
};

/** Place a call from HOEP's number, subject to TWILIO_MODE. Never throws; logs codes only (no numbers). */
export async function placeCall(req: CallRequest, create: CreateCall = createWithSdk): Promise<CallResult> {
  const reach = reachFrom(process.env);
  if (!mayReach(req.to, reach)) {
    holdBack("call", req.to, reach.mode, req.path); // needs no credentials: nothing leaves the process
    return { ok: true, sid: null, captured: true };
  }
  let config: TwilioConfig;
  try {
    config = twilioConfig();
  } catch (e) {
    console.error("[twilio] not configured", { reason: e instanceof Error ? e.message : "unknown" });
    return { ok: false, error: "not_configured" };
  }
  try {
    const call = await create(config, { to: req.to, from: config.phoneNumber, url: `${config.publicBaseUrl}${req.path}`, timeLimit: req.maxSeconds });
    return { ok: true, sid: call.sid, captured: false };
  } catch (e) {
    // Twilio's error MESSAGES can repeat the number: log the code and status only.
    const { code, status } = (e ?? {}) as { code?: number; status?: number };
    console.error("[twilio] call failed", { code, status });
    return { ok: false, error: "call_failed" };
  }
}
