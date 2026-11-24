/** Run: npm run check:email-routing (pure, no DB, sends nothing). */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BoardRoleType } from "@prisma/client";
import { ROLE_PERMISSIONS, hasPermission } from "../src/lib/permissions";
import { DEFAULT_MATRIX } from "../src/lib/permission-catalog";
import {
  ROUTE_KEYS, defaultRecipients, officerAddresses, resolveRecipients, routeForContactReason, validateRecipients,
} from "../src/lib/email-routing/definitions";
import { changeRoute, testRateLimited, testRecipients, type ChangeRecord } from "../src/lib/email-routing/change";

const D = "hemoelpaso.org";
const actor = { id: "p1", name: "Ana Perez" };

// ── Permission ───────────────────────────────────────────────────────────────
test("only the settings-only admin holds canManageEmailRouting", () => {
  for (const r of Object.keys(ROLE_PERMISSIONS) as BoardRoleType[]) {
    assert.equal(hasPermission([r], "canManageEmailRouting"), false, r);
  }
  assert.equal(hasPermission([], "canManageEmailRouting"), false);
  assert.ok(DEFAULT_MATRIX.ADMIN.includes("canManageEmailRouting"));
});

test("every email-routing API route is gated by requirePermission(canManageEmailRouting) before doing anything", () => {
  for (const f of ["route.ts", "test/route.ts"]) {
    const src = readFileSync(`src/app/api/admin/settings/email-routing/${f}`, "utf8");
    const guard = src.indexOf('requirePermission("canManageEmailRouting")');
    assert.ok(guard > 0, f);
    for (const handler of Array.from(src.matchAll(/export async function (GET|PUT|POST)\(/g))) {
      const afterHandler = src.slice(handler.index!);
      assert.ok(afterHandler.indexOf('requirePermission("canManageEmailRouting")') < 200, `${f} ${handler[1]} checks permission first`);
    }
  }
});

// ── Validation ───────────────────────────────────────────────────────────────
test("external and look-alike domains are rejected", () => {
  for (const bad of ["someone@gmail.com", "x@hemoelpaso.org.evil.com", "x@mail.hemoelpaso.org", "x@hemo-el-paso.org", "x@HEMOELPASO.ORG.ru"]) {
    const v = validateRecipients("contact.family", [bad], D);
    assert.equal(v.ok, false, bad);
    if (!v.ok) assert.equal(v.error, "external_domain", bad);
  }
});
test("mixed list with one external address is rejected as a whole", () => {
  assert.equal(validateRecipients("contact.sponsor", ["treasurer@hemoelpaso.org", "me@yahoo.com"], D).ok, false);
});
test("role addresses and typed addresses on the domain are accepted, normalized and de-duplicated", () => {
  const v = validateRecipients("contact.volunteer", [" Secretary@HemoElPaso.org ", "secretary@hemoelpaso.org", "volunteers@hemoelpaso.org"], D);
  assert.deepEqual(v.ok && v.value, ["secretary@hemoelpaso.org", "volunteers@hemoelpaso.org"]);
});
test("at least one recipient is required", () => {
  for (const k of ROUTE_KEYS) for (const bad of [[], ["", "  "], null, "a@b.c", [1]]) assert.equal(validateRecipients(k, bad, D).ok, false, `${k} ${JSON.stringify(bad)}`);
});
test("reply and privacy routes are a dropdown: one address from the list, nothing typed", () => {
  assert.equal(validateRecipients("reply.events", ["events@hemoelpaso.org"], D).ok, true);
  assert.equal(validateRecipients("reply.events", ["sam@hemoelpaso.org"], D).ok, false); // on domain but not in the list
  assert.equal(validateRecipients("reply.info", ["info@hemoelpaso.org", "events@hemoelpaso.org"], D).ok, false); // exactly one
  assert.equal(validateRecipients("reply.info", ["admin@hemoelpaso.org"], D).ok, false);
  assert.equal(validateRecipients("privacy", ["president@hemoelpaso.org"], D).ok, true);
  assert.equal(validateRecipients("privacy", ["x@gmail.com"], D).ok, false);
});
test("the allowed domain follows emailDomain(), not a hard-coded value", () => {
  assert.equal(validateRecipients("contact.general", ["info@hemo-el-paso.org"], "hemo-el-paso.org").ok, true);
  assert.equal(validateRecipients("contact.general", ["info@hemoelpaso.org"], "hemo-el-paso.org").ok, false);
});

// ── Defaults and fallback ────────────────────────────────────────────────────
test("defaults are role addresses on the mail domain", () => {
  const want: Record<string, string | string[]> = {
    "contact.general": "info", "contact.family": "secretary", "contact.volunteer": "secretary", "contact.sponsor": "treasurer",
    "contact.media": "president", "contact.other": "info", privacy: "privacy", "privacy.requests": "privacy", "reply.info": "info", "reply.events": "events",
    "board.duplicates": ["president", "vicepresident"],
  };
  for (const k of ROUTE_KEYS) assert.deepEqual(defaultRecipients(k, D), [want[k]].flat().map((l) => `${l}@${D}`), k);
  assert.deepEqual(defaultRecipients("contact.media", "example.org"), ["president@example.org"]);
});
test("empty table / missing row / unreadable row all fall back to the defaults", () => {
  for (const k of ROUTE_KEYS) {
    assert.deepEqual(resolveRecipients(k, null, D), defaultRecipients(k, D));
    assert.deepEqual(resolveRecipients(k, undefined, D), defaultRecipients(k, D));
    assert.deepEqual(resolveRecipients(k, [], D), defaultRecipients(k, D));
  }
});
test("a stored row that is outside the domain (tampered, or the domain moved) is ignored, mail never leaves the domain", () => {
  assert.deepEqual(resolveRecipients("contact.family", ["leak@gmail.com"], D), [`secretary@${D}`]);
  assert.deepEqual(resolveRecipients("contact.family", ["president@hemoelpaso.org"], D), [`president@${D}`]);
});
test("contact reasons map to routes; unknown reasons use contact.other", () => {
  for (const r of ["general", "family", "volunteer", "sponsor", "media", "other"]) assert.equal(routeForContactReason(r), `contact.${r}`);
  for (const r of ["", "privacy", "reply.info", "../x", "constructor"]) assert.equal(routeForContactReason(r), "contact.other", r);
});

// ── Change: audit + officer notice + cache ───────────────────────────────────
function harness(stored: Record<string, string[]> = {}, opts: { noticeThrows?: boolean } = {}) {
  const log: { persisted: ChangeRecord[]; notices: { to: string[]; rec: ChangeRecord }[]; invalidated: number } = { persisted: [], notices: [], invalidated: 0 };
  const deps = {
    domain: D,
    readStored: async (k: string) => stored[k] ?? null,
    persist: async (rec: ChangeRecord) => { log.persisted.push(rec); stored[rec.route] = rec.newValue; },
    invalidate: () => { log.invalidated++; },
    notifyOfficers: async (to: string[], rec: ChangeRecord) => { if (opts.noticeThrows) throw new Error("resend down"); log.notices.push({ to, rec }); return true; },
  };
  return { deps, log, stored };
}

test("a change is persisted with route, old value, new value and who; cache is invalidated; all four officers are emailed", async () => {
  const { deps, log } = harness();
  const r = await changeRoute(deps, "contact.sponsor", ["president@hemoelpaso.org", "treasurer@hemoelpaso.org"], actor);
  assert.deepEqual(r, { ok: true, changed: true, value: ["president@hemoelpaso.org", "treasurer@hemoelpaso.org"], noticeSent: true });
  assert.equal(log.persisted.length, 1);
  const rec = log.persisted[0];
  assert.equal(rec.route, "contact.sponsor");
  assert.deepEqual(rec.oldValue, [`treasurer@${D}`]); // the default, since the table was empty
  assert.deepEqual(rec.newValue, ["president@hemoelpaso.org", "treasurer@hemoelpaso.org"]);
  assert.deepEqual(rec.actor, actor);
  assert.match(rec.details, /Ana Perez/);
  assert.equal(log.invalidated, 1);
  assert.equal(log.notices.length, 1);
  assert.deepEqual(log.notices[0].to, officerAddresses(D));
  assert.deepEqual(log.notices[0].to, ["president", "vicepresident", "secretary", "treasurer"].map((l) => `${l}@${D}`));
});
test("a rejected change writes nothing, notifies nobody, does not touch the cache", async () => {
  const { deps, log } = harness();
  const r = await changeRoute(deps, "contact.family", ["me@gmail.com"], actor);
  assert.equal(r.ok, false);
  assert.deepEqual([log.persisted.length, log.notices.length, log.invalidated], [0, 0, 0]);
});
test("saving the current value is a no-op (no audit entry, no notice)", async () => {
  const { deps, log } = harness({ "contact.family": [`secretary@${D}`] });
  const r = await changeRoute(deps, "contact.family", [`secretary@${D}`], actor);
  assert.deepEqual(r, { ok: true, changed: false, value: [`secretary@${D}`] });
  assert.deepEqual([log.persisted.length, log.notices.length], [0, 0]);
});
test("if the officer notice fails the change still stands, and the result says the notice was not sent", async () => {
  const { deps, log } = harness({}, { noticeThrows: true });
  const r = await changeRoute(deps, "reply.info", [`president@${D}`], actor);
  assert.equal(r.ok && r.changed && r.noticeSent, false);
  assert.equal(log.persisted.length, 1);
});
test("changing the privacy contact is flagged in the audit details and the notice", async () => {
  const { deps, log } = harness();
  await changeRoute(deps, "privacy", [`president@${D}`], actor);
  assert.match(log.persisted[0].details, /^PRIVACY POLICY CONTACT CHANGED/);
  const { noticeText } = await import("../src/lib/email-routing/change");
  assert.match(noticeText(log.persisted[0]).policyEn, /Privacy Policy/);
  assert.match(noticeText(log.persisted[0]).lineEn, /Email routing for privacy .* changed from privacy@hemoelpaso\.org to president@hemoelpaso\.org by Ana Perez\./);
});

// ── Test send ────────────────────────────────────────────────────────────────
test("a test goes only to the route's configured recipients (stored, else default)", async () => {
  const { deps } = harness({ "contact.media": [`secretary@${D}`, `info@${D}`] });
  assert.deepEqual(await testRecipients(deps, "contact.media"), [`secretary@${D}`, `info@${D}`]);
  assert.deepEqual(await testRecipients(deps, "contact.sponsor"), [`treasurer@${D}`]);
});
test("test sends are limited to 5 per user per minute", () => {
  assert.deepEqual([0, 4, 5, 6].map(testRateLimited), [false, false, true, true]);
});
