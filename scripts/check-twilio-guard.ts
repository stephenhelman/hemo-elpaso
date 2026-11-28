/**
 * Nothing reaches a real phone unless we're in production or opted in, and Twilio is used in one place.
 * Run: npm run check:twilio-guard   (offline: no database, no network, no Twilio account)
 *  - TWILIO_MODE: live only by default in production; capture everywhere else; live outside production THROWS
 *  - capture places no call and writes no <Dial>; allowlist reaches only listed numbers
 *  - every <Dial> is screened
 *  - recordings: nothing in capture mode; audio is fetched only with HTTP auth. Call records: old finished calls only
 *  - the production account is refused outside production; allowlist needs it to be recorded
 *  - missing credentials break phone code only (nothing reads them at server start)
 *  - one module uses the SDK, one writes TwiML, one reads the settings; every webhook uses the signature wrapper
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { beforeEach, test } from "node:test";
import { maskNumber, mayReach, reachFrom, resolveTwilioMode, toUsE164 } from "../src/lib/twilio/mode";
import { TwilioConfigError, fallbackNumber, readTwilioConfig, sha256Hex } from "../src/lib/twilio/config";
import { PRODUCTION_ACCOUNT_SID_SHA256 } from "../src/lib/twilio/production-account";
import { placeCall, twilioCallRecords, twilioRecordings, type CreateCall, type RestFailure } from "../src/lib/twilio/client";
import { VoiceTwiml } from "../src/lib/twilio/twiml";
import { clearTwilioOutbox, twilioOutbox } from "../src/lib/twilio/outbox";

const SID = `AC${"1".repeat(32)}`, PROD_SID = `AC${"2".repeat(32)}`;
const ALLOWED = "+19155550111", OTHER = "+19155550122", HOEP = "+19155550100";
const env = (o: Record<string, string> = {}) => ({ TWILIO_ACCOUNT_SID: SID, TWILIO_AUTH_TOKEN: "token", TWILIO_PHONE_NUMBER: HOEP, NEXT_PUBLIC_SITE_URL: "https://hemoelpaso.org", ...o });
const clear = () => { for (const k of Object.keys(process.env)) if (k.startsWith("TWILIO_") || k === "VERCEL_ENV") delete process.env[k]; };
beforeEach(() => { clear(); clearTwilioOutbox(); });

test("the mode: live by default only in production; capture everywhere else; the hard guard throws", () => {
  assert.equal(resolveTwilioMode({ VERCEL_ENV: "production" }), "live");
  for (const v of [undefined, "", "preview", "development"]) assert.equal(resolveTwilioMode({ VERCEL_ENV: v }), "capture", `VERCEL_ENV=${v}`);
  assert.equal(resolveTwilioMode({ TWILIO_MODE: " Capture ", VERCEL_ENV: "production" }), "capture");
  assert.equal(resolveTwilioMode({ TWILIO_MODE: "allowlist" }), "allowlist");
  for (const v of [undefined, "preview", "development", ""]) assert.throws(() => resolveTwilioMode({ TWILIO_MODE: "live", VERCEL_ENV: v }), /only allowed when VERCEL_ENV=production/);
  for (const v of ["yes", "test", "true"]) assert.throws(() => resolveTwilioMode({ TWILIO_MODE: v, VERCEL_ENV: "production" }), /must be/);
});

test("numbers: US only, in one form; masked to the last four", () => {
  for (const ok of ["(915) 555-0100", "915.555.0100", "9155550100", "+1 915 555 0100", "1-915-555-0100"]) assert.equal(toUsE164(ok), HOEP, ok);
  for (const bad of ["911", "411", "555-0100", "+52 656 555 0100", "+44 20 7946 0958", "+9155550100", "1155550100", "915555010a", "", null, 9155550100]) assert.equal(toUsE164(bad), null, String(bad));
  assert.equal(maskNumber(HOEP), "(•••) •••-0100");
});

test("who may be reached", () => {
  assert.equal(mayReach(OTHER, reachFrom({ VERCEL_ENV: "production" })), true);
  assert.equal(mayReach(ALLOWED, reachFrom({})), false, "capture reaches nobody");
  assert.equal(mayReach(ALLOWED, reachFrom({ TWILIO_DEV_ALLOWLIST: ALLOWED })), false, "the list means nothing outside allowlist mode");
  const r = reachFrom({ TWILIO_MODE: "allowlist", TWILIO_DEV_ALLOWLIST: " (915) 555-0111 , nonsense" });
  assert.deepEqual(r.allowlist, [ALLOWED]);
  assert.deepEqual([mayReach(ALLOWED, r), mayReach(OTHER, r)], [true, false]);
  assert.deepEqual(reachFrom({ TWILIO_MODE: "allowlist" }).allowlist, [], "an empty list reaches nobody");
});

test("capture: no call is placed (even with credentials), and it needs none", async () => {
  const placed: unknown[] = [];
  const create: CreateCall = async (_c, call) => { placed.push(call); return { sid: "CA1" }; };
  Object.assign(process.env, env({ TWILIO_MODE: "capture" }));
  assert.deepEqual(await placeCall({ to: ALLOWED, path: "/x", maxSeconds: 60 }, create), { ok: true, sid: null, captured: true });
  clear();
  assert.equal((await placeCall({ to: ALLOWED, path: "/x", maxSeconds: 60 }, create)).ok, true);
  assert.equal(placed.length, 0);
  assert.deepEqual(twilioOutbox().map((m) => [m.kind, m.to, m.reason, m.path]), [["call", ALLOWED, "capture", "/x"], ["call", ALLOWED, "capture", "/x"]]);
});

test("allowlist: only listed numbers are called, from HOEP's number, back to the configured address", async () => {
  const placed: { to: string; from: string; url: string; timeLimit: number }[] = [];
  const create: CreateCall = async (_c, call) => { placed.push(call); return { sid: "CA1" }; };
  Object.assign(process.env, env({ TWILIO_MODE: "allowlist", TWILIO_DEV_ALLOWLIST: ALLOWED, TWILIO_WEBHOOK_BASE_URL: "https://tunnel.example.com" }));
  assert.deepEqual(await placeCall({ to: OTHER, path: "/x", maxSeconds: 60 }, create), { ok: true, sid: null, captured: true });
  // PRODUCTION_ACCOUNT_SID_SHA256 gates allowlist mode: until it is recorded, even a listed number is not called
  const listed = await placeCall({ to: ALLOWED, path: "/api/twilio/voice/verify?n=1", maxSeconds: 60 }, create);
  if (!PRODUCTION_ACCOUNT_SID_SHA256) {
    assert.deepEqual(listed, { ok: false, error: "not_configured" });
    assert.equal(placed.length, 0);
  } else {
    assert.deepEqual(listed, { ok: true, sid: "CA1", captured: false });
    assert.deepEqual(placed, [{ to: ALLOWED, from: HOEP, url: "https://tunnel.example.com/api/twilio/voice/verify?n=1", timeLimit: 60 }]);
  }
});

test("a failed call is reported by code; the number is never logged", async () => {
  Object.assign(process.env, env({ VERCEL_ENV: "production" }));
  const logged: string[] = [];
  const real = console.error;
  console.error = (...a: unknown[]) => { logged.push(JSON.stringify(a)); };
  try {
    const ok = await placeCall({ to: ALLOWED, path: "/p", maxSeconds: 9 }, async (_c, call) => { assert.equal(call.url, "https://hemoelpaso.org/p"); return { sid: "CA9" }; });
    assert.deepEqual(ok, { ok: true, sid: "CA9", captured: false });
    const bad = await placeCall({ to: ALLOWED, path: "/p", maxSeconds: 9 }, async () => { throw Object.assign(new Error(`The number ${ALLOWED} is unverified`), { code: 21219, status: 400 }); });
    assert.deepEqual(bad, { ok: false, error: "call_failed" });
  } finally { console.error = real; }
  assert.ok(logged.join().includes("21219"));
  assert.ok(!logged.join().includes("5550111"));
});

test("TwiML: capture never writes a number or a <Dial>; allowlist dials only listed numbers; every dial is screened", () => {
  const dial = { to: ALLOWED, callerId: HOEP, screenPath: "/s?o=events", actionPath: "/a?o=events", ringSeconds: 20, maxSeconds: 3600 };
  const captured = new VoiceTwiml(reachFrom({})).screenedDial(dial).toString();
  assert.ok(!captured.includes("<Dial") && !captured.includes(ALLOWED));
  assert.match(captured, /<Redirect method="POST">\/a\?o=events<\/Redirect>/, "the call carries on as if nobody answered");
  assert.deepEqual(twilioOutbox().map((m) => [m.kind, m.to]), [["dial", ALLOWED]]);

  const allow = reachFrom({ TWILIO_MODE: "allowlist", TWILIO_DEV_ALLOWLIST: ALLOWED });
  assert.ok(!new VoiceTwiml(allow).screenedDial({ ...dial, to: OTHER }).toString().includes("<Dial"));
  const x = new VoiceTwiml(allow).screenedDial(dial).toString();
  assert.match(x, /<Dial answerOnBridge="true" callerId="\+19155550100" timeout="20" timeLimit="3600" action="\/a\?o=events" method="POST"><Number url="\/s\?o=events" method="POST">\+19155550111<\/Number><\/Dial>/);
  assert.equal(readFileSync("src/lib/twilio/twiml.ts", "utf8").match(/<Dial\$\{/g)?.length, 1, "one way to dial");
});

test("TwiML escapes what it is given", () => {
  const x = new VoiceTwiml(reachFrom({})).say(["en", `a <b> & "c"`]).gather({ action: "/x?a=1&b=2", digits: 1, timeoutSeconds: 5 }, [["es", "ñ"]]).hangup().toString();
  assert.ok(x.includes("a &lt;b&gt; &amp; &quot;c&quot;") && x.includes('action="/x?a=1&amp;b=2"'));
  assert.match(x, /^<\?xml version="1.0" encoding="UTF-8"\?><Response>.*<Hangup\/><\/Response>$/);
});

test("missing credentials throw by NAME, with no values; nothing throws at import or server start", () => {
  assert.throws(() => readTwilioConfig({}), (e: Error) => e instanceof TwilioConfigError && /TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER/.test(e.message));
  assert.throws(() => readTwilioConfig(env({ TWILIO_AUTH_TOKEN: " " })), /Missing environment variable\(s\): TWILIO_AUTH_TOKEN\./);
  const invalid: Record<string, string>[] = [{ TWILIO_ACCOUNT_SID: "SKabc" }, { TWILIO_PHONE_NUMBER: "+52 1" }, { TWILIO_API_KEY_SID: "SK1" }, { NEXT_PUBLIC_SITE_URL: "http://hemoelpaso.org" }, { NEXT_PUBLIC_SITE_URL: "https://hemoelpaso.org/path" }];
  for (const bad of invalid) {
    assert.throws(() => readTwilioConfig(env(bad)), TwilioConfigError, JSON.stringify(bad));
  }
  try { readTwilioConfig(env({ TWILIO_ACCOUNT_SID: "secret-value" })); } catch (e) { assert.ok(!(e as Error).message.includes("secret-value")); }
  const instr = readFileSync("src/instrumentation.ts", "utf8");
  assert.ok(instr.includes("resolveTwilioMode") && !instr.includes("twilio/config"), "mode at start, credentials never");
});

test("the production account is refused outside production; allowlist needs it recorded", () => {
  const hash = sha256Hex(PROD_SID);
  for (const mode of ["", "capture", "allowlist"]) {
    assert.throws(() => readTwilioConfig(env({ TWILIO_ACCOUNT_SID: PROD_SID, TWILIO_MODE: mode }), hash), /PRODUCTION account/, `mode "${mode}"`);
    assert.throws(() => readTwilioConfig(env({ TWILIO_ACCOUNT_SID: PROD_SID, TWILIO_MODE: mode, VERCEL_ENV: "preview" }), hash), /PRODUCTION account/);
  }
  assert.equal(readTwilioConfig(env({ TWILIO_ACCOUNT_SID: PROD_SID, VERCEL_ENV: "production" }), hash).reach.mode, "live");
  assert.equal(readTwilioConfig(env({ TWILIO_MODE: "allowlist" }), hash).reach.mode, "allowlist");
  assert.throws(() => readTwilioConfig(env({ TWILIO_MODE: "allowlist" }), ""), /recorded first/);
  assert.equal(readTwilioConfig(env(), "").reach.mode, "capture");
  assert.match(PRODUCTION_ACCOUNT_SID_SHA256, /^([0-9a-f]{64})?$/, "a SHA-256 or empty, never the SID");
});

test("the webhook address: a tunnel override in development only", () => {
  const o = { TWILIO_WEBHOOK_BASE_URL: "https://tunnel.example.com/" };
  assert.equal(readTwilioConfig(env(o), "").publicBaseUrl, "https://tunnel.example.com");
  assert.equal(readTwilioConfig(env({ ...o, VERCEL_ENV: "production" }), "").publicBaseUrl, "https://hemoelpaso.org");
});

test("the fallback number: a US number that isn't HOEP's own (that would loop)", () => {
  assert.equal(fallbackNumber({ TWILIO_FALLBACK_NUMBER: "915-555-0111", TWILIO_PHONE_NUMBER: HOEP }), ALLOWED);
  for (const v of [HOEP, "911", "", undefined]) assert.equal(fallbackNumber({ TWILIO_FALLBACK_NUMBER: v, TWILIO_PHONE_NUMBER: HOEP }), null);
});

test("the provider client: media with HTTP auth only, delete of a missing recording succeeds, nothing in capture mode", async () => {
  const seen: { url: string; auth: string | null }[] = [];
  let status = 200;
  const fake = (async (url: string | URL | Request, init?: RequestInit) => {
    seen.push({ url: String(url), auth: new Headers(init?.headers).get("authorization") });
    return new Response(status < 300 ? new Uint8Array([7]) : null, { status });
  }) as typeof fetch;
  let removeError: unknown = null;
  const api = twilioRecordings({ fetch: fake, sdk: () => ({ list: async () => [{ sid: "RE1", callSid: "CA1", status: "completed", dateCreated: new Date(), duration: "7" }], remove: async () => { if (removeError) throw removeError; } }) });
  const sid = `RE${"a".repeat(32)}`;
  const TOKEN = "token";
  Object.assign(process.env, env());

  const captured: RestFailure = { ok: false, error: "captured" };
  assert.deepEqual([await api.list(), await api.remove(sid), await api.media(sid), await api.openToPublic(sid)], [captured, captured, captured, null]);
  assert.equal(seen.length, 0);

  process.env.TWILIO_MODE = "allowlist";
  try {
    const media = await api.media(sid);
    assert.ok(media.ok && media.audio[0] === 7);
    assert.equal(seen[0].url, `https://api.twilio.com/2010-04-01/Accounts/${SID}/Recordings/${sid}.mp3`);
    assert.equal(seen[0].auth, `Basic ${Buffer.from(`${SID}:${TOKEN}`).toString("base64")}`);
    assert.equal(await api.openToPublic(sid), true);
    assert.equal(seen[1].auth, null, "the probe signs in as nobody");
    status = 401; assert.equal(await api.openToPublic(sid), false);
    status = 404; assert.deepEqual(await api.media(sid), { ok: false, error: "not_found" });
    status = 500; assert.deepEqual(await api.media(sid), { ok: false, error: "failed" });
    assert.deepEqual(await api.media("../../Calls"), { ok: false, error: "not_found" });
    const list = await api.list();
    assert.ok(list.ok && list.items[0].durationSeconds === 7);
    assert.deepEqual(await api.remove(sid), { ok: true });
    removeError = { status: 404 }; assert.deepEqual(await api.remove(sid), { ok: true });
    removeError = { status: 500, code: 20500 }; assert.deepEqual(await api.remove(sid), { ok: false, error: "failed" });
  } finally { clear(); }
});

test("call records: only finished calls older than the cutoff are deleted; nothing in capture mode", async () => {
  const cutoff = new Date("2026-01-01T00:00:00Z"), removed: string[] = [];
  const old = `CA${"1".repeat(32)}`, recent = `CA${"2".repeat(32)}`, running = `CA${"3".repeat(32)}`;
  const api = twilioCallRecords({ sdk: () => ({
    list: async () => [{ sid: old, endTime: new Date("2025-06-01") }, { sid: recent, endTime: new Date("2026-06-01") }, { sid: running, endTime: null }],
    remove: async (sid) => { removed.push(sid); },
  }) });
  Object.assign(process.env, env());
  assert.deepEqual([await api.listEndedBefore(cutoff), await api.remove(old)], [{ ok: false, error: "captured" }, { ok: false, error: "captured" }]);
  process.env.TWILIO_MODE = "allowlist";
  assert.deepEqual(await api.listEndedBefore(cutoff), { ok: true, sids: [old] }, "whatever the filter returns");
  assert.deepEqual(await api.remove("../Recordings"), { ok: false, error: "not_found" });
  assert.deepEqual(await api.remove(old), { ok: true });
  assert.deepEqual(removed, [old]);
});

// ── one place for each thing ────────────────────────────────────────────────
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return f === "node_modules" || f === ".next" ? [] : statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx|mjs|js)$/.test(f) ? [p.split(sep).join("/")] : []; });
const src = walk("src");
/** The code without its comments (a comment may name a thing; code may not use it). */
const code = (f: string) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/[^\n]*/g, "$1");
const offenders = (files: string[], re: RegExp, allow: string[] = []) => files.filter((f) => !allow.includes(f) && re.test(code(f)));

test("only lib/twilio/client.ts uses the Twilio SDK or its API", () => {
  const all = [...src, ...walk("scripts"), "next.config.mjs"].filter((f) => !f.startsWith("scripts/check-twilio"));
  assert.deepEqual(offenders(all, /(from\s+|import\(\s*|require\(\s*|import\s+)["'](twilio|@twilio\/[^"']+)(\/[^"']*)?["']/, ["src/lib/twilio/client.ts"]), []);
  assert.deepEqual(offenders(all, /api\.twilio\.com|new\s+Twilio\s*\(/, ["src/lib/twilio/client.ts"]), []);
  // recording audio is only ever addressed there, and never from the address a webhook sends
  assert.deepEqual(offenders(all.filter((f) => f.startsWith("src/")), /RecordingUrl/), []);
});

test("only the config modules read TWILIO_* settings, and none is exposed to the browser", () => {
  assert.deepEqual(offenders(src, /env\??(\.|\[\s*["'`])TWILIO_|\{[^}]*\bTWILIO_[A-Z_]+[^}]*\}\s*=\s*process\.env/, ["src/lib/twilio/config.ts", "src/lib/twilio/mode.ts"]), []);
  assert.deepEqual(offenders([...src, "next.config.mjs", ".env.example"], /NEXT_PUBLIC_TWILIO/), []);
});

test("only lib/twilio/twiml.ts writes calls or messages into TwiML; no account SID is written anywhere in src", () => {
  assert.deepEqual(offenders(src, /<(Dial|Number|Message|Sms|Client|Sip|Conference)[\s>/$]\{?|new\s+(VoiceResponse|MessagingResponse)/, ["src/lib/twilio/twiml.ts"]).filter((f) => !f.endsWith(".tsx")), []);
  assert.deepEqual(offenders(src, /\bAC[0-9a-f]{32}\b/), []);
});

test("every Twilio route is a POST behind the signature wrapper, and the middleware leaves them alone", () => {
  const dir = "src/app/api/twilio";
  for (const f of existsSync(dir) ? walk(dir) : []) {
    const s = readFileSync(f, "utf8");
    if (!/\/route\.tsx?$/.test(f)) continue;
    assert.match(s, /export const POST = twilioWebhook\(/, f);
    assert.ok(!/export\s+(async\s+)?(function|const)\s+(GET|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/.test(s), `${f}: POST only`);
    assert.match(s, /export const dynamic = "force-dynamic"/, f);
  }
  const middleware = readFileSync("src/middleware.ts", "utf8");
  assert.ok(!middleware.includes("twilio"), "no /api/twilio path in the middleware");
  assert.ok(!/["']\/api\/:path/.test(middleware) && !/["']\/:path\*["']/.test(middleware), "no catch-all matcher");
});

test("check scripts are forced to capture and lose real credentials; .env.example lists the variables, empty", () => {
  const loader = readFileSync("scripts/_load-env.ts", "utf8");
  assert.match(loader, /TWILIO_MODE = "capture"/);
  assert.match(loader, /delete process\.env\[name\]/);
  assert.match(loader, /delete process\.env\.PHONE_DATA_KEY/);
  const example = readFileSync(".env.example", "utf8");
  for (const v of ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER", "TWILIO_API_KEY_SID", "TWILIO_API_KEY_SECRET", "TWILIO_FALLBACK_NUMBER", "PHONE_DATA_KEY"]) assert.match(example, new RegExp(`^${v}=$`, "m"), v);
});
