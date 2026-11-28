/**
 * The phone menu, who answers it, and who may change that. Run: npm run check:phone-routing
 * (db-guard refuses production; DEV database; the stored routing row is put back afterwards. Nothing rings and no email
 * is sent: TWILIO_MODE and EMAIL_MODE are forced to capture.)
 *  - permissions: admin@ manages; President and VP swap; nobody else does either
 *  - duty numbers: US only, verified by a code typed on the called phone, masked everywhere
 *  - the menu: options ring the person on duty, with press-1 screening; otherwise on to voicemail (check:phone-voicemail)
 *  - after a dial, only DialBridged says the two talked (never the parent call's status, or DialCallStatus alone)
 *  - every change is audited without numbers and emailed to all four officers
 *  - the webhooks end to end, with signed requests
 *  - the phone_system switch: off (or unreadable) forwards to the fallback number, records nothing, never goes silent
 */
import "./_load-env";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/db";
import { emailDomain } from "../src/lib/site";
import { cellLock, resolveMatrix, validateMatrix } from "../src/lib/permission-rules";
import { DEFAULT_MATRIX, ROLE_KEYS, type Matrix, type Permission } from "../src/lib/permission-catalog";
import { resolvePermissions } from "../src/lib/permissions";
import { clearEmailOutbox, emailOutbox } from "../src/lib/email/send";
import { clearTwilioOutbox, twilioOutbox } from "../src/lib/twilio/outbox";
import { VoiceTwiml } from "../src/lib/twilio/twiml";
import { reachFrom } from "../src/lib/twilio/mode";
import {
  CODE_ATTEMPTS, CODE_TTL_MS, MAX_NUMBERS, VERIFY_CALL_LIMIT, checkDutyNumber, checkHours, destinationFor, emptyRouting, isOpenAt, optionForDigit, parseRouting, type Routing,
} from "../src/lib/phone/definitions";
import { addNumber, answerChallenge, assignDuty, hashCode, removeNumber, setHours, startChallenge, type Change } from "../src/lib/phone/change";
import { dialConnected, dialResult, greeting, menuChoice, screen, screenAnswer, switchedOff } from "../src/lib/phone/ivr";
import { phoneSystemOn } from "../src/lib/phone/system";
import { restorePhoneSystem, savePhoneSystem, setPhoneSystem } from "./_phone-flag";
import { addDutyNumber, changeDuty, changeHours, numberToRing, removeDutyNumber, startVerification } from "../src/lib/phone/service";
import { ROUTING_KEY, boardPeople, readRouting } from "../src/lib/phone/store";
import { phoneView } from "../src/lib/phone/view";
import { mergePeople } from "../src/lib/identity/merge";
import { POST as voice } from "../src/app/api/twilio/voice/route";
import { POST as menu } from "../src/app/api/twilio/voice/menu/route";
import { POST as screenRoute } from "../src/app/api/twilio/voice/screen/route";
import { POST as acceptRoute } from "../src/app/api/twilio/voice/screen/accept/route";
import { POST as dialResultRoute } from "../src/app/api/twilio/voice/dial-result/route";
import { POST as verifyRoute } from "../src/app/api/twilio/voice/verify/route";
import { POST as confirmRoute } from "../src/app/api/twilio/voice/verify/confirm/route";
import { POST as voicemailRoute } from "../src/app/api/twilio/voice/voicemail/route";

const HOEP = "+19155550100", ONE = "+19155550141", TWO = "+19155550142", FALLBACK = "+19155550149";
const SID = `AC${"5".repeat(32)}`, TOKEN = "routing-check-token", BASE = "https://hemoelpaso.org";
Object.assign(process.env, { TWILIO_ACCOUNT_SID: SID, TWILIO_AUTH_TOKEN: TOKEN, TWILIO_PHONE_NUMBER: HOEP, NEXT_PUBLIC_SITE_URL: BASE });

const tag = `phrt${Date.now()}`;
const startedAt = new Date();
const patients: string[] = [];
let storedBefore: Prisma.JsonValue | undefined;
const hasNumbers = /555[-\s)]*01\d\d(?!\d)/; // any of this file's numbers written out in full

let switchBefore: Awaited<ReturnType<typeof savePhoneSystem>>;

before(async () => {
  switchBefore = await savePhoneSystem();
  await setPhoneSystem(true);
  storedBefore = (await prisma.appSetting.findUnique({ where: { key: ROUTING_KEY } }))?.value;
  await prisma.appSetting.deleteMany({ where: { key: ROUTING_KEY } });
});
after(async () => {
  await restorePhoneSystem(switchBefore);
  await prisma.appSetting.deleteMany({ where: { key: ROUTING_KEY } });
  if (storedBefore !== undefined) await prisma.appSetting.create({ data: { key: ROUTING_KEY, value: storedBefore as Prisma.InputJsonValue } });
  await prisma.auditLog.deleteMany({ where: { OR: [{ patientId: { in: patients } }, { resourceType: "PhoneRouting", createdAt: { gte: startedAt } }, { resourceId: { in: patients } }] } });
  await prisma.emailLog.deleteMany({ where: { sentAt: { gte: startedAt }, templateType: "ADMIN_CHANGE_NOTICE" } });
  await prisma.patient.deleteMany({ where: { id: { in: patients } } });
  await prisma.$disconnect();
});

async function boardMember(name: string, role: "PRESIDENT" | "VICE_PRESIDENT" | "SECRETARY" = "PRESIDENT") {
  const p = await prisma.patient.create({
    data: { email: `${tag}.${name}@hemoelpaso.org`, role: "board", source: "web", contactProfile: { create: { firstName: name, lastName: tag } }, boardRoles: { create: [{ role, assignedBy: "test" }] } },
  });
  patients.push(p.id);
  return p.id;
}
const ok = (c: Change): Routing => { assert.ok(c.ok, JSON.stringify(c)); return c.routing; };
const errorOf = (c: Change | { ok: boolean; error?: string }) => (c.ok ? "ok" : (c as { error: string }).error);

// ───────────────────────── permissions ─────────────────────────
test("admin@ manages routing; President and VP swap duty; nobody else does either", () => {
  const holders = (m: Matrix, p: Permission) => ROLE_KEYS.filter((r) => m[r].includes(p)).sort();
  assert.deepEqual(holders(DEFAULT_MATRIX, "canManagePhoneRouting"), ["ADMIN"]);
  assert.deepEqual(holders(DEFAULT_MATRIX, "canSwapPhoneDuty"), ["PRESIDENT", "VICE_PRESIDENT"]);
  assert.equal(resolvePermissions("admin", ["PRESIDENT"], DEFAULT_MATRIX).has("canSwapPhoneDuty"), false);
  assert.equal(resolvePermissions("board", ["SECRETARY", "TREASURER"], DEFAULT_MATRIX).has("canSwapPhoneDuty"), false);
  // locked both ways: a stored row or a tampered save can neither add nor remove them
  const stored = resolveMatrix([
    { role: "SECRETARY", permission: "canSwapPhoneDuty", granted: true },
    { role: "PRESIDENT", permission: "canSwapPhoneDuty", granted: false },
    { role: "PRESIDENT", permission: "canManagePhoneRouting", granted: true },
    { role: "ADMIN", permission: "canManagePhoneRouting", granted: false },
  ]);
  assert.deepEqual([holders(stored, "canSwapPhoneDuty"), holders(stored, "canManagePhoneRouting")], [["PRESIDENT", "VICE_PRESIDENT"], ["ADMIN"]]);
  assert.deepEqual(cellLock("PRESIDENT", "canSwapPhoneDuty"), { reason: "officers_only", value: true });
  const tampered: Matrix = JSON.parse(JSON.stringify(DEFAULT_MATRIX)); tampered.TREASURER.push("canSwapPhoneDuty");
  assert.equal(validateMatrix(tampered).ok, false);
});

test("every admin phone route checks permission first: numbers and hours are admin@ only", () => {
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
  const files = walk("src/app/api/admin/settings/phone-routing");
  assert.equal(files.length, 5);
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    for (const h of Array.from(src.matchAll(/export async function (GET|POST|PUT|DELETE)/g))) {
      const body = src.slice(h.index!);
      const guard = /requirePermission\("canManagePhoneRouting"\)|requireAnyPermission\(\["canManagePhoneRouting", "canSwapPhoneDuty"\]\)/.exec(body);
      assert.ok(guard && guard.index < 220, `${f} ${h[1]}`);
      const swapAllowed = guard[0].includes("canSwapPhoneDuty");
      assert.equal(swapAllowed, /\/duty\/route\.ts$/.test(f) || (h[1] === "GET"), `${f} ${h[1]}: only reading and swapping are open to officers`);
    }
  }
  assert.match(readFileSync("src/app/api/admin/settings/phone-routing/duty/route.ts", "utf8"), /admin\.can\("canManagePhoneRouting"\) \? "manage" : "swap"/);
});

// ───────────────────────── rules ─────────────────────────
test("duty numbers: US phones only, never HOEP's own", () => {
  assert.deepEqual(checkDutyNumber("(915) 555-0141", HOEP), { ok: true, number: ONE });
  const cases: [string, string][] = [
    ["911", "invalid"], ["+52 656 555 0141", "invalid"], ["+1 911 555 0141", "not_allowed"], ["915-911-0141", "not_allowed"], ["900-555-0141", "not_allowed"],
    ["800-555-0141", "not_allowed"], ["915-976-0141", "not_allowed"], ["500-555-0141", "not_allowed"], ["876-555-0141", "not_us"], ["416-555-0141", "not_us"], [HOEP, "hoep_number"],
  ];
  for (const [input, error] of cases) assert.equal(errorOf(checkDutyNumber(input, HOEP)), error, input);
});

test("the menu digits", () => {
  assert.deepEqual(["1", "2", "3", "4", "", undefined].map(optionForDigit), ["events", "spanish", "officer", null, null, null]);
});

test("hours are El Paso wall-clock time, summer and winter", () => {
  const weekdays = { days: [1, 2, 3, 4, 5], start: "09:00", end: "17:00" };
  assert.equal(isOpenAt(null, new Date()), true);
  // Wednesday 2026-01-14 is MST (UTC-7); Wednesday 2026-07-15 is MDT (UTC-6)
  assert.equal(isOpenAt(weekdays, new Date("2026-01-14T16:00:00Z")), true, "9:00 a.m. in January");
  assert.equal(isOpenAt(weekdays, new Date("2026-01-14T15:59:00Z")), false);
  assert.equal(isOpenAt(weekdays, new Date("2026-07-15T15:00:00Z")), true, "9:00 a.m. in July");
  assert.equal(isOpenAt(weekdays, new Date("2026-07-15T23:00:00Z")), false, "5:00 p.m. is closed");
  assert.equal(isOpenAt(weekdays, new Date("2026-07-18T18:00:00Z")), false, "Saturday");
  assert.equal(isOpenAt({ days: [5], start: "09:00", end: "23:00" }, new Date("2026-07-18T03:00:00Z")), true, "Friday evening is already Saturday in UTC");
  for (const bad of [undefined, "any", { days: [], start: "09:00", end: "17:00" }, { days: [7], start: "09:00", end: "17:00" }, { days: [1], start: "17:00", end: "09:00" }, { days: [1], start: "9:00", end: "17:00" }]) assert.equal(checkHours(bad).ok, false, JSON.stringify(bad));
});

test("changes: add, verify by code, assign, swap, remove", () => {
  const now = new Date("2026-07-15T18:00:00Z");
  const board = new Set(["a", "b"]);
  let r = emptyRouting();
  const add = (id: string, ownerId: string, input: string) => addNumber(r, { id, ownerId, input, now, boardIds: board, hoep: HOEP });
  assert.equal(errorOf(add("n1", "stranger", ONE)), "not_board_member");
  r = ok(add("n1", "a", ONE));
  assert.equal(errorOf(add("n2", "b", "915.555.0141")), "duplicate");
  r = ok(add("n2", "b", TWO));

  assert.equal(errorOf(assignDuty(r, "events", "n1", "manage", board)), "not_verified");
  assert.deepEqual(destinationFor({ ...r, options: { ...r.options, events: { numberId: "n1", hours: null } } }, "events", board, now, HOEP), { ring: false, reason: "unverified" });

  r = ok(startChallenge(r, "n1", "123456", now, board));
  assert.ok(!JSON.stringify(r).includes("123456"), "the code itself is not stored");
  assert.equal(r.numbers[0].challenge!.hash, hashCode("n1", "123456"));
  let a = answerChallenge(r, "n1", "000000", now);
  assert.equal(a.outcome, "wrong");
  r = a.change!.routing;
  assert.equal(answerChallenge(r, "n1", "123456", new Date(now.getTime() + CODE_TTL_MS + 1)).outcome, "closed", "expired");
  let locked = r;
  for (let i = 1; i < CODE_ATTEMPTS; i++) { a = answerChallenge(locked, "n1", "000000", now); locked = a.change!.routing; }
  assert.equal(a.outcome, "locked");
  assert.equal(answerChallenge(locked, "n1", "123456", now).outcome, "closed", "the right code is useless after three misses");
  a = answerChallenge(r, "n1", "123456", now);
  assert.equal(a.outcome, "verified");
  r = a.change!.routing;
  assert.ok(r.numbers[0].verifiedAt && r.numbers[0].challenge === null);

  assert.equal(errorOf(assignDuty(r, "events", null, "swap", board)), "needs_number");
  assert.equal(errorOf(assignDuty(r, "events", "n2", "swap", board)), "not_verified", "a swap needs an already-verified number");
  assert.equal(errorOf(assignDuty(r, "events", "nope", "swap", board)), "unknown_number");
  assert.equal(errorOf(assignDuty(r, "events", "n1", "swap", new Set(["b"]))), "not_board_member");
  assert.equal(errorOf(assignDuty(r, "billing", "n1", "manage", board)), "unknown_option");
  const swap = assignDuty(r, "events", "n1", "swap", board);
  assert.ok(swap.ok && swap.audit.action === "PHONE_DUTY_SWAPPED" && swap.notice?.kind === "duty");
  r = ok(swap);
  assert.equal(errorOf(assignDuty(r, "events", "n1", "manage", board)), "no_change");
  assert.deepEqual(destinationFor(r, "events", board, now, HOEP), { ring: true, number: ONE });
  assert.deepEqual(destinationFor(r, "events", new Set(["b"]), now, HOEP), { ring: false, reason: "not_board" }, "leaving the board stops the calls at once");
  assert.deepEqual(destinationFor(r, "spanish", board, now, HOEP), { ring: false, reason: "unassigned" });
  r = ok(setHours(r, "events", { days: [1], start: "09:00", end: "10:00" }));
  assert.deepEqual(destinationFor(r, "events", board, now, HOEP), { ring: false, reason: "closed" });
  assert.equal(errorOf(setHours(r, "events", undefined)), "bad_hours", "a missing value never clears the hours");

  const removed = removeNumber(r, "n1");
  assert.ok(removed.ok);
  assert.equal(removed.routing.options.events.numberId, null);
  assert.deepEqual(removed.audit.changes.clearedOptions, ["events"]);
  for (const c of [swap, removed]) assert.ok(c.ok && !hasNumbers.test(JSON.stringify(c.audit)), "audit holds ids only");

  let full = emptyRouting();
  for (let i = 0; i < MAX_NUMBERS; i++) full = ok(addNumber(full, { id: `m${i}`, ownerId: "a", input: `+1915555${String(200 + i).padStart(4, "0")}`, now, boardIds: board, hoep: HOEP }));
  assert.equal(errorOf(addNumber(full, { id: "x", ownerId: "a", input: ONE, now, boardIds: board, hoep: HOEP })), "too_many");
});

test("the stored value is trusted for nothing", () => {
  assert.deepEqual(parseRouting(null), emptyRouting());
  const r = parseRouting({
    numbers: [{ id: "g", ownerId: "a", number: ONE, verifiedAt: "2026-01-01" }, { id: "bad", ownerId: "a", number: "911" }, { id: "x" }],
    options: { events: { numberId: "g", hours: { days: [9] } }, spanish: { numberId: "bad", hours: null }, officer: { numberId: "g", hours: null } },
  });
  assert.deepEqual(r.numbers.map((n) => n.id), ["g"]);
  assert.deepEqual([r.options.events.numberId, r.options.spanish.numberId, r.options.officer.numberId], [null, null, "g"], "unreadable hours never mean any time");
});

// ───────────────────────── the call flow ─────────────────────────
const tw = (o: Record<string, string> = {}) => new VoiceTwiml(reachFrom(o));

test("greeting: emergency line first, three choices, offered twice", () => {
  const first = greeting(tw(), 1).toString();
  assert.ok(first.indexOf("9 1 1") < first.indexOf("press 1"));
  for (const s of ["For events in English, press 1.", "Para español, oprima 2.", "To speak with an officer, press 3.", "Si es una emergencia médica"]) assert.ok(first.includes(s), s);
  assert.match(first, /<Gather input="dtmf" numDigits="1"[^>]*action="\/api\/twilio\/voice\/menu\?try=1"/);
  assert.match(first, /<Redirect method="POST">\/api\/twilio\/voice\?try=2<\/Redirect>/);
  const second = greeting(tw(), 2).toString();
  assert.ok(second.includes("<Hangup/>") && !second.includes("<Redirect"));
});

test("a choice rings the person on duty with screening; nobody on duty plays the message in that line's language", async () => {
  const live = { TWILIO_MODE: "allowlist", TWILIO_DEV_ALLOWLIST: ONE };
  const rung = (await menuChoice(tw(live), "1", 1, { numberFor: async () => ONE, callerId: HOEP })).toString();
  assert.match(rung, /<Dial answerOnBridge="true" callerId="\+19155550100"[^>]*action="\/api\/twilio\/voice\/dial-result\?o=events"/);
  assert.match(rung, /<Number url="\/api\/twilio\/voice\/screen\?o=events" method="POST">\+19155550141<\/Number>/);
  const none = (await menuChoice(tw(), "2", 1, { numberFor: async () => null, callerId: HOEP })).toString();
  assert.match(none, /<Response><Redirect method="POST">\/api\/twilio\/voice\/voicemail\?o=spanish<\/Redirect><\/Response>/, "nobody on duty: voicemail");
  const bad = (await menuChoice(tw(), "9", 1, { numberFor: async () => { throw new Error("not asked"); }, callerId: HOEP })).toString();
  assert.match(bad, /voice\?try=2/);
  assert.ok((await menuChoice(tw(), undefined, 2, { numberFor: async () => null, callerId: HOEP })).toString().includes("<Hangup/>"));
  assert.ok(!rung.includes("record"), "live calls are never recorded");
});

test("press-1 screening: only 1 connects; silence (a voicemail) hangs up that leg", () => {
  const s = screen(tw(), "officer").toString();
  assert.ok(s.includes("Press 1 to accept.") && s.includes("Oprima 1 para contestar."));
  assert.match(s, /<\/Gather><Hangup\/><\/Response>$/, "no key: the leg is hung up");
  assert.ok(!screenAnswer(tw(), "1", "events").toString().includes("<Hangup/>"));
  for (const d of ["2", "0", "#", "", undefined]) assert.match(screenAnswer(tw(), d, "events").toString(), /<Response><Hangup\/><\/Response>/, String(d));
  assert.match(dialResult(tw(), { DialBridged: "true" }, "events").toString(), /<Response><Hangup\/><\/Response>/);
  assert.match(dialResult(tw(), { DialBridged: "false" }, "officer").toString(), /voicemail\?o=officer/);
});

// Seen in a live test: a forwarded call answered WITHOUT pressing 1 showed status "completed" on the parent call.
test("answered but not accepted: 'completed' statuses never count as connected, only DialBridged does", () => {
  const notConnected: Record<string, string>[] = [
    { CallStatus: "completed", DialCallStatus: "completed", DialBridged: "false" },
    { CallStatus: "in-progress", DialCallStatus: "completed", DialBridged: "false" },
    { CallStatus: "completed", DialCallStatus: "answered", DialBridged: "false" },
    { CallStatus: "completed", DialCallStatus: "completed" }, // no DialBridged at all
    { CallStatus: "completed" },
    { CallStatus: "in-progress", DialCallStatus: "no-answer", DialBridged: "false" },
    { CallStatus: "in-progress", DialCallStatus: "busy", DialBridged: "false" },
  ];
  for (const params of notConnected) {
    assert.equal(dialConnected(params), false, JSON.stringify(params));
    assert.match(dialResult(tw(), params, "events").toString(), /<Redirect method="POST">\/api\/twilio\/voice\/voicemail\?o=events<\/Redirect>/, JSON.stringify(params));
  }
  for (const CallStatus of ["in-progress", "completed"]) assert.equal(dialConnected({ CallStatus, DialCallStatus: "completed", DialBridged: "true" }), true);
  const code = readFileSync("src/lib/phone/ivr.ts", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(!/params\.(Dial)?CallStatus/.test(code), "the flow reads no call status");
});

// ───────────────────────── stored changes, notices, webhooks ─────────────────────────
const admin = { id: "", name: "Admin Check" };
let owner1 = "", owner2 = "", n1 = "", n2 = "";

const sign = (url: string, params: Record<string, string>) => createHmac("sha1", TOKEN).update(url + Object.keys(params).sort().map((k) => k + params[k]).join("")).digest("base64");
async function hit(handler: (r: NextRequest) => Promise<Response>, path: string, params: Record<string, string> = {}) {
  const all = { AccountSid: SID, CallSid: `CA${randomUUID().replace(/-/g, "")}`, From: "+19155550177", ...params };
  const res = await handler(new NextRequest(`${BASE}${path}`, {
    method: "POST", body: new URLSearchParams(all).toString(),
    headers: { "content-type": "application/x-www-form-urlencoded", "x-twilio-signature": sign(`${BASE}${path}`, all) },
  }));
  assert.equal(res.status, 200, path);
  return res.text();
}
const noticeMails = () => emailOutbox().filter((m) => m.kind === "ADMIN_CHANGE_NOTICE");
const officers = ["president", "vicepresident", "secretary", "treasurer"].map((l) => `${l}@${emailDomain()}`).sort();
function expectOfficerNotice(includes: RegExp) {
  const mails = noticeMails();
  assert.deepEqual(mails.map((m) => m.to).sort(), officers, "all four officers");
  assert.match(mails[0].html, includes);
  assert.ok(!hasNumbers.test(mails[0].html + mails[0].subject), "numbers are masked in email");
}

test("admin adds a number; the officers are told; the view and the audit log never hold it in full", async () => {
  admin.id = await boardMember("acting", "SECRETARY");
  owner1 = await boardMember("Uno");
  owner2 = await boardMember("Dos", "VICE_PRESIDENT");
  clearEmailOutbox();
  assert.equal((await addDutyNumber(admin, owner1, "915-555-0141")).ok, true);
  expectOfficerNotice(/\(•••\) •••-0141/);
  assert.equal((await addDutyNumber(admin, owner2, TWO)).ok, true);
  assert.equal(errorOf(await addDutyNumber(admin, owner2, HOEP)), "hoep_number");
  const r = await readRouting();
  [n1, n2] = [r.numbers[0].id, r.numbers[1].id];
  const view = await phoneView(true);
  assert.ok(!hasNumbers.test(JSON.stringify(view)) && !/challenge|hash/.test(JSON.stringify(view)));
  assert.deepEqual(view.numbers.map((n) => [n.masked, n.verified]), [["(•••) •••-0141", false], ["(•••) •••-0142", false]]);
  assert.equal((await phoneView(false)).people.length, 0);
});

test("verification end to end: a captured call, the code typed on the phone, signed webhooks", async () => {
  clearTwilioOutbox(); clearEmailOutbox();
  const started = await startVerification(admin, n1);
  assert.ok(started.ok && started.captured, JSON.stringify(started));
  assert.match(started.code, /^\d{6}$/);
  assert.deepEqual(twilioOutbox().map((m) => [m.kind, m.to, m.path]), [["call", ONE, `/api/twilio/voice/verify?n=${n1}`]]);

  assert.match(await hit(verifyRoute, `/api/twilio/voice/verify?n=${n1}`), new RegExp(`<Gather[^>]*numDigits="6"[^>]*verify/confirm\\?n=${n1}`));
  const wrong = started.code === "000000" ? "111111" : "000000";
  assert.match(await hit(confirmRoute, `/api/twilio/voice/verify/confirm?n=${n1}`, { Digits: wrong }), /not correct[\s\S]*<Redirect/);
  assert.equal((await readRouting()).numbers[0].verifiedAt, null);
  assert.match(await hit(confirmRoute, `/api/twilio/voice/verify/confirm?n=${n1}`, { Digits: started.code }), /This number is confirmed/);
  assert.ok((await readRouting()).numbers[0].verifiedAt);
  expectOfficerNotice(/verified by phone/);
  // the code works once
  assert.match(await hit(confirmRoute, `/api/twilio/voice/verify/confirm?n=${n1}`, { Digits: started.code }), /was not confirmed/);
  assert.match(await hit(verifyRoute, "/api/twilio/voice/verify?n=unknown"), /was not confirmed/);

  const second = await startVerification(admin, n2);
  assert.ok(second.ok);
  await hit(confirmRoute, `/api/twilio/voice/verify/confirm?n=${n2}`, { Digits: second.code });
  assert.ok((await readRouting()).numbers[1].verifiedAt);
});

test("verification calls are limited per number", async () => {
  let last = await startVerification(admin, n2);
  for (let i = 0; i < VERIFY_CALL_LIMIT.max; i++) last = await startVerification(admin, n2);
  assert.equal(errorOf(last), "rate_limited");
  assert.ok((await readRouting()).numbers[1].verifiedAt, "asking again never un-verifies");
});

test("every duty swap is audited and emails all four officers", async () => {
  clearEmailOutbox();
  assert.equal((await changeDuty(admin, "officer", n1, "manage")).ok, true);
  expectOfficerNotice(/from nobody to Uno/);
  clearEmailOutbox();
  const officer = { id: owner2, name: `Dos ${tag}` };
  assert.equal((await changeDuty(officer, "officer", n2, "swap")).ok, true);
  expectOfficerNotice(/changed who answers[\s\S]*0141[\s\S]*0142/);
  assert.match(noticeMails()[0].html, /cambió quién atiende/);
  const row = await prisma.auditLog.findFirstOrThrow({ where: { action: "PHONE_DUTY_SWAPPED", patientId: owner2 } });
  assert.deepEqual(row.changes, { option: "officer", fromNumberId: n1, fromOwnerId: owner1, toNumberId: n2, toOwnerId: owner2 });
  assert.equal(row.actorType, "board");
  assert.equal(errorOf(await changeDuty(officer, "officer", null, "swap")), "needs_number");
  assert.equal((await changeHours(admin, "events", { days: [1, 2], start: "09:00", end: "17:00" })).ok, true);
  assert.equal((await changeHours(admin, "events", null)).ok, true);
});

test("an incoming call, end to end: capture rings nobody; the allowlist rings only a listed duty number", async () => {
  await changeDuty(admin, "events", n1, "manage");
  assert.match(await hit(voice, "/api/twilio/voice"), /menu\?try=1/);
  clearTwilioOutbox();
  const captured = await hit(menu, "/api/twilio/voice/menu?try=1", { Digits: "1" });
  assert.ok(!captured.includes("<Dial") && !hasNumbers.test(captured));
  assert.deepEqual(twilioOutbox().map((m) => [m.kind, m.to]), [["dial", ONE]], "the right number would have rung");
  assert.match(await hit(screenRoute, "/api/twilio/voice/screen?o=events"), /Press 1 to accept/);
  assert.ok(!(await hit(acceptRoute, "/api/twilio/voice/screen/accept?o=events", { Digits: "1" })).includes("<Hangup/>"));
  assert.match(await hit(dialResultRoute, "/api/twilio/voice/dial-result?o=events", { CallStatus: "completed", DialCallStatus: "completed", DialBridged: "false" }), /voicemail\?o=events/, "screened out is not connected");
  assert.match(await hit(dialResultRoute, "/api/twilio/voice/dial-result?o=events", { CallStatus: "in-progress", DialCallStatus: "completed", DialBridged: "true" }), /<Response><Hangup\/><\/Response>/);
  assert.match(await hit(menu, "/api/twilio/voice/menu?try=1", { Digits: "2" }), /voicemail\?o=spanish/, "nobody on the Spanish line");
});

test("if the routing can't be read, only the fallback number rings", async () => {
  const broken = async (): Promise<never> => { throw new Error("database down"); };
  process.env.TWILIO_FALLBACK_NUMBER = FALLBACK;
  assert.equal(await numberToRing("events", new Date(), broken), FALLBACK);
  delete process.env.TWILIO_FALLBACK_NUMBER;
  assert.equal(await numberToRing("events", new Date(), broken), null);
  process.env.TWILIO_FALLBACK_NUMBER = FALLBACK;
  assert.equal(await numberToRing("spanish"), null, "an unassigned option does not use the fallback");
  delete process.env.TWILIO_FALLBACK_NUMBER;
});

test("leaving the board, a merge, and removal", async () => {
  await prisma.boardRole.updateMany({ where: { patientId: owner1 }, data: { active: false } });
  assert.equal(await numberToRing("events"), null);
  assert.ok(!(await boardPeople()).some((p) => p.id === owner1));
  assert.equal(errorOf(await changeDuty(admin, "spanish", n1, "manage")), "not_board_member");
  await prisma.boardRole.updateMany({ where: { patientId: owner1 }, data: { active: true } });

  const keep = await boardMember("keeper");
  const merged = await mergePeople(keep, owner1, admin.id, keep);
  assert.ok(merged.ok, JSON.stringify(merged));
  assert.equal((await readRouting()).numbers.find((n) => n.id === n1)!.ownerId, keep, "the duty number follows the kept record");
  assert.equal(await numberToRing("events"), ONE);

  clearEmailOutbox();
  assert.equal((await removeDutyNumber(admin, n1)).ok, true);
  expectOfficerNotice(/removed the duty number[\s\S]*Now unassigned/);
  assert.equal(await numberToRing("events"), null);
});

// ───────────────────────── the switch ─────────────────────────
test("the switch: only an ON row under a policy that covers it counts; unreadable or slow means off", async () => {
  const row = (enabled: boolean) => async () => [{ key: "phone_system", enabled, enabledAt: new Date() }];
  assert.equal(await phoneSystemOn(row(true)), true);
  assert.equal(await phoneSystemOn(row(false)), false);
  assert.equal(await phoneSystemOn(async () => []), false, "never switched on");
  assert.equal(await phoneSystemOn(async () => { throw new Error("database down"); }), false);
  assert.equal(await phoneSystemOn(() => new Promise(() => {}), 20), false, "a stuck read");
});

test("off: the fallback number rings with screening; with none, or unanswered, the caller hears the notice", () => {
  const forward = switchedOff(tw({ TWILIO_MODE: "allowlist", TWILIO_DEV_ALLOWLIST: FALLBACK }), { to: FALLBACK, callerId: HOEP }).toString();
  assert.match(forward, /<Dial [^>]*action="\/api\/twilio\/voice\/dial-result\?o=officer"[^>]*><Number url="\/api\/twilio\/voice\/screen\?o=officer"[^>]*>\+19155550149<\/Number>/);
  assert.ok(forward.indexOf("9 1 1") < forward.indexOf("<Dial") && !forward.includes("<Gather") && !forward.includes("<Record"));
  const silent = switchedOff(tw(), { to: null, callerId: HOEP }).toString();
  for (const s of ["cannot take your call", "no podemos atender", "visit hemoelpaso dot org", "info at hemoelpaso dot org", "<Hangup/>"]) assert.ok(silent.includes(s), s);
});

test("off, end to end: every route a caller can reach answers without the menu or voicemail", async () => {
  process.env.TWILIO_FALLBACK_NUMBER = FALLBACK;
  await setPhoneSystem(false);
  try {
    for (const [handler, path, params] of [[voice, "/api/twilio/voice", {}], [menu, "/api/twilio/voice/menu?try=1", { Digits: "1" }]] as const) {
      clearTwilioOutbox();
      const xml = await hit(handler, path, params as Record<string, string>);
      assert.ok(!xml.includes("<Gather") && !xml.includes("<Record") && !xml.includes("voicemail"), xml);
      assert.deepEqual(twilioOutbox().map((m) => [m.kind, m.to]), [["dial", FALLBACK]], path);
    }
    assert.match(await hit(dialResultRoute, "/api/twilio/voice/dial-result?o=officer", { DialBridged: "false", DialCallStatus: "completed" }), /cannot take your call[\s\S]*no podemos atender[\s\S]*<Hangup\/>/);
    assert.match(await hit(dialResultRoute, "/api/twilio/voice/dial-result?o=officer", { DialBridged: "true" }), /<Response><Hangup\/><\/Response>/);
    const CallSid = `CA${randomUUID().replace(/-/g, "")}`;
    assert.match(await hit(voicemailRoute, "/api/twilio/voice/voicemail?o=events", { CallSid }), /cannot take your call/);
    assert.equal(await prisma.phoneVoicemail.findUnique({ where: { callSid: CallSid } }), null, "nothing is recorded or stored");

    delete process.env.TWILIO_FALLBACK_NUMBER;
    clearTwilioOutbox();
    assert.match(await hit(voice, "/api/twilio/voice"), /cannot take your call/);
    assert.equal(twilioOutbox().length, 0);
  } finally {
    delete process.env.TWILIO_FALLBACK_NUMBER;
    await setPhoneSystem(true);
  }
  assert.match(await hit(voice, "/api/twilio/voice"), /menu\?try=1/, "and back on");
});

test("no audit row about the phone holds a number", async () => {
  const rows = await prisma.auditLog.findMany({ where: { resourceType: "PhoneRouting", createdAt: { gte: startedAt } } });
  assert.ok(rows.length >= 10);
  for (const r of rows) assert.ok(!hasNumbers.test(JSON.stringify(r)) && !/\d{10}/.test(JSON.stringify(r.changes)), r.action);
  assert.deepEqual(Array.from(new Set(rows.map((r) => r.action))).sort(), [
    "PHONE_DUTY_SWAPPED", "PHONE_NUMBER_ADDED", "PHONE_NUMBER_REMOVED", "PHONE_NUMBER_VERIFIED", "PHONE_ROUTING_CHANGED", "PHONE_VERIFY_CALL", "PHONE_VERIFY_FAILED",
  ]);
});
