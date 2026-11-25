/**
 * No email reaches Resend unless we're in production or opted in. Run: npm run check:email-guard (db-guard refuses production)
 *  - EMAIL_MODE resolution: live only by default in production; capture everywhere else; live outside production THROWS
 *  - capture: Resend is never called, the email is in the outbox, EmailLog says "captured"
 *  - allowlist: only listed addresses are sent, everything else captured
 *  - production default is live (resolution only: nothing is sent)
 *  - nothing constructs a Resend client except the sender module
 *  - the rest of the code reaches Resend only through deliverEmail
 */
import "./_load-env";
import "./_react-global";
import assert from "node:assert/strict";
import { test, after } from "node:test";
import { readFileSync, readdirSync, statSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/db";
import { resolveEmailMode, parseAllowlist, isAllowlisted, splitByAllowlist } from "../src/lib/email/mode";
import { clearEmailOutbox, deliverEmail, emailOutbox, sendLoggedEmail } from "../src/lib/email/send";

const realFetch = globalThis.fetch;
const resendCalls: { to: unknown; subject: string }[] = [];
globalThis.fetch = (async (url: unknown, init?: { body?: string }) => {
  if (String(url).includes("resend")) {
    const b = JSON.parse(init?.body ?? "{}");
    resendCalls.push({ to: b.to, subject: b.subject });
    return new Response(JSON.stringify({ id: "re_1" }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  return realFetch(url as never, init as never);
}) as typeof fetch;

const tag = `eg${Date.now()}`;
const env0 = { ...process.env };
after(async () => {
  globalThis.fetch = realFetch;
  Object.assign(process.env, env0);
  await prisma.emailLog.deleteMany({ where: { patientId: null, templateType: "RSVP_ACCESS_LINK", recipient: "", subject: "" } }).catch(() => {});
  await prisma.$disconnect();
});

test("the mode: live by default only in production; capture everywhere else; the hard guard throws", () => {
  assert.equal(resolveEmailMode({ VERCEL_ENV: "production" }), "live");
  for (const v of [undefined, "", "preview", "development"]) assert.equal(resolveEmailMode({ VERCEL_ENV: v }), "capture", `VERCEL_ENV=${v}`);
  assert.equal(resolveEmailMode({}), "capture");
  assert.equal(resolveEmailMode({ EMAIL_MODE: " Capture ", VERCEL_ENV: "production" }), "capture", "production can choose capture");
  assert.equal(resolveEmailMode({ EMAIL_MODE: "allowlist" }), "allowlist");
  assert.equal(resolveEmailMode({ EMAIL_MODE: "live", VERCEL_ENV: "production" }), "live");
  for (const v of [undefined, "preview", "development", ""]) assert.throws(() => resolveEmailMode({ EMAIL_MODE: "live", VERCEL_ENV: v }), /only allowed when VERCEL_ENV=production/, `live with VERCEL_ENV=${v}`);
  assert.throws(() => resolveEmailMode({ EMAIL_MODE: "yes" }), /must be/);
  assert.throws(() => resolveEmailMode({ EMAIL_MODE: "true", VERCEL_ENV: "production" }), /must be/);
});

test("allowlist matching: exact addresses and @domain, case-insensitive; names in brackets handled", () => {
  const list = parseAllowlist(" Me@Example.org, @team.org ,");
  assert.deepEqual(list, ["me@example.org", "@team.org"]);
  assert.equal(isAllowlisted("ME@example.org", list), true);
  assert.equal(isAllowlisted("x@team.org", list), true);
  assert.equal(isAllowlisted("x@evilteam.org", list), false);
  assert.equal(isAllowlisted("other@example.org", list), false);
  assert.equal(isAllowlisted("Me <me@example.org>", list), true);
  assert.deepEqual(splitByAllowlist(["me@example.org", "a@b.co"], list), { send: ["me@example.org"], capture: ["a@b.co"] });
  assert.deepEqual(splitByAllowlist("a@b.co", []), { send: [], capture: ["a@b.co"] });
});

test("capture (the default outside production): Resend is never called, the email is in the outbox, EmailLog says captured", async () => {
  process.env.RESEND_API_KEY = "re_real_looking_key"; // even with a key, capture must not send
  delete process.env.EMAIL_MODE;
  process.env.EMAIL_MODE = "capture";
  clearEmailOutbox(); resendCalls.length = 0;
  const to = `${tag}@example.org`;
  const r = await sendLoggedEmail({ kind: "RSVP_ACCESS_LINK", sender: "events", to, subject: "Hello", html: "<p>hi</p>" });
  assert.deepEqual([r.ok, r.ok && r.captured], [true, true]);
  assert.equal(resendCalls.length, 0, "Resend was not called");
  const box = emailOutbox();
  assert.equal(box.length, 1);
  assert.deepEqual([box[0].to, box[0].kind, box[0].subject, box[0].reason], [to, "RSVP_ACCESS_LINK", "Hello", "capture"]);
  assert.ok(box[0].html.includes("<p>hi</p>"));
  const log = await prisma.emailLog.findFirst({ where: { templateType: "RSVP_ACCESS_LINK", status: "captured" }, orderBy: { sentAt: "desc" } });
  assert.ok(log, "an EmailLog row with status captured");
  assert.equal(log!.recipient, "", "the log still holds no address");
  await prisma.emailLog.deleteMany({ where: { id: log!.id } });
  // no key at all: capture still works (nothing needs Resend)
  delete process.env.RESEND_API_KEY;
  assert.equal((await sendLoggedEmail({ kind: "RSVP_ACCESS_LINK", to, subject: "x", html: "x" })).ok, true);
  assert.equal(resendCalls.length, 0);
  await prisma.emailLog.deleteMany({ where: { templateType: "RSVP_ACCESS_LINK", status: "captured", recipient: "" } });
});

test("local dev writes the rendered HTML to .email-outbox/ when file output is on (and never when it is off)", async () => {
  process.env.EMAIL_MODE = "capture";
  const dir = join(process.cwd(), ".email-outbox");
  const before = existsSync(dir) ? readdirSync(dir).length : 0;
  process.env.EMAIL_OUTBOX_FILES = "0";
  await deliverEmail({ kind: "FILE_TEST", from: "a@b.co", to: "x@y.co", subject: "s", html: "<b>nofile</b>" });
  assert.equal(existsSync(dir) ? readdirSync(dir).length : 0, before, "off: no file");
  delete process.env.EMAIL_OUTBOX_FILES;
  const vercel = process.env.VERCEL, nodeEnv = process.env.NODE_ENV;
  delete process.env.VERCEL;
  await deliverEmail({ kind: "FILE_TEST", from: "a@b.co", to: "x@y.co", subject: "s", html: "<b>file</b>" });
  const files = readdirSync(dir).filter((f) => f.includes("FILE_TEST"));
  assert.ok(files.length >= 1 && /^\d{4}-\d\d-\d\dT.*-FILE_TEST-/.test(files[0]), "timestamp-kind.html");
  assert.ok(readFileSync(join(dir, files[0]), "utf8").includes("<b>file</b>"));
  for (const f of files) rmSync(join(dir, f));
  if (vercel) process.env.VERCEL = vercel;
  void nodeEnv;
  process.env.EMAIL_OUTBOX_FILES = "0";
  assert.match(readFileSync(".gitignore", "utf8"), /^\.email-outbox\/?$/m, ".email-outbox is gitignored");
});

test("allowlist: only listed addresses reach Resend; the rest are captured", async () => {
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.EMAIL_MODE = "allowlist";
  process.env.EMAIL_DEV_ALLOWLIST = "me@example.org";
  clearEmailOutbox(); resendCalls.length = 0;
  const a = await deliverEmail({ kind: "K", from: "HOEP <i@x.org>", to: "me@example.org", subject: "mine", html: "h" });
  assert.deepEqual([a.ok, a.ok && a.captured], [true, false]);
  assert.equal(resendCalls.length, 1);
  assert.equal(emailOutbox().length, 0);
  const b = await deliverEmail({ kind: "K", from: "HOEP <i@x.org>", to: "family@example.org", subject: "theirs", html: "h" });
  assert.deepEqual([b.ok, b.ok && b.captured], [true, true]);
  assert.equal(resendCalls.length, 1, "no second Resend call");
  assert.deepEqual(emailOutbox().map((m) => [m.to, m.reason]), [["family@example.org", "not_allowlisted"]]);
  // a mixed recipient list: the allowlisted one is sent, the other captured
  await deliverEmail({ kind: "K", from: "HOEP <i@x.org>", to: ["me@example.org", "family@example.org"], subject: "both", html: "h" });
  assert.equal(resendCalls.length, 2);
  assert.deepEqual(resendCalls[1].to, ["me@example.org"]);
  assert.equal(emailOutbox().length, 2);
  // an empty allowlist captures everything
  process.env.EMAIL_DEV_ALLOWLIST = "";
  await deliverEmail({ kind: "K", from: "HOEP <i@x.org>", to: "me@example.org", subject: "none", html: "h" });
  assert.equal(resendCalls.length, 2);
  process.env.EMAIL_MODE = "capture";
  delete process.env.EMAIL_DEV_ALLOWLIST;
});

test("a bad EMAIL_MODE stops a send (and the app at start): live outside production throws", async () => {
  process.env.EMAIL_MODE = "live";
  delete process.env.VERCEL_ENV;
  await assert.rejects(() => deliverEmail({ kind: "K", from: "a@b.co", to: "x@y.co", subject: "s", html: "h" }), /only allowed when VERCEL_ENV=production/);
  process.env.EMAIL_MODE = "capture";
  const instr = readFileSync("src/instrumentation.ts", "utf8");
  assert.ok(instr.includes("resolveEmailMode") && readFileSync("next.config.mjs", "utf8").includes("instrumentationHook: true"), "resolved at server start");
});

test("nothing constructs a Resend client except the sender module, and nothing else imports the SDK", () => {
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return f === "node_modules" || f === ".next" ? [] : statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx|mjs|js)$/.test(f) ? [p] : []; });
  const files = [...walk("src"), ...walk("scripts"), "next.config.mjs"].filter((f) => f !== "src/lib/email/send.ts" && !f.endsWith("check-email-guard.ts"));
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    assert.ok(!/new\s+Resend\s*\(/.test(src), `${f}: new Resend( belongs in src/lib/email/send.ts only (use deliverEmail)`);
    assert.ok(!/from\s+["']resend["']|import\(\s*["']resend["']\s*\)|require\(\s*["']resend["']\s*\)/.test(src), `${f}: only src/lib/email/send.ts may import the Resend SDK`);
  }
  const sender = readFileSync("src/lib/email/send.ts", "utf8");
  assert.equal((sender.match(/new\s+Resend\s*\(/g) ?? []).length, 1, "exactly one client constructor");
  assert.equal(existsSync("src/lib/resend.ts"), false, "the unused second client module is gone");
  assert.ok(!existsSync("src/lib/email-service.ts") || readFileSync("src/lib/email-service.ts", "utf8").includes("deliverEmail"));
});

test("every check script that can send is forced to capture", () => {
  assert.match(readFileSync("scripts/_load-env.ts", "utf8"), /EMAIL_MODE = "capture"/);
  for (const f of ["check-household.ts", "check-rsvp-attendees.ts"]) assert.match(readFileSync(`scripts/${f}`, "utf8"), /EMAIL_MODE = "capture"/, f);
  assert.equal(process.env.EMAIL_MODE === "capture" || process.env.EMAIL_MODE === undefined, true);
});
