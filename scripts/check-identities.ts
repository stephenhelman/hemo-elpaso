/**
 * Linked sign-in identities, session modes, household scoping and merge.
 * Run: npm run check:identities   (db-guard refuses production; DEV database, throw-away rows are deleted after)
 *
 *  - pure rules: org identity, board/family mode, officer transition on/off, auto-link decisions, merge survivor
 *  - auto-link with zero, one and several matching households (the "several" case sends no real email)
 *  - a family session is refused at /admin for a person who holds a board role; a board session needs an org Google identity
 *  - admin (settings-only) cannot reach link or merge, and cannot touch a record that has a household
 *  - PATIENT_ONLY replacement: existing families still appear in search, invitations, attendees and retention;
 *    board-only and admin records never do; a board record merged into a household does
 *  - merge moves identities and board roles, writes ids only; two households need an explicit survivor
 */
import "./_load-env";
import assert from "node:assert/strict";
import type { BoardRoleType } from "@prisma/client";
import { test, after } from "node:test";
import { prisma } from "../src/lib/db";
import { DEFAULT_MATRIX } from "../src/lib/permission-catalog";
import { resolvePermissions } from "../src/lib/permissions";
import {
  BOARD_PROVIDER, adminMayTouch, canRequireOrg, chooseSurvivor, decideLink, isOrgEmail, isOrgIdentity, providerOf, resolveMode, type SessionFacts,
} from "../src/lib/identity/rules";
import { resolveForUser } from "../src/lib/identity/session";
import { REQUIRE_ORG_KEY } from "../src/lib/identity/settings";
import { PURGE_UNMATCHED_DAYS, purgeUnmatchedIdentities, setBoardOrgEmail, unlinkBoardOrgIdentity, unlinkIdentity, linkIdentity, validateOrgEmail } from "../src/lib/identity/admin";
import { mergePeople } from "../src/lib/identity/merge";
import { BOARD_ONLY, HOUSEHOLD_EVIDENCE, PATIENT_ONLY, listPatients } from "../src/lib/patients/query";
import { listInactiveHouseholds } from "../src/lib/retention";
import { matchPatientsForEvent } from "../src/lib/invitations/match";
import { SESSION_CONFIG, SESSION_ABSOLUTE_DAYS, SESSION_IDLE_HOURS } from "../src/lib/auth0-config";
import { readFileSync } from "node:fs";

delete process.env.RESEND_API_KEY; // the ambiguous-sign-in notice must never send a real email from a test

const D = "hemoelpaso.org";
const DAY = 864e5;
const startedAt = new Date();
const tag = `idt${Date.now()}`;
const patients: string[] = [];
const events: string[] = [];
const subs: string[] = [];
const em = (n: string) => `${tag}.${n}@example.org`;

let savedSetting: { value: unknown } | null = null;
let settingTouched = false;
async function setRequireOrg(v: boolean) {
  if (!settingTouched) { savedSetting = await prisma.appSetting.findUnique({ where: { key: REQUIRE_ORG_KEY }, select: { value: true } }); settingTouched = true; }
  await prisma.appSetting.upsert({ where: { key: REQUIRE_ORG_KEY }, create: { key: REQUIRE_ORG_KEY, value: { enabled: v } }, update: { value: { enabled: v } } });
}

after(async () => {
  if (settingTouched) {
    if (savedSetting) await prisma.appSetting.update({ where: { key: REQUIRE_ORG_KEY }, data: { value: savedSetting.value as object } });
    else await prisma.appSetting.deleteMany({ where: { key: REQUIRE_ORG_KEY } });
  }
  await prisma.userIdentity.deleteMany({ where: { auth0Sub: { in: subs } } });
  await prisma.auditLog.deleteMany({ where: { patientId: { in: patients } } });
  // system rows written by auto-link during this run (they have no patientId), and the failed no-key notice emails
  await prisma.auditLog.deleteMany({ where: { createdAt: { gte: startedAt }, actorType: "system", resourceType: { in: ["UserIdentity", "DuplicateNotice"] } } });
  await prisma.emailLog.deleteMany({ where: { sentAt: { gte: startedAt }, templateType: "DUPLICATE_SIGNIN_NOTICE" } });
  await prisma.event.deleteMany({ where: { id: { in: events } } });
  await prisma.patient.deleteMany({ where: { id: { in: patients } } });
  await prisma.$disconnect();
});

/** A household as registration makes it: role patient, consents recorded, no sign-in. */
async function family(name: string, o: { role?: string; email?: string | null; ago?: number; consent?: boolean; board?: BoardRoleType } = {}) {
  const created = new Date(Date.now() - (o.ago ?? 0) * DAY);
  const p = await prisma.patient.create({
    data: {
      email: o.email === undefined ? em(name) : o.email, role: o.role ?? "patient", source: "web", createdAt: created, updatedAt: created,
      contactProfile: { create: { firstName: name, lastName: tag, createdAt: created, updatedAt: created, phone: "9155550100" } },
      ...(o.consent === false ? {} : { consentRecords: { create: [{ type: "data_and_contact", granted: true, textVersion: "t", method: "web", createdAt: created }] } }),
      ...(o.board ? { boardRoles: { create: [{ role: o.board, assignedBy: "test", fromEmail: null }] } } : {}),
    },
  });
  patients.push(p.id);
  return p.id;
}
/** A board-only record: invited by name + org email, no household data. */
async function boardOnly(name: string, role: BoardRoleType = "SECRETARY", email?: string) {
  return family(name, { role: "board", consent: false, email: email ?? `${tag}.${name}@${D}`, board: role });
}
const sub = (provider: string, n: string) => { const s = `${provider}|${tag}${n}`; subs.push(s); return s; };
const user = (s: string, email: string, verified = true) => ({ sub: s, email, email_verified: verified });

// ── Pure rules ────────────────────────────────────────────────────────────────
test("org identity: exact domain, verified, Google only", () => {
  assert.equal(isOrgEmail("Pat@HemoElPaso.org", D), true);
  for (const bad of ["pat@evil-hemoelpaso.org", "pat@mail.hemoelpaso.org", "pat@hemoelpaso.org.evil.com", "@hemoelpaso.org", "pat@gmail.com", "", null]) assert.equal(isOrgEmail(bad as string, D), false, String(bad));
  const ok = { provider: BOARD_PROVIDER, email: `a@${D}`, emailVerified: true };
  assert.equal(isOrgIdentity(ok, D), true);
  assert.equal(isOrgIdentity({ ...ok, provider: "apple" }, D), false);
  assert.equal(isOrgIdentity({ ...ok, provider: "facebook" }, D), false);
  assert.equal(isOrgIdentity({ ...ok, emailVerified: false }, D), false);
  assert.equal(providerOf("google-oauth2|123"), "google-oauth2");
  assert.equal(providerOf("nopipe"), "unknown");
});

const facts = (o: Partial<SessionFacts> & { identity: SessionFacts["identity"] }): SessionFacts => ({ patientRole: "board", activeBoardRoles: 1, requireOrgAccount: false, domain: D, ...o });
const org = { provider: BOARD_PROVIDER, email: `p@${D}`, emailVerified: true, linkedVia: "auto" };
const gmail = (via: string) => ({ provider: BOARD_PROVIDER, email: "p@gmail.com", emailVerified: true, linkedVia: via });

test("session mode: org Google identity of a board member = board; any other identity = family", () => {
  assert.equal(resolveMode(facts({ identity: org })), "board");
  assert.equal(resolveMode(facts({ identity: org, requireOrgAccount: true })), "board");
  assert.equal(resolveMode(facts({ identity: { ...org, provider: "apple" } })), "family"); // org address via Apple never reaches /admin
  assert.equal(resolveMode(facts({ identity: gmail("auto") })), "family");
  assert.equal(resolveMode(facts({ identity: gmail("auto"), requireOrgAccount: true })), "family");
  assert.equal(resolveMode(facts({ identity: null })), "none");
});
test("a family (no board role) with an org-looking identity is still family", () => {
  assert.equal(resolveMode(facts({ identity: org, patientRole: "patient", activeBoardRoles: 0 })), "family");
  assert.equal(resolveMode(facts({ identity: org, patientRole: "board", activeBoardRoles: 0 })), "family"); // role removed
});
test("admin account: board mode with the org identity", () => {
  assert.equal(resolveMode(facts({ identity: { ...org, email: `admin@${D}` }, patientRole: "admin", activeBoardRoles: 0 })), "board");
});
test("officer transition: OFF grandfathers existing (backfill) identities only; ON requires an org identity", () => {
  assert.equal(resolveMode(facts({ identity: gmail("backfill"), requireOrgAccount: false })), "board");
  assert.equal(resolveMode(facts({ identity: gmail("backfill"), requireOrgAccount: true })), "family");
  assert.equal(resolveMode(facts({ identity: gmail("admin"), requireOrgAccount: false })), "family");
  assert.equal(resolveMode(facts({ identity: gmail("merge"), requireOrgAccount: false })), "family");
  assert.equal(resolveMode(facts({ identity: org, requireOrgAccount: true })), "board");
});
test("the setting can be turned on only when every officer role has an org identity", () => {
  const all = (has: boolean[]) => (["PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER"] as const).map((role, i) => ({ patientId: `p${i}`, role, hasOrgIdentity: has[i] }));
  assert.deepEqual(canRequireOrg(all([true, true, true, true])), { ok: true });
  assert.deepEqual(canRequireOrg(all([true, true, false, true])), { ok: false, missing: ["SECRETARY"] });
  assert.deepEqual(canRequireOrg(all([true, true, true, true]).slice(0, 3)), { ok: false, missing: ["TREASURER"] });
  assert.equal(canRequireOrg([]).ok, false);
});
test("auto-link decision: unverified ignored; 0 unmatched; 1 link; 2+ ambiguous", () => {
  assert.deepEqual(decideLink(false, [{ id: "a" }]), { kind: "ignore", reason: "unverified_email" });
  assert.deepEqual(decideLink(undefined, []), { kind: "ignore", reason: "unverified_email" });
  assert.deepEqual(decideLink(true, []), { kind: "unmatched" });
  assert.deepEqual(decideLink(true, [{ id: "a" }]), { kind: "link", patientId: "a" });
  assert.deepEqual(decideLink(true, [{ id: "b" }, { id: "a" }]), { kind: "ambiguous", patientIds: ["a", "b"] });
});
test("merge survivor: admin never; two households need a choice; a board-only record folds into the household", () => {
  const r = (id: string, role: string, hasHousehold: boolean, d = 1) => ({ id, role, hasHousehold, createdAt: new Date(2026, 0, d) });
  assert.deepEqual(chooseSurvivor(r("a", "admin", false), r("b", "patient", true)), { ok: false, error: "admin_record" });
  assert.deepEqual(chooseSurvivor(r("a", "patient", true), r("b", "patient", true)), { ok: false, error: "needs_keep_choice" });
  assert.deepEqual(chooseSurvivor(r("a", "patient", true), r("b", "patient", true), "b"), { ok: true, keepId: "b", dropId: "a" });
  assert.deepEqual(chooseSurvivor(r("a", "patient", true), r("b", "patient", true), "zzz"), { ok: false, error: "bad_keep" });
  assert.deepEqual(chooseSurvivor(r("a", "board", false, 1), r("b", "patient", true, 5)), { ok: true, keepId: "b", dropId: "a" });
  assert.deepEqual(chooseSurvivor(r("a", "board", false, 5), r("b", "board", false, 1)), { ok: true, keepId: "b", dropId: "a" });
  assert.deepEqual(chooseSurvivor(r("a", "board", false), r("a", "board", false)), { ok: false, error: "same_record" });
});
test("separation of duties: admin has no data permission, so no link / merge; and may touch only household-free board records", () => {
  const admin = resolvePermissions("admin", [], DEFAULT_MATRIX);
  assert.equal(admin.has("canManageUsers"), false);
  assert.equal(admin.has("canAssignBoardRoles"), true);
  assert.equal(admin.has("canManageSettings"), true);
  assert.equal(adminMayTouch({ role: "board", hasHousehold: false }), true);
  assert.equal(adminMayTouch({ role: "board", hasHousehold: true }), false);
  assert.equal(adminMayTouch({ role: "patient", hasHousehold: false }), false);
  const officers = resolvePermissions("board", ["PRESIDENT"], DEFAULT_MATRIX);
  assert.equal(officers.has("canManageUsers"), true);
  assert.equal(resolvePermissions("board", ["TREASURER"], DEFAULT_MATRIX).has("canManageUsers"), false);
});
test("org email validation: domain only, never the admin mailbox", () => {
  assert.deepEqual(validateOrgEmail("  Pat@HemoElPaso.org "), { ok: true, email: `pat@${D}` });
  assert.deepEqual(validateOrgEmail("pat@gmail.com"), { ok: false, error: "not_org_email" });
  assert.deepEqual(validateOrgEmail("nope"), { ok: false, error: "invalid_email" });
  assert.deepEqual(validateOrgEmail(`admin@${D}`), { ok: false, error: "admin_mailbox" });
});

test("session lifetime is explicit and matches the published retention text (EN and ES)", () => {
  assert.deepEqual(SESSION_CONFIG, { rolling: true, rollingDuration: 24 * 3600, absoluteDuration: 7 * 24 * 3600 });
  const src = readFileSync("src/content/legal/privacy.ts", "utf8");
  assert.ok(src.includes(`Up to ${SESSION_ABSOLUTE_DAYS} days, and you’re signed out after ${SESSION_IDLE_HOURS} hours of inactivity`));
  assert.ok(src.includes(`Hasta ${SESSION_ABSOLUTE_DAYS} días, y se cierra su sesión tras ${SESSION_IDLE_HOURS} horas de inactividad`));
  assert.ok(!src.includes("Sessions: 30 days"));
});

// ── Auto-link (DB) ────────────────────────────────────────────────────────────
test("auto-link: one match links; zero stores an unmatched sign-in; several store it and link nobody", async () => {
  const one = await family("one");
  const s1 = sub("google-oauth2", "1");
  const r1 = await resolveForUser(user(s1, em("one")));
  assert.equal(r1.patient?.id, one);
  assert.equal(r1.mode, "family");
  assert.equal(r1.hasHousehold, true);
  const row = await prisma.userIdentity.findUnique({ where: { auth0Sub: s1 } });
  assert.equal(row?.linkedVia, "auto");
  assert.equal((await prisma.patient.findUnique({ where: { id: one }, select: { auth0Id: true } }))?.auth0Id, null, "families never get the deprecated auth0Id");

  const s0 = sub("apple", "0");
  const r0 = await resolveForUser(user(s0, em("nobody")));
  assert.equal(r0.mode, "none");
  assert.equal(r0.patient, null);
  const unmatched = await prisma.userIdentity.findUnique({ where: { auth0Sub: s0 } });
  assert.equal(unmatched?.patientId, null);

  await family("dupa", { email: em("dup") });
  await family("dupb", { email: em("dup") });
  const sd = sub("google-oauth2", "d");
  const rd = await resolveForUser(user(sd, em("dup")));
  assert.equal(rd.mode, "none");
  assert.equal((await prisma.userIdentity.findUnique({ where: { auth0Sub: sd } }))?.patientId, null);

  // a verified email is required; an unverified one is never linked or stored
  const su = sub("facebook", "u");
  assert.equal((await resolveForUser(user(su, em("one"), false))).mode, "none");
  assert.equal(await prisma.userIdentity.findUnique({ where: { auth0Sub: su } }), null);
});
test("auto-link matches the PRIMARY email only, never a household member's", async () => {
  const p = await family("host");
  await prisma.householdMember.create({ data: { patientId: p, firstName: "Kid", relationship: "spouse_partner", ageGroup: "18_plus", email: em("spouse"), status: "confirmed" } });
  const s = sub("google-oauth2", "m");
  assert.equal((await resolveForUser(user(s, em("spouse")))).mode, "none");
});
test("an unmatched sign-in links on a later visit once the household exists", async () => {
  const s = sub("google-oauth2", "late");
  assert.equal((await resolveForUser(user(s, em("late")))).mode, "none");
  const p = await family("late");
  const r = await resolveForUser(user(s, em("late")));
  assert.equal(r.patient?.id, p);
  assert.equal(r.mode, "family");
});

// ── Session modes (DB) ────────────────────────────────────────────────────────
test("a family session (personal Gmail) is refused board mode for a person who holds a board role", async () => {
  await setRequireOrg(false);
  const pid = await family("officer", { role: "board", board: "PRESIDENT", email: em("officer") });
  const s = sub("google-oauth2", "gm");
  const r = await resolveForUser(user(s, em("officer")));
  assert.equal(r.patient?.id, pid);
  assert.equal(r.mode, "family", "auto-linked Gmail is never board, even with the setting OFF");
  assert.equal(r.hasHousehold, true); // so it can still open its own household page
  await setRequireOrg(true);
  assert.equal((await resolveForUser(user(s, em("officer")))).mode, "family");
});
test("a board session needs an org Google identity; the same person on Apple is family", async () => {
  const pid = await boardOnly("bm", "SECRETARY");
  const email = `${tag}.bm@${D}`;
  const g = sub("google-oauth2", "bmg");
  const rg = await resolveForUser(user(g, email));
  assert.equal(rg.patient?.id, pid);
  assert.equal(rg.mode, "board");
  assert.equal(rg.hasHousehold, false); // board-only: no household page
  const a = sub("apple", "bma");
  await prisma.userIdentity.create({ data: { auth0Sub: a, provider: "apple", email, emailVerified: true, patientId: pid, linkedVia: "auto", linkedAt: new Date() } });
  assert.equal((await resolveForUser(user(a, email))).mode, "family");
});
test("officer transition ON/OFF in the database: a grandfathered Gmail keeps board access only while the setting is off", async () => {
  const pid = await family("old", { role: "board", board: "TREASURER", email: em("old") });
  const s = sub("google-oauth2", "old");
  await prisma.userIdentity.create({ data: { auth0Sub: s, provider: "google-oauth2", email: em("old"), emailVerified: true, patientId: pid, linkedVia: "backfill", linkedAt: new Date() } });
  await setRequireOrg(false);
  assert.equal((await resolveForUser(user(s, em("old")))).mode, "board");
  await setRequireOrg(true);
  assert.equal((await resolveForUser(user(s, em("old")))).mode, "family");
  await setRequireOrg(false);
  assert.equal((await resolveForUser(user(s, em("old")))).mode, "board");
});
test("unlinked sign-ins stay unlinked: no automatic re-link", async () => {
  const pid = await boardOnly("ul");
  const email = `${tag}.ul@${D}`;
  const s = sub("google-oauth2", "ul");
  await resolveForUser(user(s, email));
  const ident = await prisma.userIdentity.findUnique({ where: { auth0Sub: s } });
  const out = await unlinkBoardOrgIdentity(pid, ident!.id, { id: pid });
  assert.equal(out.ok, true);
  assert.equal((await resolveForUser(user(s, email))).mode, "none");
  const ok = await linkIdentity(ident!.id, pid, { id: pid });
  assert.equal(ok.ok, true);
  assert.equal((await resolveForUser(user(s, email))).mode, "board");
});

// ── Admin tools: separation of duties (DB) ────────────────────────────────────
test("admin tools refuse a record that has a household, and non-org identities", async () => {
  const hh = await family("hh", { role: "board", board: "SECRETARY", email: em("hh") });
  assert.equal((await setBoardOrgEmail(hh, `${tag}.new@${D}`, { id: hh })).ok, false);
  const ident = await prisma.userIdentity.create({ data: { auth0Sub: sub("google-oauth2", "hh"), provider: "google-oauth2", email: em("hh"), emailVerified: true, patientId: hh, linkedVia: "auto" } });
  assert.equal((await unlinkBoardOrgIdentity(hh, ident.id, { id: hh })).ok, false);

  const bo = await boardOnly("bo2");
  const gm = await prisma.userIdentity.create({ data: { auth0Sub: sub("google-oauth2", "bo2"), provider: "google-oauth2", email: "x@gmail.com", emailVerified: true, patientId: bo, linkedVia: "auto" } });
  const r = await unlinkBoardOrgIdentity(bo, gm.id, { id: bo });
  assert.deepEqual([r.ok, !r.ok && r.error], [false, "not_an_org_identity"]);
  assert.equal((await setBoardOrgEmail(bo, "someone@gmail.com", { id: bo })).ok, false);
  await boardOnly("taken");
  const clash = await setBoardOrgEmail(bo, `${tag}.taken@${D}`, { id: bo });
  assert.deepEqual([clash.ok, !clash.ok && clash.error], [false, "email_in_use"]);
  const good = await setBoardOrgEmail(bo, `${tag}.bo2new@${D}`, { id: bo });
  assert.equal(good.ok, true);
  const admin = await prisma.patient.create({ data: { email: `${tag}.admin@${D}`, role: "admin", contactProfile: { create: { firstName: "A", lastName: tag } } } });
  patients.push(admin.id);
  const adminIdent = await prisma.userIdentity.create({ data: { auth0Sub: sub("google-oauth2", "adm"), provider: "google-oauth2", email: `${tag}.admin@${D}`, emailVerified: true, patientId: admin.id, linkedVia: "auto" } });
  assert.equal((await unlinkIdentity(adminIdent.id, { id: hh })).ok, false, "the admin account's sign-in is never unlinked by an officer");
});

// ── PATIENT_ONLY replacement ──────────────────────────────────────────────────
test("households still appear everywhere; board-only and admin records never do", async () => {
  const fam = await family("fam", { ago: 4 * 365 }); // an old household: also shows in the inactive list
  const signedIn = await family("signed", { ago: 4 * 365 });
  await prisma.userIdentity.create({ data: { auth0Sub: sub("google-oauth2", "signed"), provider: "google-oauth2", email: em("signed"), emailVerified: true, patientId: signedIn, linkedVia: "auto" } });
  const noConsent = await family("legacy", { consent: false, ago: 4 * 365 }); // role patient, no sign-in: visible before, must be now
  const bOnly = await boardOnly("bonly");
  const admin = await prisma.patient.create({ data: { email: `${tag}.adm2@${D}`, role: "admin", contactProfile: { create: { firstName: "Adm", lastName: tag } } } });
  patients.push(admin.id);
  const boardHousehold = await family("bh", { role: "board", board: "SECRETARY", email: em("bh"), ago: 4 * 365 });

  const should = [fam, signedIn, noConsent, boardHousehold];
  const never = [bOnly, admin.id];

  // search + detail + attendees page + invitations (same filter)
  const found = new Set((await prisma.patient.findMany({ where: { ...PATIENT_ONLY, id: { in: [...should, ...never] } }, select: { id: true } })).map((p) => p.id));
  for (const id of should) assert.ok(found.has(id), `${id} should be a household`);
  for (const id of never) assert.ok(!found.has(id), `${id} must not be a household`);

  // admin patient list (listPatients)
  const listed = new Set((await listPatients({ q: tag })).map((p) => p.id));
  for (const id of should) assert.ok(listed.has(id));
  for (const id of never) assert.ok(!listed.has(id));

  // invitations (matchPatientsForEvent reads PATIENT_ONLY)
  const ev = await prisma.event.create({ data: { slug: `${tag}-ev`, titleEn: "T", titleEs: "T", eventDate: new Date(Date.now() + 30 * DAY), location: "X", status: "published" } });
  events.push(ev.id);
  const m = await matchPatientsForEvent(ev.id);
  const matched = new Set([...(m?.emailMatches ?? []), ...(m?.callList ?? [])].map((p) => p.id));
  for (const id of never) assert.ok(!matched.has(id), "board-only/admin never get invitations");

  // retention: inactive households
  const inactive = new Set((await listInactiveHouseholds()).map((h) => h.id));
  for (const id of [fam, signedIn, noConsent, boardHousehold]) assert.ok(inactive.has(id), `${id} listed as inactive`);
  for (const id of never) assert.ok(!inactive.has(id));

  // the admin's own view is the mirror image
  const adminSees = new Set((await prisma.patient.findMany({ where: { id: { in: [...should, ...never] }, ...BOARD_ONLY }, select: { id: true } })).map((p) => p.id));
  assert.ok(adminSees.has(bOnly));
  for (const id of should) assert.ok(!adminSees.has(id), "the settings-only admin never sees a household");
  assert.ok(!adminSees.has(admin.id));
});

// ── Merge ─────────────────────────────────────────────────────────────────────
test("merge: a board record folds into the household; identities and roles move; audit holds ids only", async () => {
  const hh = await family("mh", { email: em("mh") });
  await prisma.rsvp.deleteMany({ where: { patientId: hh } });
  const board = await boardOnly("mb", "PRESIDENT", `${tag}.mb@${D}`);
  const org = await prisma.userIdentity.create({ data: { auth0Sub: sub("google-oauth2", "mb"), provider: "google-oauth2", email: `${tag}.mb@${D}`, emailVerified: true, patientId: board, linkedVia: "auto" } });
  const old = await prisma.userIdentity.create({ data: { auth0Sub: sub("google-oauth2", "mbold"), provider: "google-oauth2", email: "old@gmail.com", emailVerified: true, patientId: board, linkedVia: "backfill" } });
  const actor = await boardOnly("actor", "SECRETARY");
  const r = await mergePeople(board, hh, actor);
  assert.equal(r.ok, true);
  assert.ok(r.ok && r.keptId === hh && r.droppedId === board, "the household survives");
  assert.ok(r.ok && r.moved.identities === 2 && r.moved.boardRoles === 1);

  const tomb = await prisma.patient.findUnique({ where: { id: board }, include: { contactProfile: true, identities: true } });
  assert.equal(tomb?.role, "merged", "the dropped record is kept as a tombstone");
  assert.equal(tomb?.mergedIntoId, hh);
  assert.deepEqual([tomb?.email, tomb?.contactProfile, tomb?.identities.length], [null, null, 0], "no personal data, no sign-ins left on the tombstone");
  const kept = await prisma.patient.findUnique({ where: { id: hh }, include: { boardRoles: true, identities: true } });
  assert.equal(kept?.role, "board");
  assert.deepEqual(kept?.boardRoles.map((b) => b.role), ["PRESIDENT"]);
  assert.deepEqual(kept?.identities.map((i) => i.id).sort(), [org.id, old.id].sort());
  assert.equal(kept?.identities.find((i) => i.id === old.id)?.linkedVia, "backfill", "grandfathered mark survives the merge");
  assert.equal(kept?.identities.find((i) => i.id === org.id)?.linkedVia, "merge");

  // now the org identity opens the board AND the household page
  const res = await resolveForUser(user(org.auth0Sub, `${tag}.mb@${D}`));
  assert.equal(res.mode, "board");
  assert.equal(res.hasHousehold, true);

  const log = await prisma.auditLog.findFirst({ where: { action: "PATIENT_MERGED", resourceId: hh }, orderBy: { createdAt: "desc" } });
  const text = `${log?.details} ${JSON.stringify(log?.changes)}`;
  assert.ok(log && !/@/.test(text), "no email address in the audit row");
  assert.ok(text.includes(hh) && text.includes(board));
});
test("merge: two households need an explicit survivor; admin records never merge", async () => {
  const a = await family("ma"), b = await family("mb2");
  const actor = await boardOnly("actor2", "PRESIDENT");
  const first = await mergePeople(a, b, actor);
  assert.deepEqual([first.ok, !first.ok && first.error, !first.ok && first.status], [false, "needs_keep_choice", 409]);
  assert.ok(await prisma.patient.findUnique({ where: { id: a } }) && (await prisma.patient.findUnique({ where: { id: b } })), "nothing was merged");
  const second = await mergePeople(a, b, actor, b);
  assert.ok(second.ok && second.keptId === b && second.droppedId === a);
  const admin = await prisma.patient.create({ data: { email: `${tag}.adm3@${D}`, role: "admin" } });
  patients.push(admin.id);
  const third = await mergePeople(admin.id, b, actor);
  assert.deepEqual([third.ok, !third.ok && third.error], [false, "admin_record"]);
});
test("merge: consents are copied append-only; RSVPs move", async () => {
  const a = await family("mc1"), b = await family("mc2");
  const ev = await prisma.event.create({ data: { slug: `${tag}-ev2`, titleEn: "T", titleEs: "T", eventDate: new Date(Date.now() + 30 * DAY), location: "X", status: "published" } });
  events.push(ev.id);
  await prisma.rsvp.create({ data: { eventId: ev.id, patientId: a, attendeeCount: 1 } });
  const actor = await boardOnly("actor3", "PRESIDENT");
  const r = await mergePeople(a, b, actor, b);
  assert.ok(r.ok && r.moved.rsvps === 1 && r.moved.consents === 1);
  assert.equal(await prisma.rsvp.count({ where: { patientId: b, eventId: ev.id } }), 1);
  assert.equal(await prisma.consentRecord.count({ where: { patientId: b, type: "data_and_contact" } }), 2);
});

// ── Retention ─────────────────────────────────────────────────────────────────
test("unmatched sign-ins are purged after 30 days; linked ones and fresh ones are kept", async () => {
  const pid = await family("keepme");
  const mk = (n: string, patientId: string | null, ago: number) => prisma.userIdentity.create({ data: { auth0Sub: sub("apple", n), provider: "apple", email: `${tag}.${n}@example.org`, emailVerified: true, patientId, lastLoginAt: new Date(Date.now() - ago * DAY) } });
  const oldU = await mk("oldu", null, PURGE_UNMATCHED_DAYS + 1);
  const newU = await mk("newu", null, 5);
  const oldL = await mk("oldl", pid, 400);
  await purgeUnmatchedIdentities();
  assert.equal(await prisma.userIdentity.findUnique({ where: { id: oldU.id } }), null);
  assert.ok(await prisma.userIdentity.findUnique({ where: { id: newU.id } }));
  assert.ok(await prisma.userIdentity.findUnique({ where: { id: oldL.id } }));
});
test("the backfill copied every legacy auth0Id into an identity", async () => {
  const legacy = await prisma.patient.count({ where: { auth0Id: { not: null } } });
  const copied = await prisma.userIdentity.count({ where: { linkedVia: "backfill", patient: { auth0Id: { not: null } } } });
  assert.equal(copied >= legacy ? true : legacy === 0, true, `${legacy} legacy links, ${copied} backfilled`);
});
void HOUSEHOLD_EVIDENCE;
