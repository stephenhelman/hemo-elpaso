/**
 * The signature wrapper in front of every /api/twilio route. Run: npm run check:twilio-webhook
 * (offline: no database, no network, no Twilio account). Signatures are computed here from Twilio's published
 * algorithm, not with the SDK, so the check does not just agree with itself.
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { after, beforeEach, test } from "node:test";
import { NextRequest } from "next/server";
import { twilioWebhook, type WebhookContext } from "../src/lib/twilio/webhook";

const SID = `AC${"3".repeat(32)}`, TOKEN = "test-auth-token", BASE = "https://hemoelpaso.org";
const sign = (url: string, params: Record<string, string>, token = TOKEN) =>
  createHmac("sha1", token).update(url + Object.keys(params).sort().map((k) => k + params[k]).join("")).digest("base64");

const logged: string[] = [];
const real = { error: console.error, log: console.log };
console.error = (...a: unknown[]) => { logged.push(JSON.stringify(a)); };
after(() => { console.error = real.error; });

beforeEach(() => {
  logged.length = 0;
  for (const k of Object.keys(process.env)) if (k.startsWith("TWILIO_") || k === "VERCEL_ENV") delete process.env[k];
  Object.assign(process.env, { TWILIO_ACCOUNT_SID: SID, TWILIO_AUTH_TOKEN: TOKEN, TWILIO_PHONE_NUMBER: "+19155550100", NEXT_PUBLIC_SITE_URL: BASE });
});

const seen: WebhookContext[] = [];
const POST = twilioWebhook((ctx) => { seen.push(ctx); return ctx.twiml().say(["en", "ok"]); });
const PARAMS = { AccountSid: SID, CallSid: "CA123", From: "+19155550999", To: "+19155550100", Digits: "1" };

function request(o: { params?: Record<string, string>; path?: string; signedUrl?: string; signature?: string | null; token?: string; host?: string } = {}) {
  const params = o.params ?? PARAMS, path = o.path ?? "/api/twilio/voice/menu?try=1";
  const signature = o.signature === undefined ? sign(o.signedUrl ?? `${BASE}${path}`, params, o.token) : o.signature;
  return new NextRequest(`${o.host ?? "http://internal.local:3000"}${path}`, {
    method: "POST", body: new URLSearchParams(params).toString(),
    headers: { "content-type": "application/x-www-form-urlencoded", ...(signature ? { "x-twilio-signature": signature } : {}) },
  });
}

test("a correctly signed request is answered with TwiML; the handler gets the fields and the query", async () => {
  seen.length = 0;
  const res = await POST(request());
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type")!, /^text\/xml/);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.match(await res.text(), /<Response><Say[^>]*>ok<\/Say><\/Response>/);
  assert.deepEqual([seen[0].params.Digits, seen[0].query.get("try"), seen[0].config.reach.mode], ["1", "1", "capture"]);
});

test("missing, wrong, or foreign signatures are refused before the handler runs", async () => {
  seen.length = 0;
  const cases = [
    request({ signature: null }),
    request({ signature: "bm90IGEgc2lnbmF0dXJl" }),
    request({ token: "someone-elses-token" }),
    request({ signedUrl: `${BASE}/api/twilio/voice` }), // signed for another path
    request({ signedUrl: `${BASE}/api/twilio/voice/menu?try=2` }), // the query is part of the signature
    request({ signedUrl: "https://www.hemoelpaso.org/api/twilio/voice/menu?try=1" }), // Twilio must be given the apex address
    // signed for the address the request happened to arrive on: the Host header is not trusted
    request({ signedUrl: "https://evil.example/api/twilio/voice/menu?try=1", host: "https://evil.example" }),
  ];
  const tampered = request();
  cases.push(new NextRequest(tampered.url, { method: "POST", headers: tampered.headers, body: new URLSearchParams({ ...PARAMS, Digits: "3" }).toString() }));
  for (let i = 0; i < cases.length; i++) assert.equal((await POST(cases[i])).status, 403, `case ${i}`);
  assert.equal(seen.length, 0);
});

test("a valid signature for another account is refused", async () => {
  seen.length = 0;
  assert.equal((await POST(request({ params: { ...PARAMS, AccountSid: `AC${"4".repeat(32)}` } }))).status, 403);
  assert.equal(seen.length, 0);
});

test("without credentials only the phone route fails (503, so Twilio uses its fallback)", async () => {
  delete process.env.TWILIO_AUTH_TOKEN;
  seen.length = 0;
  assert.equal((await POST(request())).status, 503);
  assert.equal(seen.length, 0);
  assert.ok(logged.join().includes("TWILIO_AUTH_TOKEN") && !logged.join().includes(SID));
});

test("a handler error is a 500; no caller number, digits or fields are ever logged", async () => {
  const boom = twilioWebhook(() => { throw new Error("failed for +19155550999"); });
  assert.equal((await boom(request())).status, 500);
  await POST(request({ token: "x" }));
  const text = logged.join();
  assert.ok(text.includes("webhook failed") && text.includes("rejected request"));
  assert.ok(!/5550999|5550100|CA123|Digits|try=1/.test(text), text);
});
