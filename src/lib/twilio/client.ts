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

// ── voicemail recordings ──────────────────────────────────────────────────────────────────────────────────────
// The audio stays at Twilio. Nothing here is asked of Twilio in capture mode. Fetching audio needs HTTP auth at Twilio
// (console: Voice settings, "Enforce HTTP Auth on Media URLs"); openToPublic() tells us if that is off.
export interface RecordingInfo { sid: string; callSid: string; status: string; createdAt: Date; durationSeconds: number | null }
export type RestFailure = { ok: false; error: "captured" | "not_configured" | "not_found" | "failed" };
export interface RecordingStore {
  list(): Promise<{ ok: true; items: RecordingInfo[] } | RestFailure>;
  /** Deleting one that is already gone succeeds. */
  remove(sid: string): Promise<{ ok: true } | RestFailure>;
  /** The whole MP3, fetched with the account's credentials. */
  media(sid: string): Promise<{ ok: true; audio: Uint8Array } | RestFailure>;
  /** Can the audio be fetched WITHOUT signing in? null = we couldn't tell. */
  openToPublic(sid: string): Promise<boolean | null>;
}

/** May we ask Twilio anything at all? Not in capture mode. */
function restAccess(): { ok: true; config: TwilioConfig } | RestFailure {
  if (reachFrom(process.env).mode === "capture") return { ok: false, error: "captured" };
  try {
    return { ok: true, config: twilioConfig() };
  } catch (e) {
    console.error("[twilio] not configured", { reason: e instanceof Error ? e.message : "unknown" });
    return { ok: false, error: "not_configured" };
  }
}
/** Codes only: Twilio's messages can repeat numbers. */
function restFailed(what: string, e: unknown): RestFailure {
  const { code, status, name } = (e ?? {}) as { code?: number; status?: number; name?: string };
  console.error(`[twilio] ${what} failed`, { code, status, error: name });
  return { ok: false, error: "failed" };
}

export const RECORDING_SID = /^RE[0-9a-fA-F]{32}$/;
/** The most recordings one listing returns: far above what 30 days of capped voicemail can hold. */
const LIST_LIMIT = 5000;

export type RecordingsSdk = (config: TwilioConfig) => {
  list(): Promise<{ sid: string; callSid: string; status: string; dateCreated: Date; duration: string | null }[]>;
  remove(sid: string): Promise<unknown>;
};
const recordingsWithSdk: RecordingsSdk = (c) => {
  const client = c.apiKey ? twilio(c.apiKey.sid, c.apiKey.secret, { accountSid: c.accountSid }) : twilio(c.accountSid, c.authToken);
  return { list: () => client.recordings.list({ limit: LIST_LIMIT }), remove: (sid) => client.recordings(sid).remove() };
};

const mediaUrl = (c: TwilioConfig, sid: string) => `https://api.twilio.com/2010-04-01/Accounts/${c.accountSid}/Recordings/${sid}.mp3`;

export function twilioRecordings(deps: { sdk?: RecordingsSdk; fetch?: typeof fetch } = {}): RecordingStore {
  const sdk = deps.sdk ?? recordingsWithSdk;
  const http: typeof fetch = deps.fetch ?? ((...a) => fetch(...a));
  return {
    async list() {
      const a = restAccess();
      if (!a.ok) return a;
      try {
        const items = await sdk(a.config).list();
        return {
          ok: true,
          items: items.map((r) => ({ sid: r.sid, callSid: r.callSid, status: r.status, createdAt: r.dateCreated, durationSeconds: r.duration === null || r.duration === "" ? null : Number(r.duration) })),
        };
      } catch (e) {
        return restFailed("listing recordings", e);
      }
    },
    async remove(sid) {
      if (!RECORDING_SID.test(sid)) return { ok: false, error: "not_found" };
      const a = restAccess();
      if (!a.ok) return a;
      try {
        await sdk(a.config).remove(sid);
        return { ok: true };
      } catch (e) {
        return (e as { status?: number })?.status === 404 ? { ok: true } : restFailed("deleting a recording", e);
      }
    },
    async media(sid) {
      if (!RECORDING_SID.test(sid)) return { ok: false, error: "not_found" };
      const a = restAccess();
      if (!a.ok) return a;
      const user = a.config.apiKey?.sid ?? a.config.accountSid, secret = a.config.apiKey?.secret ?? a.config.authToken;
      try {
        const res = await http(mediaUrl(a.config, sid), {
          headers: { Authorization: `Basic ${Buffer.from(`${user}:${secret}`).toString("base64")}` }, cache: "no-store", signal: AbortSignal.timeout(20_000),
        });
        if (res.status === 404) return { ok: false, error: "not_found" };
        if (!res.ok) return restFailed("fetching a recording", { status: res.status });
        return { ok: true, audio: new Uint8Array(await res.arrayBuffer()) };
      } catch (e) {
        return restFailed("fetching a recording", e);
      }
    },
    async openToPublic(sid) {
      const a = restAccess();
      if (!a.ok || !RECORDING_SID.test(sid)) return null;
      try {
        const res = await http(mediaUrl(a.config, sid), { headers: { Range: "bytes=0-0" }, cache: "no-store", signal: AbortSignal.timeout(10_000) });
        await res.body?.cancel();
        return res.ok ? true : res.status === 401 || res.status === 403 ? false : null;
      } catch {
        return null;
      }
    },
  };
}

// ── call records ──────────────────────────────────────────────────────────────────────────────────────────────
export interface CallRecordStore {
  /** Ids of finished calls that ended before `cutoff`, at most one batch (the daily job comes back for the rest). */
  listEndedBefore(cutoff: Date): Promise<{ ok: true; sids: string[] } | RestFailure>;
  /** Deleting one that is already gone succeeds. */
  remove(sid: string): Promise<{ ok: true } | RestFailure>;
}
/** Per run: small enough to finish inside one function invocation, far above a day's calls. */
export const CALL_BATCH = 200;
export const CALL_SID = /^CA[0-9a-fA-F]{32}$/;

export type CallsSdk = (config: TwilioConfig) => {
  list(cutoff: Date, limit: number): Promise<{ sid: string; endTime: Date | null }[]>;
  remove(sid: string): Promise<unknown>;
};
const callsWithSdk: CallsSdk = (c) => {
  const client = c.apiKey ? twilio(c.apiKey.sid, c.apiKey.secret, { accountSid: c.accountSid }) : twilio(c.accountSid, c.authToken);
  return { list: (cutoff, limit) => client.calls.list({ endTimeBefore: cutoff, limit }), remove: (sid) => client.calls(sid).remove() };
};

export function twilioCallRecords(deps: { sdk?: CallsSdk } = {}): CallRecordStore {
  const sdk = deps.sdk ?? callsWithSdk;
  return {
    async listEndedBefore(cutoff) {
      const a = restAccess();
      if (!a.ok) return a;
      try {
        const calls = await sdk(a.config).list(cutoff, CALL_BATCH);
        // checked again here: nothing newer is ever deleted, whatever the filter returned
        return { ok: true, sids: calls.filter((c) => c.endTime && c.endTime < cutoff).map((c) => c.sid) };
      } catch (e) {
        return restFailed("listing call records", e);
      }
    },
    async remove(sid) {
      if (!CALL_SID.test(sid)) return { ok: false, error: "not_found" };
      const a = restAccess();
      if (!a.ok) return a;
      try {
        await sdk(a.config).remove(sid);
        return { ok: true };
      } catch (e) {
        return (e as { status?: number })?.status === 404 ? { ok: true } : restFailed("deleting a call record", e);
      }
    },
  };
}

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
