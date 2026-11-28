/**
 * Voicemail. Run: npm run check:phone-voicemail
 * (db-guard refuses production; DEV database. Nothing rings, no email is sent and Twilio is never contacted:
 * TWILIO_MODE and EMAIL_MODE are capture, and the recordings API is a stand-in.)
 *  - only the President and Vice President may listen; the notice goes only to them and holds a link only
 *  - callers' numbers are stored encrypted, masked unless the President or VP asks (each view audited), never in the
 *    audit log or an email; daily limits
 *  - the recording callback, playback with range requests (every play audited)
 *  - deletion at the provider first; the daily job expires, retries, recovers and sweeps
 */
import "./_load-env";
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/db";
import { cellLock, resolveMatrix, validateMatrix } from "../src/lib/permission-rules";
import { DEFAULT_MATRIX, ROLE_KEYS, type Matrix } from "../src/lib/permission-catalog";
import { resolvePermissions } from "../src/lib/permissions";
import { defaultRecipients, resolveRecipients, validateRecipients } from "../src/lib/email-routing/definitions";
import { clearEmailOutbox, emailOutbox } from "../src/lib/email/send";
import type { RecordingInfo, RecordingStore } from "../src/lib/twilio/client";
import { VoiceTwiml } from "../src/lib/twilio/twiml";
import { reachFrom } from "../src/lib/twilio/mode";
import { callerDataReady, callerHash, callerNumber, decryptCaller, displayNumber, encryptCaller, maskedCaller, typedNumber } from "../src/lib/phone/caller";
import { audioResponse, parseRange } from "../src/lib/phone/audio-range";
import { voicemailPrompt } from "../src/lib/phone/ivr";
import { VOICEMAIL_DAILY_LIMIT, VOICEMAIL_MAX_SECONDS, VOICEMAIL_RETENTION_DAYS, VOICEMAIL_TOTAL_DAILY_LIMIT, VOICEMAIL_UNKNOWN_DAILY_LIMIT } from "../src/lib/phone/definitions";
import {
  MEDIA_OPEN_KEY, deleteVoicemail, expiryCutoff, offerVoicemail, recordingReported, runVoicemailRetention, sendVoicemailNotice, type VoicemailDeps,
} from "../src/lib/phone/voicemail";
import { findByCaller, playVoicemail, revealCaller, setHandled, voicemailView } from "../src/lib/phone/voicemail-board";
import { POST as voicemailRoute } from "../src/app/api/twilio/voice/voicemail/route";
import { POST as doneRoute } from "../src/app/api/twilio/voice/voicemail/done/route";
import { POST as recordingRoute } from "../src/app/api/twilio/voice/voicemail/recording/route";
import { purgeCallRecords } from "../src/lib/phone/call-records";
import type { CallRecordStore } from "../src/lib/twilio/client";
import { restorePhoneSystem, savePhoneSystem, setPhoneSystem } from "./_phone-flag";

const HOEP = "+19155550100", CALLER = "+19155550161", OTHER = "+19155550162", ACROSS = "+526565550163";
const SID = `AC${"7".repeat(32)}`, TOKEN = "voicemail-check-token", BASE = "https://hemoelpaso.org";
const KEY = randomBytes(32).toString("hex");
Object.assign(process.env, { TWILIO_ACCOUNT_SID: SID, TWILIO_AUTH_TOKEN: TOKEN, TWILIO_PHONE_NUMBER: HOEP, NEXT_PUBLIC_SITE_URL: BASE, PHONE_DATA_KEY: KEY });
delete process.env.NEXT_PUBLIC_EMAIL_DOMAIN;

const startedAt = new Date();
const hasNumbers = /555[-\s)]*01\d\d(?!\d)|6565550163/;
const callSids: string[] = [], patients: string[] = [];
const sidOf = (prefix: "CA" | "RE") => `${prefix}${randomBytes(16).toString("hex")}`;
const newCall = () => { const s = sidOf("CA"); callSids.push(s); return s; };
const DAY = 864e5;
let openBefore: Prisma.JsonValue | undefined;

/** The provider, in memory. */
function provider() {
  const held = new Map<string, RecordingInfo>();
  const log: string[] = [];
  const state = { failDelete: false, failList: false, open: false as boolean | null };
  const store: RecordingStore = {
    async list() { return state.failList ? { ok: false, error: "failed" } : { ok: true, items: Array.from(held.values()) }; },
    async remove(sid) { log.push(`remove ${sid}`); if (state.failDelete) return { ok: false, error: "failed" }; held.delete(sid); return { ok: true }; },
    async media(sid) { log.push(`media ${sid}`); return held.has(sid) ? { ok: true, audio: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) } : { ok: false, error: "not_found" }; },
    async openToPublic() { return state.open; },
  };
  const deps: VoicemailDeps = { recordings: store, sleep: async () => {} };
  const add = (callSid: string, o: Partial<RecordingInfo> = {}) => {
    const info: RecordingInfo = { sid: sidOf("RE"), callSid, status: "completed", createdAt: new Date(), durationSeconds: 20, ...o };
    held.set(info.sid, info);
    return info;
  };
  return { held, log, state, deps, add };
}
const row = (callSid: string) => prisma.phoneVoicemail.findUnique({ where: { callSid } });
const rowOf = async (callSid: string) => { const r = await row(callSid); assert.ok(r, "row"); return r; };
const wipe = () => prisma.phoneVoicemail.deleteMany({ where: { callSid: { in: callSids } } });

/** A message that arrived: offered, recorded at the provider, reported. */
async function leaveMessage(p: ReturnType<typeof provider>, from = CALLER, now = new Date()) {
  const callSid = newCall();
  assert.equal(await offerVoicemail({ callSid, from, option: "officer" }, now), true);
  const rec = p.add(callSid, { createdAt: now });
  assert.equal(await recordingReported({ callSid, recordingSid: rec.sid, status: "completed", durationSeconds: 20, option: "officer" }, p.deps, now), "stored");
  return { callSid, rec, id: (await rowOf(callSid)).id };
}
async function boardMember(first: string) {
  const p = await prisma.patient.create({ data: { email: `vmail${Date.now()}.${first}@hemoelpaso.org`, role: "board", source: "web", contactProfile: { create: { firstName: first, lastName: "Vmail" } } } });
  patients.push(p.id);
  return p.id;
}
let president = "", vice = "";

let switchBefore: Awaited<ReturnType<typeof savePhoneSystem>>;

before(async () => {
  switchBefore = await savePhoneSystem();
  await setPhoneSystem(true);
  openBefore = (await prisma.appSetting.findUnique({ where: { key: MEDIA_OPEN_KEY } }))?.value;
  await prisma.appSetting.deleteMany({ where: { key: MEDIA_OPEN_KEY } });
  president = await boardMember("Pres");
  vice = await boardMember("Vice");
});
after(async () => {
  await restorePhoneSystem(switchBefore);
  await prisma.auditLog.deleteMany({ where: { createdAt: { gte: startedAt }, resourceType: "PhoneVoicemail" } });
  await wipe();
  await prisma.appSetting.deleteMany({ where: { key: MEDIA_OPEN_KEY } });
  if (openBefore !== undefined) await prisma.appSetting.create({ data: { key: MEDIA_OPEN_KEY, value: openBefore as Prisma.InputJsonValue } });
  await prisma.emailLog.deleteMany({ where: { sentAt: { gte: startedAt }, templateType: "VOICEMAIL_NOTICE" } });
  await prisma.patient.deleteMany({ where: { id: { in: patients } } });
  await prisma.$disconnect();
});

// ───────────────────────── who ─────────────────────────
test("only the President and Vice President can hold the voicemail permission", () => {
  const holders = (m: Matrix) => ROLE_KEYS.filter((r) => m[r].includes("canListenVoicemail")).sort();
  assert.deepEqual(holders(DEFAULT_MATRIX), ["PRESIDENT", "VICE_PRESIDENT"]);
  assert.equal(resolvePermissions("admin", ["PRESIDENT"], DEFAULT_MATRIX).has("canListenVoicemail"), false);
  assert.deepEqual(holders(resolveMatrix([{ role: "SECRETARY", permission: "canListenVoicemail", granted: true }, { role: "ADMIN", permission: "canListenVoicemail", granted: true }])), ["PRESIDENT", "VICE_PRESIDENT"]);
  assert.equal(cellLock("TREASURER", "canListenVoicemail")?.reason, "phi_policy");
  const tampered: Matrix = JSON.parse(JSON.stringify(DEFAULT_MATRIX)); tampered.SECRETARY.push("canListenVoicemail");
  assert.equal(validateMatrix(tampered).ok, false);
});

test("every voicemail page and route checks that permission first", () => {
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
  const routes = walk("src/app/api/admin/voicemails");
  assert.equal(routes.length, 4);
  let handlers = 0;
  for (const f of routes) {
    const src = readFileSync(f, "utf8");
    for (const h of Array.from(src.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)/g))) {
      handlers++;
      const body = src.slice(h.index!), at = body.indexOf('requirePermission("canListenVoicemail")');
      assert.ok(at > 0 && at < 220, `${f} ${h[1]}`);
    }
  }
  assert.equal(handlers, 5);
  assert.match(readFileSync("src/app/admin/voicemails/page.tsx", "utf8"), /!admin\.can\("canListenVoicemail"\)\) redirect/);
  assert.match(readFileSync("src/translation/adminSidebar.ts", "utf8"), /"\/admin\/voicemails": "canListenVoicemail"/);
});

test("the notice route: president@ and vicepresident@ only", () => {
  const D = "hemoelpaso.org";
  assert.deepEqual(defaultRecipients("phone.voicemail", D), [`president@${D}`, `vicepresident@${D}`]);
  assert.equal(validateRecipients("phone.voicemail", [`president@${D}`], D).ok, true);
  for (const bad of [[`secretary@${D}`], [`info@${D}`], [`president@${D}`, `treasurer@${D}`], ["president@gmail.com"], []]) {
    assert.equal(validateRecipients("phone.voicemail", bad, D).ok, false, JSON.stringify(bad));
  }
  assert.deepEqual(resolveRecipients("phone.voicemail", [`secretary@${D}`], D), [`president@${D}`, `vicepresident@${D}`], "a tampered row is ignored");
});

// ───────────────────────── the caller's number ─────────────────────────
test("callers' numbers: encrypted, hashed with a key, masked; nothing without the key", () => {
  const enc = encryptCaller(CALLER)!;
  assert.ok(!enc.includes("5550161") && encryptCaller(CALLER) !== enc);
  assert.equal(decryptCaller(enc), CALLER);
  assert.equal(maskedCaller(enc), "(•••) •••-0161");
  assert.equal(decryptCaller(enc, { PHONE_DATA_KEY: randomBytes(32).toString("hex") }), null, "another key reads nothing");
  assert.match(callerHash(CALLER)!, /^[0-9a-f]{64}$/);
  assert.notEqual(callerHash(CALLER), callerHash(CALLER, { PHONE_DATA_KEY: randomBytes(32).toString("hex") }));
  for (const env of [{}, { PHONE_DATA_KEY: "short" }, { PHONE_DATA_KEY: "z".repeat(64) }]) {
    assert.equal(callerDataReady(env), false);
    assert.deepEqual([encryptCaller(CALLER, env), callerHash(CALLER, env), maskedCaller(enc, env)], [null, null, null]);
  }
  assert.equal(callerNumber(ACROSS), ACROSS, "a number from across the border is kept");
  for (const hidden of ["anonymous", "+266696687", "+7378742833", "+2562533", "+8656696", "", undefined]) assert.equal(callerNumber(hidden), null, String(hidden));
  assert.deepEqual(["(915) 555-0161", "+52 656 555 0163", "555-0161", "words", 5].map(typedNumber), [CALLER, ACROSS, null, null, null]);
});

// ───────────────────────── TwiML ─────────────────────────
test("recording: 120 seconds at most, no transcription, status reported; capture mode records nothing", () => {
  const x = voicemailPrompt(new VoiceTwiml(reachFrom({ TWILIO_MODE: "allowlist" })), "events", true).toString();
  assert.equal(VOICEMAIL_MAX_SECONDS, 120);
  assert.match(x, /<Record action="\/api\/twilio\/voice\/voicemail\/done\?o=events" method="POST" maxLength="120" timeout="6" finishOnKey="#" playBeep="true" trim="trim-silence" transcribe="false" recordingStatusCallback="\/api\/twilio\/voice\/voicemail\/recording\?o=events" recordingStatusCallbackMethod="POST" recordingStatusCallbackEvent="completed absent"\/>/);
  assert.ok(!x.includes("transcribeCallback"));
  assert.ok(!voicemailPrompt(new VoiceTwiml(reachFrom({})), "events", true).toString().includes("<Record"));
  assert.match(voicemailPrompt(new VoiceTwiml(reachFrom({})), "events", false).toString(), /could not connect/);
});

// ───────────────────────── offering ─────────────────────────
test("offering: a row with no readable number, once per call, within each caller's daily limit", async () => {
  await wipe();
  const first = newCall();
  assert.equal(await offerVoicemail({ callSid: first, from: CALLER, option: "officer" }), true);
  assert.equal(await offerVoicemail({ callSid: first, from: CALLER, option: "officer" }), true, "the same request again");
  const r = await rowOf(first);
  assert.deepEqual([r.status, r.mailbox, r.language, r.recordingSid], ["pending", "officer", "en+es", null]);
  assert.ok(!hasNumbers.test(JSON.stringify(r)) && decryptCaller(r.callerEnc) === CALLER);

  for (let i = 1; i < VOICEMAIL_DAILY_LIMIT; i++) assert.equal(await offerVoicemail({ callSid: newCall(), from: CALLER, option: "events" }), true, `message ${i + 1}`);
  assert.equal(await offerVoicemail({ callSid: newCall(), from: CALLER, option: "events" }), false, "over the limit");
  assert.equal(await offerVoicemail({ callSid: newCall(), from: OTHER, option: "events" }), true, "somebody else is not affected");
  assert.equal(await offerVoicemail({ callSid: newCall(), from: CALLER, option: "events" }, new Date(Date.now() + DAY + 60_000)), true, "a day later");

  await wipe();
  const parallel = await Promise.all(Array.from({ length: VOICEMAIL_DAILY_LIMIT + 3 }, () => offerVoicemail({ callSid: newCall(), from: CALLER, option: "events" })));
  assert.equal(parallel.filter(Boolean).length, VOICEMAIL_DAILY_LIMIT, "parallel calls can't pass the limit together");
});

test("offering: hidden numbers share one allowance; everybody together is capped; no key or a bad call id means no recording", async () => {
  await wipe();
  for (let i = 0; i < VOICEMAIL_UNKNOWN_DAILY_LIMIT; i++) assert.equal(await offerVoicemail({ callSid: newCall(), from: i % 2 ? "anonymous" : "+266696687", option: "events" }), true);
  const sid = newCall();
  assert.equal(await offerVoicemail({ callSid: sid, from: "+7378742833", option: "events" }), false);
  assert.equal(await row(sid), null);

  await wipe();
  const now = new Date();
  const filler = Array.from({ length: VOICEMAIL_TOTAL_DAILY_LIMIT }, () => ({ callSid: newCall(), mailbox: "events", language: "en", callerHash: randomBytes(32).toString("hex"), createdAt: now }));
  await prisma.phoneVoicemail.createMany({ data: filler });
  assert.equal(await offerVoicemail({ callSid: newCall(), from: OTHER, option: "events" }), false, "total daily limit");

  await wipe();
  assert.equal(await offerVoicemail({ callSid: "nonsense", from: OTHER, option: "events" }), false);
  delete process.env.PHONE_DATA_KEY;
  try {
    const none = newCall();
    assert.equal(await offerVoicemail({ callSid: none, from: OTHER, option: "events" }), false);
    assert.equal(await row(none), null, "nothing is stored unprotected");
  } finally { process.env.PHONE_DATA_KEY = KEY; }
});

// ───────────────────────── the recording callback and the notice ─────────────────────────
test("a message: ready once, audited, and the President and Vice President get 'New voicemail' and a link only", async () => {
  await wipe(); clearEmailOutbox();
  const p = provider();
  const m = await leaveMessage(p);
  assert.equal(await recordingReported({ callSid: m.callSid, recordingSid: m.rec.sid, status: "completed", durationSeconds: 20, option: "officer" }, p.deps), "duplicate");
  const r = await rowOf(m.callSid);
  assert.ok(r.status === "ready" && r.recordingSid === m.rec.sid && r.durationSeconds === 20 && r.receivedAt && r.noticeSentAt);

  const mails = emailOutbox().filter((x) => x.kind === "VOICEMAIL_NOTICE");
  assert.deepEqual(mails.map((x) => x.to).sort(), ["president@hemoelpaso.org", "vicepresident@hemoelpaso.org"], "one send, these two only");
  assert.equal(mails[0].subject, "New voicemail / Nuevo mensaje de voz");
  const text = mails[0].html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  assert.equal(text, `New voicemail · Nuevo mensaje de voz ${BASE}/admin/voicemails`);
  assert.deepEqual(Array.from(mails[0].html.matchAll(/href="([^"]+)"/g)).map((x) => x[1]), [`${BASE}/admin/voicemails`]);
  assert.ok(!mails[0].html.includes(m.rec.sid) && !mails[0].html.includes(m.id) && !/attachment/i.test(JSON.stringify(mails[0])));
  assert.equal(await prisma.auditLog.count({ where: { action: "VOICEMAIL_RECEIVED", resourceId: m.id } }), 1);
  assert.equal(await sendVoicemailNotice(m.id), false, "already sent");
});

test("a hang-up or silence is not kept: deleted at the provider, no number left, no email", async () => {
  await wipe(); clearEmailOutbox();
  const p = provider();
  const short = newCall();
  await offerVoicemail({ callSid: short, from: CALLER, option: "events" });
  const rec = p.add(short, { durationSeconds: 1 });
  assert.equal(await recordingReported({ callSid: short, recordingSid: rec.sid, status: "completed", durationSeconds: 1, option: "events" }, p.deps), "no_message");
  let r = await rowOf(short);
  assert.deepEqual([r.status, r.deletedReason, r.callerEnc], ["deleted", "no_message", null]);
  assert.ok(r.callerHash, "still counts towards today's limit");
  assert.equal(p.held.size, 0);

  const absent = newCall();
  await offerVoicemail({ callSid: absent, from: CALLER, option: "events" });
  assert.equal(await recordingReported({ callSid: absent, recordingSid: sidOf("RE"), status: "absent", durationSeconds: null, option: "events" }, p.deps), "no_message");
  r = await rowOf(absent);
  assert.equal(r.status, "deleted");
  assert.equal(emailOutbox().length, 0);

  for (const bad of [{ status: "in-progress" }, { callSid: "x" }, { recordingSid: "../Accounts" }]) {
    assert.equal(await recordingReported({ callSid: absent, recordingSid: sidOf("RE"), status: "completed", durationSeconds: 9, option: "events", ...bad }, p.deps), "ignored", JSON.stringify(bad));
  }
  // a message whose row was lost is still kept, without a caller
  const lost = newCall();
  assert.equal(await recordingReported({ callSid: lost, recordingSid: p.add(lost).sid, status: "completed", durationSeconds: 9, option: "spanish" }, p.deps), "stored");
  assert.deepEqual([(await rowOf(lost)).mailbox, (await rowOf(lost)).callerEnc], ["spanish", null]);
});

// ───────────────────────── webhooks end to end ─────────────────────────
const sign = (url: string, params: Record<string, string>) => createHmac("sha1", TOKEN).update(url + Object.keys(params).sort().map((k) => k + params[k]).join("")).digest("base64");
async function hit(handler: (r: NextRequest) => Promise<Response>, path: string, params: Record<string, string>, signed = true) {
  const all = { AccountSid: SID, From: CALLER, ...params };
  const res = await handler(new NextRequest(`${BASE}${path}`, {
    method: "POST", body: new URLSearchParams(all).toString(),
    headers: { "content-type": "application/x-www-form-urlencoded", "x-twilio-signature": signed ? sign(`${BASE}${path}`, all) : "bad" },
  }));
  return { status: res.status, text: await res.text() };
}

test("signed webhooks: greeting and beep, thanks, and the recording callback", async () => {
  await wipe(); clearEmailOutbox();
  const CallSid = newCall(), RecordingSid = sidOf("RE");
  assert.equal((await hit(voicemailRoute, "/api/twilio/voice/voicemail?o=spanish", { CallSid }, false)).status, 403);
  assert.equal(await row(CallSid), null);

  // allowlist here only so that the TwiML holds <Record>; these routes ask the provider for nothing
  process.env.TWILIO_MODE = "allowlist";
  const offered = await hit(voicemailRoute, "/api/twilio/voice/voicemail?o=spanish", { CallSid });
  process.env.TWILIO_MODE = "capture";
  assert.equal(offered.status, 200);
  assert.match(offered.text, /Puede dejar un mensaje, que se grabará/);
  assert.match(offered.text, /<Record [^>]*recording\?o=spanish/);
  assert.equal((await rowOf(CallSid)).status, "pending");

  assert.match((await hit(doneRoute, "/api/twilio/voice/voicemail/done?o=spanish", { CallSid, RecordingSid, RecordingDuration: "0" })).text, /No recibimos ningún mensaje/);
  assert.match((await hit(doneRoute, "/api/twilio/voice/voicemail/done?o=spanish", { CallSid, RecordingSid, RecordingDuration: "12" })).text, /Su mensaje quedó grabado/);
  const cb = await hit(recordingRoute, "/api/twilio/voice/voicemail/recording?o=spanish", { CallSid, RecordingSid, RecordingStatus: "completed", RecordingDuration: "12" });
  assert.deepEqual([cb.status, cb.text.endsWith("<Response></Response>")], [200, true]);
  assert.deepEqual([(await rowOf(CallSid)).status, (await rowOf(CallSid)).durationSeconds], ["ready", 12]);
});

// ───────────────────────── playback ─────────────────────────
test("range requests: what Safari asks for", async () => {
  assert.deepEqual(parseRange("bytes=0-1", 10), { start: 0, end: 1 });
  assert.deepEqual(parseRange("bytes=4-", 10), { start: 4, end: 9 });
  assert.deepEqual(parseRange("bytes=-3", 10), { start: 7, end: 9 });
  assert.deepEqual(parseRange("bytes=0-999", 10), { start: 0, end: 9 });
  for (const full of [null, "", "bytes=", "bytes=-", "items=0-1", "bytes=0-1,4-5", "bytes=5-2"]) assert.equal(parseRange(full, 10), "full", String(full));
  for (const bad of ["bytes=10-", "bytes=-0"]) assert.equal(parseRange(bad, 10), "unsatisfiable", bad);

  const audio = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const part = audioResponse(audio, "bytes=2-4");
  assert.deepEqual([part.status, part.headers.get("content-range"), part.headers.get("content-length")], [206, "bytes 2-4/10", "3"]);
  assert.deepEqual(Array.from(new Uint8Array(await part.arrayBuffer())), [2, 3, 4]);
  const whole = audioResponse(audio, null);
  assert.deepEqual([whole.status, (await whole.arrayBuffer()).byteLength], [200, 10]);
  const none = audioResponse(audio, "bytes=99-");
  assert.deepEqual([none.status, none.headers.get("content-range")], [416, "bytes */10"]);
  for (const res of [part, whole, none]) {
    assert.equal(res.headers.get("cache-control"), "private, no-store");
    assert.equal(res.headers.get("accept-ranges"), "bytes");
    assert.equal(res.headers.get("content-type"), "audio/mpeg");
  }
});

test("every play is audited; the range requests of one play count once; no audio for a deleted message", async () => {
  await wipe();
  const p = provider();
  const m = await leaveMessage(p);
  const plays = () => prisma.auditLog.findMany({ where: { action: "VOICEMAIL_PLAYED", resourceId: m.id }, orderBy: { createdAt: "asc" } });
  const play = (actorId: string, playId: string | null) => playVoicemail(m.id, { actorId, playId }, p.deps);
  for (let i = 0; i < 3; i++) assert.equal((await play(president, "play-one-0000")).ok, true);
  assert.equal((await plays()).length, 1);
  await play(president, "play-two-0000");
  await play(vice, "play-two-0000");
  assert.equal((await plays()).length, 3, "a second play, and another person");
  await play(president, null);
  await play(president, null);
  assert.equal((await plays()).length, 5, "no play id: each request is logged");
  assert.deepEqual(new Set((await plays()).map((a) => a.patientId)), new Set([president, vice]));
  const r = await rowOf(m.callSid);
  assert.deepEqual([!!r.listenedAt, r.listenedById], [true, president], "first listener");

  assert.equal(await setHandled(m.id, true, vice), true);
  assert.deepEqual([!!(await rowOf(m.callSid)).handledAt, (await rowOf(m.callSid)).handledById], [true, vice]);
  const view = await voicemailView();
  const item = view.items.find((i) => i.id === m.id)!;
  assert.deepEqual([item.caller, item.handledBy], ["(•••) •••-0161", "Vice Vmail"]);
  assert.ok(!hasNumbers.test(JSON.stringify(view)) && !JSON.stringify(view).includes(m.rec.sid), "nothing more leaves the server");
  await setHandled(m.id, false, vice);
  assert.equal((await rowOf(m.callSid)).handledAt, null);

  await deleteVoicemail(m.id, { reason: "manual", actorId: president }, p.deps);
  assert.deepEqual(await play(president, "play-three-00"), { ok: false, error: "not_found" });
  assert.equal(await setHandled(m.id, true, vice), false);
});

// ───────────────────────── the full number ─────────────────────────
test("the full number: one message at a time, audited on every view, and only the id goes in the audit log", async () => {
  await wipe(); clearEmailOutbox();
  const p = provider();
  const m = await leaveMessage(p, CALLER);
  const abroad = await leaveMessage(p, ACROSS);
  const hidden = await leaveMessage(p, "anonymous");
  const views = (id: string) => prisma.auditLog.findMany({ where: { action: "VOICEMAIL_CALLER_VIEWED", resourceId: id } });

  const view = await voicemailView();
  assert.ok(!hasNumbers.test(JSON.stringify(view)), "the page itself carries masked numbers only");
  assert.equal(view.items.find((i) => i.id === m.id)!.caller, "(•••) •••-0161");
  assert.equal((await views(m.id)).length, 0, "listing is not viewing a number");
  assert.ok(emailOutbox().every((x) => !hasNumbers.test(x.html + x.subject)), "never in the email");

  assert.deepEqual(await revealCaller(m.id, president), { ok: true, number: "(915) 555-0161" });
  assert.deepEqual(await revealCaller(m.id, president), { ok: true, number: "(915) 555-0161" });
  assert.deepEqual(await revealCaller(m.id, vice), { ok: true, number: "(915) 555-0161" });
  const rows = await views(m.id);
  assert.deepEqual(rows.map((r) => r.patientId).sort(), [president, president, vice].sort(), "every view");
  for (const r of rows) assert.ok(r.actorType === "board" && r.changes === null && !hasNumbers.test(JSON.stringify(r)));
  assert.deepEqual(await revealCaller(abroad.id, president), { ok: true, number: ACROSS });
  assert.equal(displayNumber("+19155550100"), "(915) 555-0100");

  assert.deepEqual(await revealCaller(hidden.id, president), { ok: false, error: "no_number" });
  assert.equal((await views(hidden.id)).length, 0);
  process.env.PHONE_DATA_KEY = randomBytes(32).toString("hex");
  try { assert.deepEqual(await revealCaller(m.id, president), { ok: false, error: "no_number" }, "another key"); }
  finally { process.env.PHONE_DATA_KEY = KEY; }
  await deleteVoicemail(m.id, { reason: "manual", actorId: president }, p.deps);
  assert.deepEqual(await revealCaller(m.id, president), { ok: false, error: "not_found" });
  assert.equal((await views(m.id)).length, 3);
});

test("a caller's number is decrypted in one place besides the mask", () => {
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : /\.tsx?$/.test(n) ? [join(d, n)] : []));
  const using = (re: RegExp) => walk("src").filter((f) => re.test(readFileSync(f, "utf8"))).sort();
  assert.deepEqual(using(/\bdecryptCaller\b/), ["src/lib/phone/caller.ts", "src/lib/phone/voicemail-board.ts"]);
  assert.deepEqual(using(/\brevealCaller\b/).filter((f) => !f.startsWith("src/lib/phone/")), ["src/app/api/admin/voicemails/[id]/caller/route.ts"]);
});

// ───────────────────────── deleting ─────────────────────────
test("deleting: the provider first; if it fails the message stays; then no number is left", async () => {
  await wipe();
  const p = provider();
  const m = await leaveMessage(p);
  p.state.failDelete = true;
  assert.deepEqual(await deleteVoicemail(m.id, { reason: "manual", actorId: president }, p.deps), { ok: false, error: "failed" });
  assert.equal(p.log.filter((l) => l === `remove ${m.rec.sid}`).length, 3, "tried three times");
  let r = await rowOf(m.callSid);
  assert.deepEqual([r.status, r.deleteAttempts, !!r.callerEnc, r.deletedAt], ["ready", 1, true, null]);
  assert.equal(await prisma.auditLog.count({ where: { action: "VOICEMAIL_DELETED", resourceId: m.id } }), 0);

  p.state.failDelete = false;
  assert.deepEqual(await deleteVoicemail(m.id, { reason: "manual", actorId: president }, p.deps), { ok: true });
  r = await rowOf(m.callSid);
  assert.deepEqual([r.status, r.deletedReason, r.deletedById, r.callerEnc, r.callerHash], ["deleted", "manual", president, null, null]);
  assert.equal(p.held.size, 0);
  const audit = await prisma.auditLog.findFirstOrThrow({ where: { action: "VOICEMAIL_DELETED", resourceId: m.id } });
  assert.deepEqual([audit.actorType, audit.patientId], ["board", president]);
  assert.deepEqual(await deleteVoicemail(m.id, { reason: "manual", actorId: president }, p.deps), { ok: false, error: "not_found" });
});

test("a caller's messages can be found by number, and the search is audited without it", async () => {
  await wipe();
  const p = provider();
  const mine = [await leaveMessage(p, CALLER), await leaveMessage(p, CALLER)];
  await leaveMessage(p, OTHER);
  const found = await findByCaller("(915) 555-0161", president);
  assert.deepEqual(found.ok && found.ids.sort(), mine.map((m) => m.id).sort());
  assert.deepEqual(await findByCaller("555", president), { ok: false, error: "invalid" });
  const searches = await prisma.auditLog.findMany({ where: { action: "VOICEMAIL_SEARCHED", createdAt: { gte: startedAt } } });
  assert.equal(searches.length, 1);
  assert.deepEqual(searches[0].changes, { matches: 2 });
});

// ───────────────────────── the daily job ─────────────────────────
test("the daily job: expires at the limit, retries failures, and clears what is left", async () => {
  await wipe();
  const p = provider();
  const now = new Date();
  assert.equal(now.getTime() - expiryCutoff(now).getTime(), (VOICEMAIL_RETENTION_DAYS - 1) * DAY, "never older than the limit, with one run a day");
  const old = await leaveMessage(p, CALLER, new Date(now.getTime() - 29 * DAY - 60_000));
  const young = await leaveMessage(p, OTHER, new Date(now.getTime() - 28 * DAY));

  p.state.failDelete = true;
  let s = await runVoicemailRetention(now, p.deps);
  assert.ok(s.failed >= 1 && s.expired === 0);
  assert.equal((await rowOf(old.callSid)).status, "ready", "not marked until the provider confirms");

  p.state.failDelete = false;
  s = await runVoicemailRetention(now, p.deps);
  assert.deepEqual([s.expired, s.failed, s.skipped], [1, 0, null]);
  assert.deepEqual([(await rowOf(old.callSid)).status, (await rowOf(old.callSid)).deletedReason], ["deleted", "retention"]);
  assert.equal((await rowOf(young.callSid)).status, "ready");
  assert.deepEqual(Array.from(p.held.keys()), [young.rec.sid]);

  await prisma.phoneVoicemail.update({ where: { id: old.id }, data: { createdAt: new Date(now.getTime() - 366 * DAY) } });
  s = await runVoicemailRetention(now, p.deps);
  assert.equal(s.records, 1);
  assert.equal(await row(old.callSid), null);
});

test("the daily job: takes in a lost recording, sweeps orphans, empties dead rows, resends a notice", async () => {
  await wipe(); clearEmailOutbox();
  const p = provider();
  const now = new Date(), twoDaysAgo = new Date(now.getTime() - 2 * DAY);

  const lost = newCall(); // offered, recorded, but the callback never came
  await offerVoicemail({ callSid: lost, from: CALLER, option: "events" }, now);
  const lostRec = p.add(lost, { createdAt: now });
  const nothing = newCall(); // offered long ago, never recorded
  await offerVoicemail({ callSid: nothing, from: OTHER, option: "events" }, twoDaysAgo);
  const orphan = p.add(newCall(), { createdAt: twoDaysAgo });
  const freshOrphan = p.add(newCall(), { createdAt: now });
  const busy = p.add(newCall(), { createdAt: twoDaysAgo, status: "processing" }); // can't be deleted yet
  const gone = await leaveMessage(p, OTHER, now);
  await deleteVoicemail(gone.id, { reason: "manual", actorId: president }, p.deps);
  p.held.set(gone.rec.sid, gone.rec); // the provider still has it
  const unsent = await leaveMessage(p, OTHER, new Date(now.getTime() - 3_600_000));
  await prisma.phoneVoicemail.update({ where: { id: unsent.id }, data: { noticeSentAt: null } });
  clearEmailOutbox();

  const s = await runVoicemailRetention(now, p.deps);
  assert.deepEqual([s.recovered, s.orphans, s.noMessage, s.notices, s.failed], [1, 2, 1, 1, 0]);
  assert.equal((await rowOf(lost)).status, "ready");
  assert.equal((await rowOf(lost)).recordingSid, lostRec.sid);
  assert.deepEqual([(await rowOf(nothing)).status, (await rowOf(nothing)).deletedReason, (await rowOf(nothing)).callerHash], ["deleted", "no_message", null]);
  assert.ok(!p.held.has(orphan.sid) && !p.held.has(gone.rec.sid));
  assert.ok(p.held.has(freshOrphan.sid) && p.held.has(busy.sid), "recent or unfinished recordings are left alone");
  assert.equal(emailOutbox().filter((m) => m.kind === "VOICEMAIL_NOTICE").length, 4, "the recovered one and the unsent one, to both officers");
});

test("the daily job: a failed listing marks nothing; test mode asks the provider nothing", async () => {
  await wipe();
  const p = provider();
  const now = new Date();
  const pending = newCall();
  await offerVoicemail({ callSid: pending, from: CALLER, option: "events" }, new Date(now.getTime() - 2 * DAY));
  p.state.failList = true;
  assert.equal((await runVoicemailRetention(now, p.deps)).failed, 1);
  assert.equal((await rowOf(pending)).status, "pending", "we can't know there is no recording");

  const m = await leaveMessage(provider(), OTHER, new Date(now.getTime() - 40 * DAY));
  const s = await runVoicemailRetention(now); // the real client, in capture mode
  assert.equal(s.skipped, "captured");
  assert.ok(s.failed >= 1, "an expired message that can't be deleted is a failure");
  assert.equal((await rowOf(m.callSid)).status, "ready");
  assert.equal((await voicemailView(now)).overdue >= 1, true);

  const cron = readFileSync("src/app/api/cron/retention/route.ts", "utf8");
  assert.ok(cron.includes("runVoicemailRetention()") && cron.includes("purgeCallRecords()") && /voicemail\?\.failed === 0 && calls\?\.failed === 0/.test(cron) && /status: ok \? 200 : 500/.test(cron));
});

test("the daily job deletes the provider's call records after a year, and reports what it couldn't", async () => {
  const now = new Date();
  let cutoff: Date | null = null;
  const removed: string[] = [];
  const store: CallRecordStore = {
    async listEndedBefore(c) { cutoff = c; return { ok: true, sids: ["CAa", "CAb", "CAc"] }; },
    async remove(sid) { if (sid === "CAb") return { ok: false, error: "failed" }; removed.push(sid); return { ok: true }; },
  };
  assert.deepEqual(await purgeCallRecords(now, store), { deleted: 2, failed: 1, skipped: null });
  assert.equal(now.getTime() - cutoff!.getTime(), 365 * DAY);
  assert.deepEqual(removed, ["CAa", "CAc"]);
  assert.deepEqual(await purgeCallRecords(now), { deleted: 0, failed: 0, skipped: "captured" }, "test mode asks nothing");
  assert.deepEqual(await purgeCallRecords(now, { ...store, async listEndedBefore() { return { ok: false, error: "failed" }; } }), { deleted: 0, failed: 1, skipped: null });
});

test("audio reachable without signing in raises a warning, which clears once it is protected", async () => {
  await wipe();
  const p = provider();
  p.state.open = true;
  await leaveMessage(p);
  assert.equal((await voicemailView()).audioUnprotected, true);
  p.state.open = null;
  await runVoicemailRetention(new Date(), p.deps);
  assert.equal((await voicemailView()).audioUnprotected, true, "unknown changes nothing");
  p.state.open = false;
  await runVoicemailRetention(new Date(), p.deps);
  assert.equal((await voicemailView()).audioUnprotected, false);
});

test("no audit row about voicemail holds a number", async () => {
  const rows = await prisma.auditLog.findMany({ where: { resourceType: "PhoneVoicemail", createdAt: { gte: startedAt } } });
  assert.ok(rows.length >= 10);
  for (const r of rows) assert.ok(!hasNumbers.test(JSON.stringify(r)), r.action);
});
