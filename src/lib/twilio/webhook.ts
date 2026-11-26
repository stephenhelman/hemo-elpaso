/**
 * The one wrapper for every /api/twilio/* route (npm run check:twilio-guard). These routes have no session: the
 * middleware does not run on them, and the ONLY thing that lets a request in is a valid X-Twilio-Signature for our
 * account.
 *
 *   503  the phone system is not configured     403  missing/wrong signature or another account
 *   500  the handler failed
 * Any of those makes Twilio use the number's fallback handler (docs/overhaul/TWILIO_SETUP.md).
 *
 * Nothing about the caller is logged: no From, no To, no digits, no fields at all. Query strings carry codes only.
 */
import { NextRequest } from "next/server";
import { validSignature } from "./client";
import { twilioConfig, type TwilioConfig } from "./config";
import { VoiceTwiml } from "./twiml";

export interface WebhookContext {
  /** The signed POST fields. */
  params: Record<string, string>;
  query: URLSearchParams;
  config: TwilioConfig;
  /** A new response that obeys TWILIO_MODE. */
  twiml: () => VoiceTwiml;
}

const plain = (status: number, text: string) => new Response(text, { status, headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } });

export function twilioWebhook(handler: (ctx: WebhookContext) => Promise<VoiceTwiml> | VoiceTwiml) {
  return async function POST(req: NextRequest): Promise<Response> {
    const path = req.nextUrl.pathname;
    let config: TwilioConfig;
    try {
      config = twilioConfig();
    } catch (e) {
      console.error("[twilio] not configured", { path, reason: e instanceof Error ? e.message : "unknown" });
      return plain(503, "Phone system not configured");
    }
    try {
      const params = Object.fromEntries(new URLSearchParams(await req.text()));
      const signature = req.headers.get("x-twilio-signature");
      // Checked against the address Twilio was given, never the request's own Host header.
      const url = `${config.publicBaseUrl}${path}${req.nextUrl.search}`;
      if (!signature || !validSignature(config.authToken, signature, url, params) || params.AccountSid !== config.accountSid) {
        console.error("[twilio] rejected request", { path, signed: !!signature });
        return plain(403, "Forbidden");
      }
      const response = await handler({ params, query: req.nextUrl.searchParams, config, twiml: () => new VoiceTwiml(config.reach) });
      return new Response(response.toString(), { status: 200, headers: { "Content-Type": "text/xml; charset=utf-8", "Cache-Control": "no-store" } });
    } catch (e) {
      console.error("[twilio] webhook failed", { path, error: e instanceof Error ? e.name : "unknown" });
      return plain(500, "Error");
    }
  };
}
