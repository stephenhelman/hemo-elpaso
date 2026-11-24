/**
 * Family page. Run: npm run check:portal   (db-guard refuses production; DEV database, throw-away rows are deleted after)
 *  - gate: signed out / unmatched / board-only / family / board with household, toggle off ("coming soon") and on
 *  - a household sees only its own data; another adult's diagnoses are never shown; minors' are
 *  - consent changes append a record (method "portal", current text version); same value = no write; old rows untouched
 *  - activity log rows are actorType "family" and hold ids only
 *  - RSVP links resolve to the same household; cancelled / cleared tokens give no link
 *  - the old PortalNavBar/PortalFooter/PortalLayout are gone; policy text no longer promises email links
 */
import "./_load-env";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test, after } from "node:test";
import { prisma } from "../src/lib/db";
import { portalGate, isPortalConsentType, consentChange, currentValue, visibleDiagnoses, sameOrigin, isPast, CONSENT_CHANGES_PER_MINUTE } from "../src/lib/portal/rules";
import { loadHousehold } from "../src/lib/portal/household";
import { auditPortalView, recordPortalConsent } from "../src/lib/portal/service";
import { CONSENT_TEXT_VERSION } from "../src/content/consent";
import { encryptCheckInToken } from "../src/lib/crypto/checkin-token";
import { generateToken, hashToken } from "../src/lib/tokens";
import { resolveRsvpToken } from "../src/lib/rsvp";
import { FEATURES } from "../src/lib/features/registry";

const DAY = 864e5;
const tag = `ptl${Date.now()}`;
const patients: string[] = [];
const events: string[] = [];

after(async () => {
  await prisma.auditLog.deleteMany({ where: { patientId: { in: patients } } });
  await prisma.event.deleteMany({ where: { id: { in: events } } });
  await prisma.patient.deleteMany({ where: { id: { in: patients } } });
  await prisma.$disconnect();
});

async function household(name: string, diagnoses: string[] = ["hemophilia_a"]) {
  const p = await prisma.patient.create({
    data: {
      email: `${tag}.${name}@example.org`, role: "patient", source: "web", primaryDiagnoses: diagnoses, statedDiagnoses: diagnoses,
      contactProfile: { create: { firstName: name, lastName: tag } },
      consentRecords: { create: [{ type: "data_and_contact", granted: true, textVersion: "v3", method: "web" }, { type: "media", granted: false, textVersion: "v3", method: "web" }] },
    },
  });
  patients.push(p.id);
  return p.id;
}
const event = async (n: string, startsInDays: number) => {
  const start = new Date(Date.now() + startsInDays * DAY);
  const e = await prisma.event.create({ data: { slug: `${tag}-${n}`, titleEn: `En ${n}`, titleEs: `Es ${n}`, eventDate: start, endDate: new Date(start.getTime() + 3 * 3600e3), location: "Hall", status: "published" } });
  events.push(e.id);
  return e.id;
};

// ── Pure ──────────────────────────────────────────────────────────────────────
test("gate: every session type, toggle off and on", () => {
  assert.equal(portalGate(null, true), "login");
  assert.equal(portalGate({ mode: "none", hasHousehold: false }, true), "no-household"); // signed in, not matched
  assert.equal(portalGate({ mode: "board", hasHousehold: false }, true), "no-household"); // board-only and admin@: no household
  assert.equal(portalGate({ mode: "family", hasHousehold: true }, false), "coming-soon");
  assert.equal(portalGate({ mode: "family", hasHousehold: true }, true), "show");
  assert.equal(portalGate({ mode: "board", hasHousehold: true }, true), "show"); // a board member with a linked household
  assert.equal(portalGate({ mode: "board", hasHousehold: true }, false), "coming-soon");
});
test("the family_portal feature is built and the retired social toggle is gone", () => {
  assert.equal(FEATURES.family_portal.implemented, true);
  assert.equal((FEATURES as Record<string, unknown>).family_social_signin, undefined);
});
test("only media, sms and newsletter can be changed from the page", () => {
  for (const t of ["media", "sms", "newsletter"]) assert.equal(isPortalConsentType(t), true);
  for (const t of ["data_and_contact", "age_guardian_attestation", "verification", "", null, 1, "constructor"]) assert.equal(isPortalConsentType(t), false, String(t));
});
test("consent value is the newest row; same value is a no-op", () => {
  const d = (n: number) => new Date(2026, 0, n);
  const rows = [{ type: "sms", granted: true, createdAt: d(1) }, { type: "sms", granted: false, createdAt: d(5) }, { type: "media", granted: true, createdAt: d(2) }];
  assert.equal(currentValue(rows, "sms"), false);
  assert.equal(currentValue(rows, "newsletter"), null);
  assert.equal(consentChange(rows, "sms", false), "noop");
  assert.equal(consentChange(rows, "sms", true), "record");
  assert.equal(consentChange(rows, "newsletter", false), "record"); // never set: recording an explicit "no" is a real decision
});
test("diagnoses: the primary's and minors' only; another adult's never", () => {
  const v = visibleDiagnoses(["carrier"], [
    { id: "kid", ageGroup: "6_12", statedDiagnoses: ["hemophilia_a"] },
    { id: "adult", ageGroup: "18_plus", statedDiagnoses: ["von_willebrand"] },
    { id: "teen", ageGroup: "13_17", statedDiagnoses: [] },
  ]);
  assert.deepEqual(v, { primary: ["carrier"], minors: { kid: ["hemophilia_a"] } });
});
test("same-origin check and event timing", () => {
  assert.equal(sameOrigin("https://hemoelpaso.org", "hemoelpaso.org"), true);
  assert.equal(sameOrigin("https://evil.example", "hemoelpaso.org"), false);
  assert.equal(sameOrigin("not a url", "hemoelpaso.org"), false);
  assert.equal(sameOrigin(null, "hemoelpaso.org"), true);
  const now = new Date("2026-06-01T12:00:00Z");
  assert.equal(isPast({ eventDate: new Date("2026-05-31T12:00:00Z"), endDate: null }, now), true);
  assert.equal(isPast({ eventDate: new Date("2026-06-01T08:00:00Z"), endDate: null }, now), false); // 12h default window
  assert.equal(isPast({ eventDate: new Date("2026-06-02T12:00:00Z"), endDate: null }, now), false);
});

// ── Household data (DB) ───────────────────────────────────────────────────────
test("a household sees only its own data; another adult's diagnoses are not included", async () => {
  const a = await household("alpha", ["hemophilia_a"]);
  const b = await household("bravo", ["von_willebrand"]);
  await prisma.householdMember.createMany({ data: [
    { patientId: a, firstName: "Kid", relationship: "child", ageGroup: "6_12", statedDiagnoses: ["hemophilia_b"], status: "not_required" },
    { patientId: a, firstName: "Spouse", relationship: "spouse_partner", ageGroup: "18_plus", statedDiagnoses: ["carrier"], status: "confirmed" },
  ] });
  const h = await loadHousehold(a);
  assert.ok(h);
  assert.equal(h.firstName, "alpha");
  assert.deepEqual(h.primaryDiagnoses, ["hemophilia_a"]);
  assert.deepEqual(h.members.map((m) => [m.firstName, m.diagnoses]).sort(), [["Kid", ["hemophilia_b"]], ["Spouse", []]]);
  const json = JSON.stringify(h);
  assert.ok(!json.includes("von_willebrand") && !json.includes("bravo"), "nothing of another household");
  assert.ok(!json.includes("carrier"), "the other adult's diagnosis is never loaded");
  const hb = await loadHousehold(b);
  assert.deepEqual(hb?.members, []);
  assert.equal(await loadHousehold("00000000-0000-0000-0000-000000000000"), null);
});

test("RSVPs: upcoming vs past, working links, none for cancelled or cleared; invitations without an RSVP", async () => {
  const p = await household("rsvps");
  const other = await household("rsvps2");
  const up = await event("up", 10), past = await event("past", -10), canc = await event("canc", 12), cleared = await event("clr", 14), inv = await event("inv", 20), otherEv = await event("oth", 8);
  const tokUp = generateToken(), tokPast = generateToken(), tokCanc = generateToken();
  const mk = (eventId: string, tok: string | null, extra: object = {}) =>
    prisma.rsvp.create({ data: { eventId, patientId: p, attendeeCount: 2, checkInTokenHash: tok ? hashToken(tok) : null, checkInTokenEnc: tok ? encryptCheckInToken(tok) : null, ...extra } });
  await mk(up, tokUp); await mk(past, tokPast); await mk(canc, tokCanc, { cancelledAt: new Date() }); await mk(cleared, null);
  await prisma.rsvp.create({ data: { eventId: otherEv, patientId: other, attendeeCount: 1 } });
  await prisma.invitation.create({ data: { eventId: inv, patientId: p, tokenHash: `ih-${tag}`, status: "sent" } });
  await prisma.invitation.create({ data: { eventId: otherEv, patientId: p, tokenHash: `ih2-${tag}`, status: "pending" } }); // not sent yet: not shown

  const h = await loadHousehold(p);
  assert.ok(h);
  const byTitle = (list: { title: { en: string } }[]) => list.map((r) => r.title.en).sort();
  assert.deepEqual(byTitle(h.upcoming), ["En canc", "En clr", "En up"]);
  assert.deepEqual(byTitle(h.past), ["En past"]);
  assert.deepEqual(byTitle(h.invited), ["En inv"]);
  const link = (t: string) => h.upcoming.concat(h.past).find((r) => r.title.en === t)?.link;
  assert.equal(link("En up"), `/rsvp/${tokUp}`);
  assert.equal(link("En past"), `/rsvp/${tokPast}`);
  assert.equal(link("En canc"), null, "cancelled: no link");
  assert.equal(link("En clr"), null, "token cleared after the event: no link");
  // the link opens THIS household's RSVP in the existing flow
  const ctx = await resolveRsvpToken(tokUp);
  assert.equal(ctx?.patient.id, p);
  assert.ok(!JSON.stringify(h).includes("En oth"), "another household's event is never listed");
});

// ── Consent changes (DB) ──────────────────────────────────────────────────────
test("consent changes append rows (portal, current text version); same value writes nothing; old rows stay", async () => {
  const p = await household("consent");
  const before = await prisma.consentRecord.findMany({ where: { patientId: p }, orderBy: { createdAt: "asc" } });

  const r1 = await recordPortalConsent(p, "media", true);
  assert.deepEqual(r1, { ok: true, changed: true, granted: true });
  const r2 = await recordPortalConsent(p, "media", true);
  assert.deepEqual(r2, { ok: true, changed: false, granted: true });
  assert.equal((await recordPortalConsent(p, "sms", false)).ok, true);
  assert.equal((await recordPortalConsent(p, "newsletter", true)).ok, true);
  assert.equal((await recordPortalConsent(p, "media", false)).ok, true);

  const rows = await prisma.consentRecord.findMany({ where: { patientId: p }, orderBy: { createdAt: "asc" } });
  assert.equal(rows.length, before.length + 4);
  for (const b of before) assert.deepEqual(rows.find((r) => r.id === b.id), b, "existing rows are untouched");
  const added = rows.filter((r) => r.method === "portal");
  assert.equal(added.length, 4);
  assert.ok(added.every((r) => r.textVersion === CONSENT_TEXT_VERSION && r.recordedByBoardUserId === null));
  const h = await loadHousehold(p);
  assert.deepEqual(h?.consents, { data_and_contact: true, media: false, sms: false, newsletter: true });

  // the database itself refuses UPDATE of a consent record (append-only trigger)
  await assert.rejects(prisma.consentRecord.update({ where: { id: added[0].id }, data: { granted: !added[0].granted } }));
});

test("activity log: family rows, ids only; a view is logged; a change is logged without the text", async () => {
  const p = await household("audit");
  await auditPortalView(p);
  await recordPortalConsent(p, "sms", true);
  const logs = await prisma.auditLog.findMany({ where: { patientId: p }, orderBy: { createdAt: "asc" } });
  assert.deepEqual(logs.map((l) => l.action), ["PORTAL_VIEWED", "PORTAL_CONSENT_CHANGED"]);
  for (const l of logs) {
    assert.equal(l.actorType, "family");
    const text = `${l.details} ${JSON.stringify(l.changes)} ${l.resourceId}`;
    assert.ok(!/@/.test(text), "no email address");
    assert.ok(!/hemophilia|von_willebrand|carrier/i.test(text), "no diagnosis");
  }
  assert.deepEqual(logs[1].changes, { type: "sms", granted: true, textVersion: CONSENT_TEXT_VERSION });
});

test("consent changes are rate limited per person", async () => {
  const p = await household("rate");
  let last: Awaited<ReturnType<typeof recordPortalConsent>> = { ok: true, changed: false, granted: true };
  for (let i = 0; i < CONSENT_CHANGES_PER_MINUTE + 1; i++) last = await recordPortalConsent(p, "newsletter", i % 2 === 0);
  assert.deepEqual(last, { ok: false, status: 429, error: "rate_limited" });
});

// ── One navigation; policy text ───────────────────────────────────────────────
test("the old portal navigation is gone: one nav, one sign-in", () => {
  for (const f of ["PortalNavBar", "PortalFooter", "PortalLayout"]) assert.equal(existsSync(`src/components/layout/${f}.tsx`), false, f);
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(tsx?|mjs)$/.test(n) && /Portal(NavBar|Navbar|Footer|Layout)\b/.test(readFileSync(p, "utf8"))) offenders.push(p);
    }
  };
  walk("src");
  assert.deepEqual(offenders, []);
  // the one sign-in lives in Navbar/UserMenu; no other component links to the login route
  const loginLinks: string[] = [];
  const scan = (dir: string) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) scan(p);
      else if (/\.tsx$/.test(n) && p.includes("components") && readFileSync(p, "utf8").includes("/api/auth/login")) loginLinks.push(p);
    }
  };
  scan("src");
  assert.deepEqual(loginLinks.sort(), ["src/components/layout/UserMenu.tsx"]);
});
test("policy text: Google, Apple or Facebook only; no email-link sign-in anywhere", () => {
  const all = ["privacy", "terms", "children"].map((f) => readFileSync(`src/content/legal/${f}.ts`, "utf8")).join("\n");
  assert.ok(!/one-time sign-in link|enlace de un solo uso para iniciar|Sign-in links|Los enlaces de inicio de sesión|Los enlaces para iniciar/.test(all));
  assert.ok(!all.includes("family_social_signin"));
  assert.ok(all.includes("You sign in with Google, Apple or Facebook") && all.includes("Usted inicia sesión con Google, Apple o Facebook"));
  assert.ok(all.includes("Your sign-in is personal") && all.includes("Su inicio de sesión es personal"));
});
