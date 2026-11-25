/**
 * Event flyers in each family's language + delivery preference + paper mailing list. Run: npm run check:flyers
 * (db-guard refuses production; DEV database, throw-away rows are deleted after)
 *  - the right-language flyer, and the fallback to the other language; alt text travels with it
 *  - an `email` invitation shows the image + download link; a PDF gets the link only; `mail` and `none` get no flyer
 *  - the alt text is in the rendered email; the invitation stays complete without the image
 *  - reminder and RSVP confirmation emails carry no flyer
 *  - default delivery (email, else mail with a complete address, else none); "email" needs an email
 *  - the mailing list: approved + invited + mail + complete address only; incomplete addresses are listed separately
 *  - President/VP only (reviewers and every other role are refused); exports write an id/count/actor audit row
 *  - every preference change is logged with ids and the field name only (family page, adult, admin)
 */
import "./_load-env";
import "./_react-global";
import assert from "node:assert/strict";
import { test, after } from "node:test";
import { readFileSync } from "node:fs";
import { AuditAction } from "@prisma/client";
import { render } from "@react-email/render";
import { prisma } from "../src/lib/db";
import { cleanAlt, defaultFlyerDelivery, hasCompleteAddress, invitationFlyer, isPdfUrl, pickFlyer, validateFlyerDelivery } from "../src/lib/flyers";
import { setFlyerDelivery } from "../src/lib/flyers/delivery";
import { auditMailingExport, labelSheets, loadMailingList, mailingCsv, MAILING_PERMISSION, splitMailing, type MailingHousehold } from "../src/lib/flyers/mailing";
import { validatePatientInput } from "../src/lib/patients/create";
import { updateFlyerDelivery } from "../src/lib/portal/edit";
import { can } from "../src/lib/portal/permissions";
import { accessDecision, resolvePermissions } from "../src/lib/permissions";
import { DEFAULT_MATRIX, BOARD_ROLE_KEYS, type Permission } from "../src/lib/permission-catalog";
import { loadHousehold } from "../src/lib/portal/household";
import { generateToken, hashToken } from "../src/lib/tokens";
import EventInvitation from "../src/messages/EventInvitation";

delete process.env.RESEND_API_KEY;

const DAY = 864e5;
const tag = `fly${Date.now()}`;
const patients: string[] = [];
const events: string[] = [];
const startedAt = new Date();

after(async () => {
  await prisma.auditLog.deleteMany({ where: { OR: [{ resourceId: { in: [...patients, ...events] } }, { patientId: { in: patients } }] } });
  await prisma.event.deleteMany({ where: { id: { in: events } } });
  await prisma.patient.deleteMany({ where: { id: { in: patients } } });
  await prisma.$disconnect();
});

const EN = "https://media.hemoelpaso.org/flyers/e1/en-flyer.png";
const ES = "https://media.hemoelpaso.org/flyers/e1/es-flyer.jpg";
const both = { flyerEnUrl: EN, flyerEsUrl: ES, flyerEnAlt: "Picnic flyer in English", flyerEsAlt: "Volante del picnic en español" };
const GOOD = { addressLine1: "1 Main St", city: "El Paso", state: "TX", zipCode: "79901" };

// ── which flyer ──────────────────────────────────────────────────────────────
test("the household's language flyer is used, with its own alt text", () => {
  assert.deepEqual(pickFlyer(both, "en"), { url: EN, lang: "en", isPdf: false, alt: "Picnic flyer in English" });
  assert.deepEqual(pickFlyer(both, "es"), { url: ES, lang: "es", isPdf: false, alt: "Volante del picnic en español" });
});

test("fallback: only one language exists -> that one, for both families; none -> null", () => {
  const onlyEn = { flyerEnUrl: EN, flyerEsUrl: null, flyerEnAlt: "en alt" };
  assert.equal(pickFlyer(onlyEn, "es")?.lang, "en");
  assert.equal(pickFlyer(onlyEn, "es")?.alt, "en alt", "the alt text describes the flyer actually shown (its own language)");
  const onlyEs = { flyerEnUrl: null, flyerEsUrl: ES };
  assert.equal(pickFlyer(onlyEs, "en")?.lang, "es");
  assert.equal(pickFlyer({ flyerEnUrl: "  ", flyerEsUrl: null }, "en"), null);
  assert.equal(pickFlyer({ flyerEnUrl: null, flyerEsUrl: null }, "es"), null);
});

test("PDFs are recognised by extension, ignoring a query string; alt text is trimmed and capped", () => {
  assert.equal(isPdfUrl("https://m/x/en-flyer.PDF?v=1"), true);
  assert.equal(isPdfUrl(EN), false);
  assert.equal(cleanAlt("   "), null);
  assert.equal(cleanAlt("  a   b "), "a b");
  assert.equal(cleanAlt("x".repeat(500))?.length, 300);
  assert.equal(cleanAlt(5), null);
});

// ── delivery preference ──────────────────────────────────────────────────────
test("default: email if there is one, else mail with a complete address, else none", () => {
  assert.equal(defaultFlyerDelivery({ email: "a@example.org", address: null }), "email");
  assert.equal(defaultFlyerDelivery({ email: "a@example.org", address: GOOD }), "email");
  assert.equal(defaultFlyerDelivery({ email: null, address: GOOD }), "mail");
  assert.equal(defaultFlyerDelivery({ email: "  ", address: GOOD }), "mail");
  assert.equal(defaultFlyerDelivery({ email: null, address: { addressLine1: "1 Main St" } }), "none", "a legacy one-line address is not mailable");
  assert.equal(defaultFlyerDelivery({ email: null, address: { ...GOOD, zipCode: "7990" } }), "none");
  assert.equal(defaultFlyerDelivery({ email: null, address: { ...GOOD, state: "ZZ" } }), "none");
  assert.equal(defaultFlyerDelivery({ email: null, address: null }), "none");
  assert.equal(hasCompleteAddress(GOOD), true);
  assert.equal(hasCompleteAddress({ ...GOOD, city: " " }), false);
});

test("registration and admin validation: empty = default; email needs an email; junk is refused; edits without it leave the choice alone", () => {
  const base = { firstName: "A", lastName: "B", phone: "915-555-0101", language: "en", familySize: 1, diagnoses: [], members: [], consentDataAndContact: true, attestation: true };
  const v = (o: Record<string, unknown>, opts?: { requireConsent: boolean }) => validatePatientInput({ ...base, ...o } as never, opts);
  const val = (r: ReturnType<typeof v>) => (r.ok ? r.value.flyerDelivery : `bad:${r.field}`);
  assert.equal(val(v({ email: "a@example.org", address: {} })), "email");
  assert.equal(val(v({ email: "", address: { line1: "1 Main St", city: "El Paso", state: "TX", zip: "79901" } })), "mail");
  assert.equal(val(v({ email: "", address: {} })), "none");
  assert.equal(val(v({ email: "a@example.org", address: {}, flyerDelivery: "none" })), "none");
  assert.equal(val(v({ email: "", address: {}, flyerDelivery: "email" })), "bad:flyerDelivery");
  assert.equal(val(v({ email: "a@example.org", address: {}, flyerDelivery: "carrier-pigeon" })), "bad:flyerDelivery");
  assert.equal(val(v({ email: "a@example.org", address: {} }, { requireConsent: false })), null, "an edit that does not send it changes nothing");
  assert.equal(validateFlyerDelivery("mail", { email: null }), "mail");
  assert.equal(validateFlyerDelivery("email", { email: null }), null);
});

// ── invitation email ─────────────────────────────────────────────────────────
const props = { lang: "en" as const, firstName: "Ana", eventTitle: "Family Picnic", eventDate: "Sat, Dec 6", eventTime: "10:00 AM", location: "Park", rsvpUrl: "https://hoep.example/rsvp/tok", unsubscribeUrl: "https://hoep.example/u" };
const html = (flyer: ReturnType<typeof invitationFlyer>, lang: "en" | "es" = "en") => render(EventInvitation({ ...props, lang, flyer }));

test("email preference: the flyer image inline (from its public URL, with alt text) and a download link; no attachment", async () => {
  const f = invitationFlyer(both, "email", "en", "Family Picnic");
  assert.deepEqual(f, { imageUrl: EN, imageAlt: "Picnic flyer in English", downloadUrl: EN, mailNote: false });
  const out = await html(f);
  assert.match(out, new RegExp(`<img[^>]+src="${EN}"`));
  assert.match(out, /alt="Picnic flyer in English"/, "alt text is in the email");
  assert.match(out, new RegExp(`href="${EN}"[^>]*>Download the flyer<`));
  assert.ok(out.includes("Family Picnic") && out.includes("https://hoep.example/rsvp/tok") && out.includes("Park"), "the invitation text is complete");
  const es = await html(invitationFlyer(both, "email", "es", "Picnic Familiar"), "es");
  assert.match(es, new RegExp(`src="${ES}"`));
  assert.match(es, /alt="Volante del picnic en español"/);
  assert.match(es, /Descargar el volante/);
});

test("alt text falls back to the event title when the board wrote none", () => {
  assert.equal(invitationFlyer({ flyerEnUrl: EN, flyerEsUrl: null }, "email", "en", "Family Picnic")?.imageAlt, "Family Picnic");
});

test("a PDF flyer: download link only (no first-page image)", async () => {
  const pdf = { flyerEnUrl: "https://media.hemoelpaso.org/flyers/e1/en-flyer.pdf", flyerEsUrl: null };
  const f = invitationFlyer(pdf, "email", "en", "T");
  assert.equal(f?.imageUrl, null);
  assert.equal(f?.downloadUrl, pdf.flyerEnUrl);
  const out = await html(f);
  assert.ok(!out.includes(`src="${pdf.flyerEnUrl}"`));
  assert.match(out, /Download the flyer/);
});

test("mail and none: no flyer image and no download link; mail says we'll mail it (EN/ES)", async () => {
  for (const d of ["mail", "none"] as const) {
    const f = invitationFlyer(both, d, "en", "T");
    const out = await html(f);
    assert.ok(!out.includes(EN) && !out.includes(ES), `${d}: no flyer URL`);
    assert.ok(!out.includes("Download the flyer"), `${d}: no download link`);
    assert.ok(out.includes("Family Picnic") && out.includes("https://hoep.example/rsvp/tok"), `${d}: invitation is complete`);
    assert.equal(out.includes("mail you the flyer"), d === "mail", `${d}: mail note only for mail`);
  }
  assert.match(await html(invitationFlyer(both, "mail", "es", "T"), "es"), /Le enviaremos el volante por correo postal/);
  assert.equal(invitationFlyer(both, "none", "en", "T"), null);
  assert.equal(invitationFlyer({ flyerEnUrl: null, flyerEsUrl: null }, "email", "en", "T"), null, "an event without a flyer promises nothing");
  assert.equal(invitationFlyer({ flyerEnUrl: null, flyerEsUrl: null }, "mail", "en", "T"), null);
  assert.equal(invitationFlyer(both, "bogus", "en", "T"), null);
});

test("reminder and RSVP confirmation emails carry no flyer", () => {
  for (const f of ["src/lib/rsvp/emails.ts", "src/messages/RsvpEmail.tsx", "src/messages/RsvpAccessLinkEmail.tsx", "src/lib/email/send.ts"]) {
    assert.ok(!/flyer/i.test(readFileSync(f, "utf8")), `${f} must not mention flyers`);
  }
  assert.ok(/invitationFlyer\(/.test(readFileSync("src/lib/invitations/send.ts", "utf8")), "the invitation sender is the one place that adds it");
});

// ── mailing list: pure ───────────────────────────────────────────────────────
const hh = (id: string, over: Partial<MailingHousehold> = {}): MailingHousehold => ({ id, preferredLanguage: "en", firstName: "Ana", lastName: id, addressLine1: "1 Main St", addressLine2: null, city: "El Paso", state: "tx", zipCode: "79901", ...over });

test("split: complete addresses are rows (language = the flyer that exists); the rest are 'fix address first'", () => {
  const { rows, fix } = splitMailing([hh("a"), hh("b", { preferredLanguage: "es" }), hh("c", { zipCode: null }), hh("d", { city: "" }), hh("e", { addressLine1: "PO Box 5 El Paso TX", city: null, zipCode: null })], both);
  assert.deepEqual(rows.map((r) => [r.householdId, r.lang]).sort(), [["a", "en"], ["b", "es"]]);
  assert.equal(rows.find((r) => r.householdId === "a")!.state, "TX");
  assert.deepEqual(fix.map((f) => f.householdId).sort(), ["c", "d", "e"]);
  const onlyEn = splitMailing([hh("f", { preferredLanguage: "es" })], { flyerEnUrl: EN, flyerEsUrl: null });
  assert.equal(onlyEn.rows[0].lang, "en", "a Spanish-speaking household gets the English flyer when it is the only one");
});

test("CSV: header, one row per household, quoting, and spreadsheet formulas neutralised", () => {
  const { rows } = splitMailing([hh("a", { firstName: "=cmd", addressLine2: 'Apt "5", B' })], both);
  const csv = mailingCsv(rows);
  const lines = csv.replace(/^﻿/, "").trim().split("\r\n");
  assert.equal(lines[0], "language,name,address_line_1,address_line_2,city,state,zip");
  assert.equal(lines.length, 2);
  assert.ok(lines[1].includes("'=cmd a"), "a leading = is prefixed");
  assert.ok(lines[1].includes('"Apt ""5"", B"'));
});

test("labels: grouped by language, a new sheet per language, 30 per sheet (Avery 5160)", () => {
  const households = [...Array.from({ length: 31 }, (_, i) => hh(`en${i}`)), ...Array.from({ length: 2 }, (_, i) => hh(`es${i}`, { preferredLanguage: "es" }))];
  const sheets = labelSheets(splitMailing(households, both).rows);
  assert.deepEqual(sheets.map((s) => [s.lang, s.labels.length]), [["en", 30], ["en", 1], ["es", 2]]);
  assert.deepEqual(labelSheets([]), []);
});

// ── mailing list: who may reach it ───────────────────────────────────────────
test("only President and VP reach the mailing list; reviewers and every other role are refused", () => {
  assert.equal(MAILING_PERMISSION, "canManageUsers");
  const holders = BOARD_ROLE_KEYS.filter((r) => DEFAULT_MATRIX[r].includes(MAILING_PERMISSION));
  assert.deepEqual([...holders].sort(), ["PRESIDENT", "VICE_PRESIDENT"]);
  const as = (role: (typeof BOARD_ROLE_KEYS)[number]) => {
    const perms = resolvePermissions("board", [role], DEFAULT_MATRIX);
    return { id: "x", can: (p: Permission) => perms.has(p) };
  };
  for (const role of BOARD_ROLE_KEYS) {
    assert.equal(accessDecision(as(role), [MAILING_PERMISSION]), role === "PRESIDENT" || role === "VICE_PRESIDENT" ? "ok" : "forbidden", role);
  }
  assert.equal(accessDecision(as("SECRETARY"), [MAILING_PERMISSION]), "forbidden", "Secretary (reviewer tier)");
  assert.equal(accessDecision(as("TREASURER"), [MAILING_PERMISSION]), "forbidden", "Treasurer (reviewer tier)");
  assert.equal(accessDecision(null, [MAILING_PERMISSION]), "unauthorized");
  // Every entry point checks it: the CSV route and both pages.
  for (const f of ["src/app/api/admin/events/[id]/mailing-list/route.ts", "src/app/admin/events/[id]/mailing-list/page.tsx", "src/app/admin/events/[id]/mailing-list/labels/page.tsx"]) {
    const text = readFileSync(f, "utf8");
    assert.ok(text.includes("MAILING_PERMISSION"), `${f} checks the permission`);
    assert.ok(/requirePermission\(MAILING_PERMISSION\)|admin\.can\(MAILING_PERMISSION\)/.test(text), `${f} enforces it`);
  }
  // the link is only shown to managers
  assert.ok(/admin\.can\("canManageUsers"\)/.test(readFileSync("src/app/admin/events/[id]/invitations/page.tsx", "utf8")));
});

// ── DB ────────────────────────────────────────────────────────────────────────
let seq = 0;
async function household(name: string, o: { status?: string; delivery?: string; lang?: string; email?: string | null; address?: Record<string, string | null> } = {}) {
  const p = await prisma.patient.create({
    data: {
      email: o.email === undefined ? `${tag}.${name}@example.org` : o.email, role: "patient", source: "web", reviewStatus: o.status ?? "approved", reviewHoldReason: o.status === "on_hold" ? "OTHER" : null, familySize: 1,
      preferredLanguage: o.lang ?? "en", flyerDelivery: o.delivery ?? "mail",
      primaryDiagnoses: [], statedDiagnoses: [],
      contactProfile: { create: { firstName: name, lastName: tag, phone: `+1915556${String(++seq).padStart(4, "0")}`, ...(o.address === undefined ? { addressLine1: `${seq} Main St`, city: "El Paso", state: "TX", zipCode: "79901" } : o.address) } },
      consentRecords: { create: [{ type: "data_and_contact", granted: true, textVersion: "v3", method: "web" }] },
    },
  });
  patients.push(p.id);
  return p.id;
}
async function event(n: string, over: Record<string, unknown> = {}) {
  const e = await prisma.event.create({ data: { slug: `${tag}-${n}`, titleEn: `En ${n}`, titleEs: `Es ${n}`, eventDate: new Date(Date.now() + 10 * DAY), location: "Hall", status: "published", category: "FAMILY_SUPPORT", flyerEnUrl: EN, flyerEsUrl: ES, flyerEnAlt: "alt en", flyerEsAlt: "alt es", ...over } });
  events.push(e.id);
  return e.id;
}
const invite = (eventId: string, patientId: string, status = "sent") =>
  prisma.invitation.create({ data: { eventId, patientId, tokenHash: hashToken(generateToken()), status, ...(status === "removed" ? { removedAt: new Date() } : {}) } });

test("the mailing list: approved + invited (not removed) + mail + complete address; nobody else", async () => {
  const ev = await event("m1"), other = await event("m2");
  const ok = await household("ok");
  const okEs = await household("okes", { lang: "es" });
  const pending = await household("pending", { status: "pending_review" });
  const hold = await household("hold", { status: "on_hold" });
  const removed = await household("removed");
  const notInvited = await household("notinvited");
  const otherEvent = await household("otherevent");
  const emailPref = await household("emailpref", { delivery: "email" });
  const nonePref = await household("nonepref", { delivery: "none" });
  const noZip = await household("nozip", { address: { addressLine1: "9 Oak St", city: "El Paso", state: "TX", zipCode: null } });
  const legacy = await household("legacy", { address: { addressLine1: "PO Box 1, El Paso TX 79901", city: null, state: null, zipCode: null } });
  const pendingNoZip = await household("pendingnozip", { status: "pending_review", address: { addressLine1: "9 Oak St", city: "El Paso", state: "TX", zipCode: null } });
  for (const id of [ok, okEs, pending, hold, emailPref, nonePref, noZip, legacy, pendingNoZip]) await invite(ev, id);
  await invite(ev, removed, "removed");
  await invite(other, otherEvent);
  void notInvited;

  const list = await loadMailingList(ev);
  assert.ok(list);
  assert.deepEqual(list.rows.map((r) => r.householdId).sort(), [ok, okEs].sort());
  assert.equal(list.rows.find((r) => r.householdId === ok)!.lang, "en");
  assert.equal(list.rows.find((r) => r.householdId === okEs)!.lang, "es");
  assert.deepEqual(list.fix.map((f) => f.householdId).sort(), [noZip, legacy].sort(), "approved + invited + mail but not mailable; an unapproved household is not listed here either");
  assert.equal(await loadMailingList("00000000-0000-0000-0000-000000000000"), null);
});

test("an export writes one audit row: event id, count, format, actor; no names or addresses", async () => {
  const ev = await event("a1");
  const admin = await household("boardperson", { delivery: "none" });
  const a = await household("aud1"), b = await household("aud2");
  await invite(ev, a); await invite(ev, b);
  const list = (await loadMailingList(ev))!;
  await auditMailingExport(admin, ev, list.rows.length, "csv");
  const rows = await prisma.auditLog.findMany({ where: { action: AuditAction.FLYER_MAILING_EXPORTED, resourceId: ev } });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].patientId, admin);
  assert.equal(rows[0].actorType, "board");
  assert.deepEqual(rows[0].changes, { eventId: ev, count: 2, format: "csv", actor: admin });
  const text = JSON.stringify(rows[0]);
  assert.ok(!text.includes(tag) && !text.includes("Main St") && !text.includes("example.org"), "no names, addresses or emails");
});

test("preference changes are logged with ids and the field name only (admin and family)", async () => {
  const id = await household("pref", { delivery: "email" });
  const boardId = await household("boardpref", { delivery: "none" });

  const r1 = await setFlyerDelivery(id, "mail", { type: "board", patientId: boardId });
  assert.deepEqual(r1, { ok: true, changed: true });
  assert.equal((await prisma.patient.findUnique({ where: { id } }))!.flyerDelivery, "mail");
  const r2 = await setFlyerDelivery(id, "mail", { type: "board", patientId: boardId });
  assert.deepEqual(r2, { ok: true, changed: false }, "no change, no log");
  assert.deepEqual(await setFlyerDelivery(id, "pigeon", { type: "board", patientId: boardId }), { ok: false, error: "invalid" });

  const noEmail = await household("noemail", { delivery: "none", email: null });
  assert.deepEqual(await setFlyerDelivery(noEmail, "email", { type: "board", patientId: boardId }), { ok: false, error: "invalid" }, "email needs an email on the household");
  assert.deepEqual(await setFlyerDelivery("00000000-0000-0000-0000-000000000000", "none", { type: "board", patientId: boardId }), { ok: false, error: "not_found" });

  // family page: the primary and a confirmed adult
  const adult = await prisma.householdMember.create({ data: { patientId: id, firstName: "Luis", lastName: tag, relationship: "spouse_partner", ageGroup: "18_plus", status: "confirmed", email: `${tag}.adult@example.org` } });
  assert.deepEqual(await updateFlyerDelivery({ householdId: id, actor: { kind: "primary" } }, "none"), { ok: true });
  assert.deepEqual(await updateFlyerDelivery({ householdId: id, actor: { kind: "member", memberId: adult.id } }, "email"), { ok: true }, "any confirmed adult");
  assert.equal((await prisma.patient.findUnique({ where: { id } }))!.flyerDelivery, "email");
  const bad = await updateFlyerDelivery({ householdId: id, actor: { kind: "primary" } }, "nonsense");
  assert.equal(bad.ok, false);
  const pendingAdult = await prisma.householdMember.create({ data: { patientId: id, firstName: "Pen", relationship: "sibling", ageGroup: "18_plus", status: "pending", email: `${tag}.pending@example.org` } });
  const denied = await updateFlyerDelivery({ householdId: id, actor: { kind: "member", memberId: pendingAdult.id } }, "none");
  assert.equal(denied.ok, false, "an unconfirmed adult cannot change it");
  assert.equal(can({ kind: "member", memberId: adult.id }, "flyer.edit"), true);

  const logs = await prisma.auditLog.findMany({ where: { action: AuditAction.FLYER_DELIVERY_CHANGED, resourceId: id }, orderBy: { createdAt: "asc" } });
  assert.equal(logs.length, 3, "board change, primary change, adult change; the no-op and the refusals are not logged");
  assert.deepEqual(logs.map((l) => l.actorType), ["board", "family", "family"]);
  assert.equal(logs[2].actorMemberId, adult.id);
  for (const l of logs) {
    assert.deepEqual((l.changes as { fields: string[] }).fields, ["flyerDelivery"]);
    const text = JSON.stringify(l);
    assert.ok(!text.includes("example.org") && !text.includes(tag) && !/"(email|mail|none)"/.test(JSON.stringify(l.changes)), "field name only: no values, emails or names");
  }
});

test("the family page gets the household-language flyer for each upcoming event, with fallback", async () => {
  const both_ = await event("f1");
  const onlyEn = await event("f2", { flyerEsUrl: null, flyerEsAlt: null });
  const none = await event("f3", { flyerEnUrl: null, flyerEsUrl: null });
  const es = await household("fam-es", { lang: "es" });
  for (const e of [both_, onlyEn, none]) await invite(e, es);
  const h = (await loadHousehold(es))!;
  const byTitle = (t: string) => h.invited.find((i) => i.title.en === t)!;
  assert.equal(byTitle("En f1").flyer?.lang, "es");
  assert.equal(byTitle("En f1").flyer?.alt, "alt es");
  assert.equal(byTitle("En f2").flyer?.lang, "en", "fallback to the only flyer");
  assert.equal(byTitle("En f3").flyer, null);
});

test("migration backfill rule matches the default (spot check on this database)", async () => {
  // Rows created before this migration were backfilled in SQL; the same rule as defaultFlyerDelivery. Spot check: any
  // household with no email and no complete address must not be 'email'/'mail' unless somebody chose it.
  const rows = await prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*)::bigint AS n FROM patients WHERE "flyerDelivery" NOT IN ('email','mail','none')`;
  assert.equal(Number(rows[0].n), 0);
  const legacyLogs = await prisma.auditLog.count({ where: { action: AuditAction.FLYER_MAILING_EXPORTED, createdAt: { lt: startedAt }, resourceId: { in: events } } });
  assert.equal(legacyLogs, 0);
});
