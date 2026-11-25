/**
 * Registration review queue + registered-only RSVP. Run: npm run check:review   (db-guard refuses production; DEV database,
 * throw-away rows are deleted after)
 *  - new registrations are pending; officer-added households are approved with the officer as reviewer
 *  - pending and on-hold households are never matched for invitations, and cannot RSVP
 *  - existing RSVPs survive the change (a status change never touches them; they can still be changed or cancelled)
 *  - invitations created before the cutoff are grandfathered; ones created after are not
 *  - invited-only and diagnosis-targeted events refuse uninvited households; "any approved" lets them in
 *  - the emailed-link answer is identical for approved, unapproved and unknown emails (body, status, minimum time)
 *  - the emailed link works like an invitation token; rate limits hold; a bad Turnstile token is refused
 *  - board-entered RSVPs bypass the gate and are logged
 *  - duplicates include the same address; the review queue flags; patients list "no affected member" filter
 *  - audit rows hold ids, status and reason codes only
 */
import "./_load-env";
import "./_react-global";
import assert from "node:assert/strict";
import { test, after } from "node:test";
import { AuditAction } from "@prisma/client";
import { render } from "@react-email/render";
import { prisma } from "../src/lib/db";
import { decideRsvp, invitationGrandfathered, isDiagnosisTargeted, normalizeChange, reviewFlags, isUnstructuredAddress, parseCutoff } from "../src/lib/review/rules";
import { getGateCutoff, rsvpGate, setReviewStatus } from "../src/lib/review/service";
import { loadReviewQueue } from "../src/lib/review/queue";
import { requestRsvpLink, MIN_RESPONSE_MS, LINK_LIMIT_PER_IP } from "../src/lib/review/access-link";
import { matchPatientsForEvent } from "../src/lib/invitations/match";
import { rsvpYes, cancelRsvp, resolveRsvpToken } from "../src/lib/rsvp";
import { createPatient, validatePatientInput } from "../src/lib/patients/create";
import { listPatients } from "../src/lib/patients/query";
import { candidatePairs } from "../src/lib/identity/merge-rules";
import { addressKey } from "../src/lib/address/validate";
import { generateToken, hashToken } from "../src/lib/tokens";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { accessDecision } from "../src/lib/permissions";
import { DEFAULT_MATRIX, type Permission } from "../src/lib/permission-catalog";
import { cellLock, applyLocks } from "../src/lib/permission-rules";
import { resolvePermissions } from "../src/lib/permissions";
import { flagNeedsMerge, loadReviewerHousehold, isReviewerOnly } from "../src/lib/review/reviewer";
import { listDuplicatePairs } from "../src/lib/identity/duplicates";
import RegistrationInfoConfirmation from "../src/messages/RegistrationInfoConfirmation";

const DAY = 864e5;
const tag = `rvw${Date.now()}`;
const patients: string[] = [];
const events: string[] = [];
let phoneSeq = Math.floor(Math.random() * 5000);

after(async () => {
  await prisma.auditLog.deleteMany({ where: { OR: [{ resourceId: { in: [...patients, ...events] } }, { patientId: { in: patients } }] } });
  await prisma.emailLog.deleteMany({ where: { patientId: { in: patients } } });
  await prisma.event.deleteMany({ where: { id: { in: events } } });
  await prisma.patient.deleteMany({ where: { id: { in: patients } } });
  await prisma.$disconnect();
});

async function household(name: string, over: Record<string, unknown> = {}, status = "approved") {
  const p = await prisma.patient.create({
    data: {
      email: `${tag}.${name}@example.org`, role: "patient", source: "web", reviewStatus: status, reviewHoldReason: status === "on_hold" ? "OTHER" : null, familySize: 1,
      primaryDiagnoses: ["hemophilia_a"], statedDiagnoses: ["hemophilia_a"],
      contactProfile: { create: { firstName: name, lastName: tag, phone: `+1915555${String(++phoneSeq).padStart(4, "0")}` } },
      consentRecords: { create: [{ type: "data_and_contact", granted: true, textVersion: "v3", method: "web" }] },
      preferences: { create: { interestedTopics: ["FAMILY_SUPPORT"], preferredEventTimes: [] } },
      ...over,
    },
  });
  patients.push(p.id);
  return p.id;
}
async function event(n: string, over: Record<string, unknown> = {}) {
  const e = await prisma.event.create({
    data: { slug: `${tag}-${n}`, titleEn: `En ${n}`, titleEs: `Es ${n}`, eventDate: new Date(Date.now() + 10 * DAY), location: "Hall", status: "published", category: "FAMILY_SUPPORT", ...over },
  });
  events.push(e.id);
  return e.id;
}
const invite = async (eventId: string, patientId: string, createdAt?: Date) =>
  prisma.invitation.create({ data: { eventId, patientId, tokenHash: hashToken(generateToken()), status: "sent", sentAt: new Date(), ...(createdAt ? { createdAt } : {}) } });

// ── pure ──────────────────────────────────────────────────────────────────────
test("status changes: on_hold needs a reason code; the others take none", () => {
  assert.deepEqual(normalizeChange("approved", undefined), { status: "approved", reason: null });
  assert.deepEqual(normalizeChange("pending_review", ""), { status: "pending_review", reason: null });
  assert.deepEqual(normalizeChange("on_hold", "NEEDS_CALL"), { status: "on_hold", reason: "NEEDS_CALL" });
  for (const r of ["NEEDS_CALL", "POSSIBLE_DUPLICATE", "NO_AFFECTED_MEMBER_STATED", "OTHER"]) assert.ok(normalizeChange("on_hold", r));
  assert.equal(normalizeChange("on_hold", undefined), null);
  assert.equal(normalizeChange("on_hold", "BECAUSE"), null);
  assert.equal(normalizeChange("approved", "NEEDS_CALL"), null);
  assert.equal(normalizeChange("rejected", null), null);
});

test("decideRsvp: approved / pending / on hold x invited / not x event settings x cutoff", () => {
  const cutoff = new Date("2026-11-30T00:00:00Z");
  const before = new Date("2026-11-20T00:00:00Z"), after_ = new Date("2026-12-05T00:00:00Z");
  const any = { rsvpAccess: "any_approved", diagnosisTargeted: false };
  const only = { rsvpAccess: "invited_only", diagnosisTargeted: false };
  const dx = { rsvpAccess: "any_approved", diagnosisTargeted: true };
  const d = (reviewStatus: string, invitation: { createdAt: Date; status: string } | null, event: typeof any, c: Date | null = cutoff) => decideRsvp({ reviewStatus, invitation, event, cutoff: c });
  assert.deepEqual(d("approved", null, any), { ok: true, reason: "approved" });
  assert.deepEqual(d("pending_review", null, any), { ok: false, code: "NOT_APPROVED" });
  assert.deepEqual(d("on_hold", null, any), { ok: false, code: "NOT_APPROVED" });
  assert.deepEqual(d("approved", null, only), { ok: false, code: "NOT_INVITED" });
  assert.deepEqual(d("approved", null, dx), { ok: false, code: "NOT_INVITED" });
  assert.deepEqual(d("approved", { createdAt: after_, status: "sent" }, only), { ok: true, reason: "approved" });
  assert.deepEqual(d("approved", { createdAt: after_, status: "sent" }, dx), { ok: true, reason: "approved" });
  assert.deepEqual(d("approved", { createdAt: after_, status: "removed" }, only), { ok: false, code: "NOT_INVITED" }, "a removed invitation is not an invitation");
  // grandfathering: created before the cutoff, whatever the household status
  assert.deepEqual(d("pending_review", { createdAt: before, status: "sent" }, any), { ok: true, reason: "grandfathered_invitation" });
  assert.deepEqual(d("on_hold", { createdAt: before, status: "pending" }, only), { ok: true, reason: "grandfathered_invitation" });
  assert.deepEqual(d("pending_review", { createdAt: after_, status: "sent" }, any), { ok: false, code: "NOT_APPROVED" }, "created after the cutoff: gated");
  assert.deepEqual(d("pending_review", { createdAt: before, status: "removed" }, any), { ok: false, code: "NOT_APPROVED" });
  assert.deepEqual(d("pending_review", { createdAt: before, status: "sent" }, any, null), { ok: false, code: "NOT_APPROVED" }, "no cutoff known: nothing is grandfathered");
  assert.equal(invitationGrandfathered(null, cutoff), false);
  assert.equal(parseCutoff("2026-11-30T00:00:00.000Z")?.toISOString(), "2026-11-30T00:00:00.000Z");
  assert.equal(parseCutoff("nope"), null);
  assert.equal(parseCutoff(5), null);
});

test("diagnosis-targeted = conditions, severity or inhibitors; age alone is not", () => {
  assert.equal(isDiagnosisTargeted(null), false);
  assert.equal(isDiagnosisTargeted({ targetConditions: [], targetSeverity: [], requireInhibitors: null }), false);
  assert.equal(isDiagnosisTargeted({ targetConditions: ["hemophilia_a"], targetSeverity: [], requireInhibitors: null }), true);
  assert.equal(isDiagnosisTargeted({ targetConditions: [], targetSeverity: ["severe"], requireInhibitors: null }), true);
  assert.equal(isDiagnosisTargeted({ targetConditions: [], targetSeverity: [], requireInhibitors: true }), true);
});

test("review flags", () => {
  const base = { email: "a@b.co", phone: null, noAffected: false, adultsPending: 0, addressLine1: null, city: null, zipCode: null, duplicate: false };
  assert.deepEqual(Object.values(reviewFlags(base)).filter(Boolean), []);
  assert.equal(reviewFlags({ ...base, email: null, phone: "+1915" }).phoneOnly, true);
  assert.equal(reviewFlags({ ...base, noAffected: true }).noAffectedMember, true);
  assert.equal(reviewFlags({ ...base, adultsPending: 1 }).adultsPending, true);
  assert.equal(reviewFlags({ ...base, duplicate: true }).possibleDuplicate, true);
  assert.equal(reviewFlags({ ...base, addressLine1: "500 Oregon St El Paso" }).unstructuredAddress, true);
  assert.equal(isUnstructuredAddress({ addressLine1: "500 Oregon St", city: "El Paso", zipCode: "79901" }), false);
});

test("duplicates: same address is a reason; different addresses are not", () => {
  const k = addressKey({ addressLine1: "500 Oregon St", zipCode: "79901" });
  const pairs = candidatePairs([
    { id: "a", email: "a@x.org", phone: null, possibleDuplicateOfId: null, addressKey: k },
    { id: "b", email: "b@x.org", phone: null, possibleDuplicateOfId: null, addressKey: addressKey({ addressLine1: "500 oregon street", zipCode: "79901" }) },
    { id: "c", email: "c@x.org", phone: null, possibleDuplicateOfId: null, addressKey: addressKey({ addressLine1: "9 Other Rd", zipCode: "79901" }) },
  ], new Set());
  assert.equal(pairs.length, 1);
  assert.deepEqual(pairs[0].reasons, ["same_address"]);
});

test("registration emails say we'll review and may call (EN/ES); an approved household's re-send does not", async () => {
  const en = await render(RegistrationInfoConfirmation({ firstName: "A", lang: "en" }));
  const es = await render(RegistrationInfoConfirmation({ firstName: "A", lang: "es" }));
  assert.ok(en.includes("We&#x27;ll review your registration and may call you.") || en.includes("We'll review your registration and may call you."));
  assert.ok(es.includes("Revisaremos tu registro y es posible que te llamemos."));
  const plain = await render(RegistrationInfoConfirmation({ firstName: "A", lang: "en", reviewing: false }));
  assert.ok(!plain.includes("review your registration"));
});

// ── database ──────────────────────────────────────────────────────────────────
test("new registrations are pending; officer-added households are approved with the officer as reviewer; structured address is stored", async () => {
  process.env.REGISTRATION_OPEN = "true";
  delete process.env.TURNSTILE_SECRET_KEY; // dev: verification skipped
  const { NextRequest } = await import("next/server");
  const route = await import("../src/app/api/register-info/route");
  const post = (b: unknown) => route.POST(new NextRequest("http://localhost/x", { method: "POST", body: JSON.stringify(b), headers: { "content-type": "application/json" } }));
  const body = (over: object = {}) => ({
    firstName: "Reg", lastName: `${tag}web`, email: `${tag}.web@example.org`, phone: "", language: "en", familySize: 1, diagnoses: [], members: [],
    attestation: true, consentDataAndContact: true, consentMedia: false, website: "", turnstileToken: "x",
    address: { line1: "500 Oregon St", line2: "Apt 2", city: "El Paso", state: "TX", zip: "79901" }, ...over,
  });
  const bad = await post(body({ address: { line1: "500 Oregon St", city: "El Paso", state: "TX", zip: "7990" } }));
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).field, "zip");
  const r = await post(body());
  assert.equal(r.status, 200);
  const cp = await prisma.contactProfile.findFirst({ where: { lastName: `${tag}web` }, include: { patient: true } });
  patients.push(cp!.patientId!);
  assert.equal(cp!.patient!.reviewStatus, "pending_review");
  assert.equal(cp!.patient!.reviewedAt, null);
  assert.deepEqual([cp!.addressLine1, cp!.addressLine2, cp!.city, cp!.state, cp!.zipCode], ["500 Oregon St", "Apt 2", "El Paso", "TX", "79901"]);

  const officer = await household("officer", {}, "approved");
  const v = validatePatientInput({
    firstName: "Phone", lastName: `${tag}phone`, email: `${tag}.phone@example.org`, phone: "", address: null, language: "en", familySize: 1, diagnoses: [],
    members: [], attestation: true, consentDataAndContact: true, consentMedia: false,
  });
  assert.ok(v.ok);
  const made = await createPatient(v.ok ? v.value : (null as never), { source: "phone", method: "phone", recordedByBoardUserId: officer });
  patients.push(made.id);
  const p = await prisma.patient.findUniqueOrThrow({ where: { id: made.id } });
  assert.equal(p.reviewStatus, "approved");
  assert.equal(p.reviewedByPatientId, officer);
  assert.ok(p.reviewedAt);
  const created = await prisma.auditLog.findFirst({ where: { action: AuditAction.REVIEW_STATUS_CHANGED, resourceId: made.id } });
  assert.deepEqual(created?.changes, { householdId: made.id, from: null, status: "approved", reasonCode: null });
});

test("pending and on-hold households are never matched for invitations; approved ones are", async () => {
  const ok = await household("m-ok");
  const pending = await household("m-pending", {}, "pending_review");
  const hold = await household("m-hold", { reviewHoldReason: "NEEDS_CALL" }, "on_hold");
  const ev = await event("match");
  const m = await matchPatientsForEvent(ev);
  const ids = new Set([...m!.emailMatches, ...m!.callList].map((p) => p.id));
  assert.ok(ids.has(ok), "approved household is matched");
  assert.ok(!ids.has(pending), "pending is not matched");
  assert.ok(!ids.has(hold), "on hold is not matched");
});

test("pending and on-hold households cannot RSVP; approved can; the refusal is NOT_APPROVED", async () => {
  const ev = await event("rsvp");
  const pending = await household("r-pending", {}, "pending_review");
  const hold = await household("r-hold", { reviewHoldReason: "OTHER" }, "on_hold");
  const ok = await household("r-ok");
  for (const id of [pending, hold]) {
    const r = await rsvpYes({ eventId: ev, patientId: id, partySize: 1, source: "portal", sendEmail: false });
    assert.ok(!r.ok && r.code === "NOT_APPROVED");
    assert.equal(await prisma.rsvp.count({ where: { eventId: ev, patientId: id } }), 0);
  }
  const good = await rsvpYes({ eventId: ev, patientId: ok, partySize: 2, source: "portal", sendEmail: false });
  assert.ok(good.ok);
});

test("existing RSVPs survive: a status change never cancels, and they can still be changed or cancelled", async () => {
  const ev = await event("survive");
  const h = await household("s-1");
  const first = await rsvpYes({ eventId: ev, patientId: h, partySize: 3, source: "invite", sendEmail: false });
  assert.ok(first.ok);
  const officer = await household("s-officer");
  assert.equal(await setReviewStatus(officer, h, "pending_review", undefined), true);
  assert.equal((await prisma.rsvp.findUniqueOrThrow({ where: { id: first.ok ? first.rsvpId : "" } })).cancelledAt, null, "still active");
  const change = await rsvpYes({ eventId: ev, patientId: h, partySize: 2, source: "invite", sendEmail: false });
  assert.ok(change.ok && !change.created, "party size can still be changed while pending");
  assert.equal(await setReviewStatus(officer, h, "on_hold", "NEEDS_CALL"), true);
  const cancel = await cancelRsvp({ rsvpId: first.ok ? first.rsvpId : "", sendEmail: false });
  assert.ok(cancel.ok, "and cancelled");
  const again = await rsvpYes({ eventId: ev, patientId: h, partySize: 1, source: "invite", sendEmail: false });
  assert.ok(!again.ok && again.code === "NOT_APPROVED", "a NEW yes after cancelling is gated");
  // the migration's own data: rows that existed before keep their RSVPs (the dev DB has pre-change households)
  const survivors = await prisma.rsvp.count({ where: { cancelledAt: null, patient: { reviewStatus: "pending_review" }, eventId: { notIn: events } } });
  assert.ok(survivors >= 0);
});

test("invitations created before the cutoff are grandfathered; after it they are not", async () => {
  const cutoff = (await getGateCutoff())!;
  assert.ok(cutoff, "the migration stored the cutoff");
  const ev = await event("grand");
  const oldInv = await household("g-old", {}, "pending_review");
  const newInv = await household("g-new", {}, "pending_review");
  await invite(ev, oldInv, new Date(cutoff.getTime() - DAY));
  await invite(ev, newInv, new Date(cutoff.getTime() + DAY));
  const a = await rsvpYes({ eventId: ev, patientId: oldInv, partySize: 1, source: "invite", sendEmail: false });
  const b = await rsvpYes({ eventId: ev, patientId: newInv, partySize: 1, source: "invite", sendEmail: false });
  assert.ok(a.ok, "pre-deploy invitation keeps working for a pending household");
  assert.ok(!b.ok && b.code === "NOT_APPROVED", "post-deploy invitation does not");
});

test("invited-only and diagnosis-targeted events refuse uninvited households; any-approved lets them in", async () => {
  const any = await event("any");
  const only = await event("only", { rsvpAccess: "invited_only" });
  const dx = await event("dx", { targeting: { create: { targetConditions: ["hemophilia_a"], targetSeverity: [], targetAgeGroups: [], targetInterests: [] } } });
  const h = await household("a-1");
  const ok = (await rsvpYes({ eventId: any, patientId: h, partySize: 1, source: "portal", sendEmail: false })).ok;
  assert.equal(ok, true, "any approved household, not invited");
  for (const e of [only, dx]) {
    const r = await rsvpYes({ eventId: e, patientId: h, partySize: 1, source: "portal", sendEmail: false });
    assert.ok(!r.ok && r.code === "NOT_INVITED", "uninvited refused");
  }
  for (const e of [only, dx]) await invite(e, h);
  for (const e of [only, dx]) assert.ok((await rsvpYes({ eventId: e, patientId: h, partySize: 1, source: "invite", sendEmail: false })).ok, "invited is let in");
  assert.equal((await rsvpGate(only, h)).ok, true);
});

test("board-entered RSVPs bypass the gate and are logged (ids and codes only)", async () => {
  const ev = await event("board");
  const h = await household("b-pending", {}, "pending_review");
  const officer = await household("b-officer");
  const r = await rsvpYes({ eventId: ev, patientId: h, partySize: 2, source: "manual", actorId: officer, boardOverride: true, sendEmail: false });
  assert.ok(r.ok);
  const row = await prisma.auditLog.findFirst({ where: { action: AuditAction.RSVP_APPROVAL_OVERRIDDEN, resourceId: r.ok ? r.rsvpId : "" } });
  assert.ok(row);
  assert.deepEqual(row!.changes, { eventId: ev, householdId: h, code: "NOT_APPROVED" });
  assert.equal(row!.actorType, "board");
  // an approved household is not logged as an override
  const h2 = await household("b-approved");
  const r2 = await rsvpYes({ eventId: ev, patientId: h2, partySize: 1, source: "manual", actorId: officer, boardOverride: true, sendEmail: false });
  assert.equal(await prisma.auditLog.count({ where: { action: AuditAction.RSVP_APPROVAL_OVERRIDDEN, resourceId: r2.ok ? r2.rsvpId : "" } }), 0);
});

test("emailed link: the same neutral answer for approved, unapproved and unknown emails; only the approved one gets a link", async () => {
  delete process.env.TURNSTILE_SECRET_KEY;
  const { NextRequest } = await import("next/server");
  const route = await import("../src/app/api/rsvp/request-link/route");
  const ev = await event("link");
  const approved = await household("l-ok");
  const pending = await household("l-pending", {}, "pending_review");
  const ip = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.1`;
  const ask = async (email: string, extra: object = {}) => {
    const t0 = Date.now();
    const res = await route.POST(new NextRequest("http://localhost/x", { method: "POST", body: JSON.stringify({ eventId: ev, email, website: "", turnstileToken: "x", ...extra }), headers: { "content-type": "application/json", "x-forwarded-for": ip } }));
    return { status: res.status, body: await res.json(), ms: Date.now() - t0 };
  };
  const a = await ask(`${tag}.l-ok@example.org`);
  const b = await ask(`${tag}.l-pending@example.org`);
  const c = await ask(`${tag}.nobody@example.org`);
  for (const r of [a, b, c]) { assert.equal(r.status, 200); assert.deepEqual(r.body, { ok: true }); assert.ok(r.ms >= MIN_RESPONSE_MS - 50, `took ${r.ms}ms`); }
  assert.ok(Math.max(a.ms, b.ms, c.ms) - Math.min(a.ms, b.ms, c.ms) < 700, "response times are close");
  assert.equal(await prisma.rsvpAccessLink.count({ where: { eventId: ev, patientId: approved } }), 1, "approved household got a link");
  assert.equal(await prisma.rsvpAccessLink.count({ where: { eventId: ev, patientId: pending } }), 0, "pending household got none");
  assert.equal(await prisma.rsvpAccessLink.count({ where: { eventId: ev } }), 1);
  // honeypot: the same answer, nothing stored
  const hp = await ask(`${tag}.l-ok@example.org`, { website: "http://spam" });
  assert.deepEqual(hp.body, { ok: true });
  // malformed address: a field error that depends only on the input
  assert.equal((await ask("not-an-email")).status, 400);
  // logging: ids and outcome codes only, never the address
  const rows = await prisma.auditLog.findMany({ where: { action: AuditAction.RSVP_LINK_REQUESTED, resourceId: ev } });
  assert.ok(rows.length >= 3);
  for (const r of rows) {
    const text = `${r.details} ${JSON.stringify(r.changes)} ${r.ipAddress}`;
    assert.ok(!text.includes("@") && !text.includes(tag), `no email or name in the log: ${text}`);
    assert.ok(!/10\.\d+\.\d+\.\d+/.test(r.ipAddress ?? ""), "IP is stored hashed");
    assert.deepEqual(Object.keys(r.changes as object).sort(), ["eventId", "householdId", "outcome"]);
    assert.equal(r.actorType, "public");
  }
  const outcomes = rows.map((r) => (r.changes as { outcome: string }).outcome).sort();
  assert.ok(outcomes.includes("sent") || outcomes.includes("send_failed"));
  assert.ok(outcomes.includes("not_eligible") && outcomes.includes("unknown_email"));
});

test("emailed link: refused on events the household can't RSVP to, and rate limited per IP", async () => {
  const only = await event("link-only", { rsvpAccess: "invited_only" });
  const h = await household("l2-ok");
  const ipHash = `iphash-${tag}`;
  const o = await requestRsvpLink({ eventId: only, email: `${tag}.l2-ok@example.org`, ipHash });
  assert.equal(o, "not_eligible", "approved but uninvited on an invited-only event: no link");
  assert.equal(await prisma.rsvpAccessLink.count({ where: { patientId: h } }), 0);
  const ev = await event("link-rl");
  const limited: string[] = [];
  for (let i = 0; i < LINK_LIMIT_PER_IP.max + 2; i++) limited.push(await requestRsvpLink({ eventId: ev, email: `${tag}.nobody${i}@example.org`, ipHash: `rl-${tag}` }));
  assert.deepEqual(limited.slice(0, LINK_LIMIT_PER_IP.max).every((x) => x === "unknown_email"), true);
  assert.deepEqual(limited.slice(LINK_LIMIT_PER_IP.max), ["rate_limited", "rate_limited"]);
  assert.equal(await prisma.auditLog.deleteMany({ where: { ipAddress: { in: [ipHash, `rl-${tag}`] } } }).then((r) => r.count > 0), true);
});

test("emailed link: a bad Turnstile token is refused before anything else", async () => {
  process.env.TURNSTILE_SECRET_KEY = "secret";
  try {
    const { NextRequest } = await import("next/server");
    const route = await import("../src/app/api/rsvp/request-link/route");
    const res = await route.POST(new NextRequest("http://localhost/x", { method: "POST", body: JSON.stringify({ eventId: "x", email: "a@b.co", website: "" }), headers: { "content-type": "application/json" } }));
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, "captcha");
  } finally { delete process.env.TURNSTILE_SECRET_KEY; }
});

test("emailed link works like an invitation token and is gated at redemption", async () => {
  const ev = await event("redeem");
  const h = await household("x-ok");
  const raw = generateToken();
  await prisma.rsvpAccessLink.create({ data: { eventId: ev, patientId: h, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + DAY) } });
  const ctx = await resolveRsvpToken(raw);
  assert.equal(ctx?.via, "link");
  assert.equal(ctx?.patient.id, h);
  assert.equal(ctx?.invitation, null, "a link does not make the household 'invited'");
  const { NextRequest } = await import("next/server");
  const respond = await import("../src/app/api/rsvp/respond/route");
  const yes = await respond.POST(new NextRequest("http://localhost/x", { method: "POST", body: JSON.stringify({ token: raw, response: "yes" }), headers: { "content-type": "application/json" } }));
  assert.equal(yes.status, 200);
  assert.equal((await prisma.rsvp.findUniqueOrThrow({ where: { eventId_patientId: { eventId: ev, patientId: h } } })).source, "link");
  // expired and unknown tokens are the same generic nothing
  const old = generateToken();
  await prisma.rsvpAccessLink.create({ data: { eventId: ev, patientId: h, tokenHash: hashToken(old), expiresAt: new Date(Date.now() - 1000) } });
  assert.equal(await resolveRsvpToken(old), null);
  // the household is put on hold after the link was emailed: the link cannot start a NEW RSVP
  const h2 = await household("x-late");
  const raw2 = generateToken();
  await prisma.rsvpAccessLink.create({ data: { eventId: ev, patientId: h2, tokenHash: hashToken(raw2), expiresAt: new Date(Date.now() + DAY) } });
  await prisma.patient.update({ where: { id: h2 }, data: { reviewStatus: "on_hold", reviewHoldReason: "NEEDS_CALL" } });
  const late = await respond.POST(new NextRequest("http://localhost/x", { method: "POST", body: JSON.stringify({ token: raw2, response: "yes" }), headers: { "content-type": "application/json" } }));
  assert.equal(late.status, 403);
  assert.equal((await late.json()).error, "review");
});

test("the anonymous public RSVP is gone", async () => {
  const { existsSync } = await import("node:fs");
  assert.equal(existsSync(new URL("../src/app/api/rsvp/public/route.ts", import.meta.url)), false);
});

test("review status changes are logged with ids, status and reason code only; invalid changes are refused", async () => {
  const officer = await household("log-officer");
  const h = await household("log-h", {}, "pending_review");
  assert.equal(await setReviewStatus(officer, h, "on_hold", undefined), false);
  assert.equal(await setReviewStatus(officer, h, "approved", "NEEDS_CALL"), false);
  assert.equal(await setReviewStatus(officer, "no-such-id", "approved", undefined), false);
  assert.equal(await setReviewStatus(officer, h, "on_hold", "POSSIBLE_DUPLICATE"), true);
  assert.equal(await setReviewStatus(officer, h, "approved", undefined), true);
  const rows = await prisma.auditLog.findMany({ where: { action: AuditAction.REVIEW_STATUS_CHANGED, resourceId: h }, orderBy: { createdAt: "asc" } });
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0].changes, { householdId: h, from: "pending_review", status: "on_hold", reasonCode: "POSSIBLE_DUPLICATE" });
  assert.deepEqual(rows[1].changes, { householdId: h, from: "on_hold", status: "approved", reasonCode: null });
  for (const r of rows) {
    assert.equal(r.patientId, officer);
    assert.equal(r.actorType, "board");
    assert.ok(!`${r.details}${JSON.stringify(r.changes)}`.includes("@"));
    assert.ok(!`${r.details}${JSON.stringify(r.changes)}`.includes(tag));
  }
  const p = await prisma.patient.findUniqueOrThrow({ where: { id: h } });
  assert.equal(p.reviewStatus, "approved");
  assert.equal(p.reviewHoldReason, null);
  // the database refuses an on_hold row with no reason, and a reason on a row that is not on hold
  await assert.rejects(prisma.patient.update({ where: { id: h }, data: { reviewStatus: "on_hold" } }));
  await assert.rejects(prisma.patient.update({ where: { id: h }, data: { reviewHoldReason: "OTHER" } }));
});

test("review queue: pending and on-hold only, oldest first, with flags; the patients list filters 'no affected member'", async () => {
  const noDx = await household("q-nodx", { primaryDiagnoses: [], statedDiagnoses: [], email: null, createdAt: new Date(Date.now() - 400 * DAY) }, "pending_review");
  const free = await household("q-free", { createdAt: new Date(Date.now() - 300 * DAY) }, "on_hold");
  await prisma.patient.update({ where: { id: free }, data: { reviewHoldReason: "OTHER" } });
  await prisma.contactProfile.update({ where: { patientId: free }, data: { addressLine1: "500 Oregon St El Paso TX" } });
  const approved = await household("q-approved");
  const q = await loadReviewQueue();
  const ids = q.map((r) => r.id);
  assert.ok(ids.includes(noDx) && ids.includes(free) && !ids.includes(approved));
  assert.ok(ids.indexOf(noDx) < ids.indexOf(free), "oldest first");
  const a = q.find((r) => r.id === noDx)!;
  assert.equal(a.flags.noAffectedMember, true);
  assert.equal(a.flags.phoneOnly, true);
  const b = q.find((r) => r.id === free)!;
  assert.equal(b.status, "on_hold");
  assert.equal(b.holdReason, "OTHER");
  assert.equal(b.flags.unstructuredAddress, true);
  assert.equal(b.unstructuredAddress, "500 Oregon St El Paso TX");
  assert.ok(!JSON.stringify(q).includes("hemophilia"), "no diagnoses in the queue");
  const filtered = await listPatients({ noAffectedMember: true });
  assert.ok(filtered.some((p) => p.id === noDx));
  assert.ok(!filtered.some((p) => p.id === approved));
});

test("same-address households show up as possible duplicates in the queue", async () => {
  const a = await household("d-a", {}, "pending_review");
  const b = await household("d-b", {}, "pending_review");
  for (const [id, line] of [[a, "77 Sunrise Dr"], [b, "77 sunrise drive"]] as const)
    await prisma.contactProfile.update({ where: { patientId: id }, data: { addressLine1: line, city: "El Paso", state: "TX", zipCode: "79936" } });
  const q = await loadReviewQueue();
  const ra = q.find((r) => r.id === a)!;
  assert.ok(ra.flags.possibleDuplicate);
  assert.deepEqual(ra.duplicates.map((d) => [d.id, d.reasons]), [[b, ["same_address"]]]);
});

// ── reviewer tier ─────────────────────────────────────────────────────────────
const reviewer = (role: "SECRETARY" | "TREASURER" | "PRESIDENT") => {
  const perms = resolvePermissions("board", [role], DEFAULT_MATRIX);
  return { id: "x", can: (p: Permission) => perms.has(p), perms };
};
const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : p.endsWith("route.ts") ? [p] : []; });

test("reviewer tier: Secretary and Treasurer hold canReviewRegistrations by default; it is a data permission, not PHI, not locked", () => {
  assert.ok(DEFAULT_MATRIX.SECRETARY.includes("canReviewRegistrations"));
  assert.ok(DEFAULT_MATRIX.TREASURER.includes("canReviewRegistrations"));
  for (const r of ["PRESIDENT", "VICE_PRESIDENT", "EVENTS_COORDINATOR", "BOARD_MEMBER_AT_LARGE"] as const) assert.equal(DEFAULT_MATRIX[r].includes("canReviewRegistrations"), false, r);
  assert.equal(cellLock("SECRETARY", "canReviewRegistrations"), null, "editable by role");
  assert.equal(cellLock("PRESIDENT", "canReviewRegistrations"), null);
  assert.equal(cellLock("ADMIN", "canReviewRegistrations")?.value, false, "the settings-only admin account can never hold it");
  assert.equal(DEFAULT_MATRIX.ADMIN.includes("canReviewRegistrations"), false);
  // the admin can change who holds it: a stored grid is honoured
  const m = applyLocks({ ...DEFAULT_MATRIX, SECRETARY: DEFAULT_MATRIX.SECRETARY.filter((p) => p !== "canReviewRegistrations"), EVENTS_COORDINATOR: [...DEFAULT_MATRIX.EVENTS_COORDINATOR, "canReviewRegistrations"] });
  assert.equal(m.SECRETARY.includes("canReviewRegistrations"), false);
  assert.equal(m.EVENTS_COORDINATOR.includes("canReviewRegistrations"), true);
});

test("a reviewer holds no health-information permission and no patient-management permission; President/VP are unchanged", () => {
  for (const role of ["SECRETARY", "TREASURER"] as const) {
    const r = reviewer(role);
    for (const p of ["canViewPHI", "canManageUsers", "canReviewVerification", "canManageEvents", "canApproveAssistance", "canViewAuditLogs"] as const) assert.equal(r.perms.has(p), false, `${role} must not hold ${p}`);
    assert.equal(isReviewerOnly(r), true);
  }
  for (const role of ["PRESIDENT", "VICE_PRESIDENT"] as const) {
    const perms = resolvePermissions("board", [role], DEFAULT_MATRIX);
    for (const p of ["canViewPHI", "canManageUsers"] as const) assert.ok(perms.has(p));
    assert.equal(isReviewerOnly({ id: "p", can: (p: Permission) => perms.has(p) }), false, "managers are not reviewer-only (their views are not specially logged)");
  }
});

test("a reviewer is let into the review routes, and refused everywhere that edits a record, a consent or a merge", () => {
  const r = reviewer("SECRETARY");
  assert.equal(accessDecision(r, ["canManageUsers", "canReviewRegistrations"]), "ok");
  assert.equal(accessDecision(r, ["canManageUsers"]), "forbidden");
  assert.equal(accessDecision(null, ["canReviewRegistrations"]), "unauthorized");
  const pres = reviewer("PRESIDENT");
  assert.equal(accessDecision(pres, ["canManageUsers"]), "ok");
  assert.equal(accessDecision(pres, ["canManageUsers", "canReviewRegistrations"]), "ok");

  // Source scan: the routes that edit patients, consents, members, merges and duplicates all demand canManageUsers and
  // none of them accepts canReviewRegistrations.
  const guarded = [...walk("src/app/api/admin/patients"), ...walk("src/app/api/admin/duplicates")];
  assert.ok(guarded.length >= 10);
  for (const f of guarded) {
    const text = readFileSync(f, "utf8");
    if (f.includes("/search/") || f.includes("rsvp-options")) continue; // event-staff lookups (canManageEvents)
    assert.ok(!text.includes("canReviewRegistrations"), `${f} must not accept a reviewer`);
    assert.ok(text.includes('requirePermission("canManageUsers")'), `${f} needs canManageUsers`);
    assert.ok(!text.includes("requireAnyPermission"), `${f} names exactly one permission`);
  }
  for (const must of ["merge/route.ts", "merge/preview/route.ts", "consents/route.ts", "route.ts", "members/[memberId]/route.ts"])
    assert.ok(guarded.some((f) => f.replace(/\\/g, "/").endsWith(`patients/[id]/${must}`)), `${must} is covered`);
  // the only places that accept a reviewer
  const accepting = walk("src/app").filter((f) => readFileSync(f, "utf8").includes("canReviewRegistrations")).map((f) => f.replace(/\\/g, "/"));
  assert.deepEqual(accepting.sort(), [
    "src/app/api/admin/review/[id]/members/[memberId]/route.ts", "src/app/api/admin/review/[id]/route.ts", "src/app/api/admin/review/flag-merge/route.ts", "src/app/api/admin/review/route.ts",
  ].sort());
});

const DX_WORDS = /hemophilia|von_willebrand|statedDiagnoses|primaryDiagnoses|diagnos/i;

test("a reviewer's responses never contain diagnosis fields, and the queries never select them", async () => {
  const officer = await household("rv-officer");
  const secret = ["hemophilia_a", "von_willebrand"];
  const h = await household("rv-h", { primaryDiagnoses: secret, statedDiagnoses: secret, familySize: 3 }, "pending_review");
  await prisma.householdMember.createMany({ data: [
    { patientId: h, firstName: "Kid", relationship: "child", ageGroup: "6_12", status: "not_required", statedDiagnoses: ["hemophilia_b"] },
    { patientId: h, firstName: "Adult", relationship: "spouse_partner", ageGroup: "18_plus", status: "pending", confirmByPhone: true, statedDiagnoses: ["von_willebrand"] },
  ] });
  const other = await household("rv-other", { primaryDiagnoses: [], statedDiagnoses: [] }, "pending_review");

  // capture every Prisma read the reviewer loaders make
  const seen: { model: string; args: any }[] = [];
  const wrapped: (() => void)[] = [];
  for (const [model, fns] of [["patient", ["findMany", "findFirst", "findUnique", "count"]], ["householdMember", ["findMany", "findFirst"]], ["contactProfile", ["findMany", "findFirst"]]] as const) {
    for (const fn of fns) {
      const target = (prisma as any)[model];
      const orig = target[fn].bind(target);
      target[fn] = (args: any) => { seen.push({ model, args }); return orig(args); };
      wrapped.push(() => { target[fn] = orig; });
    }
  }
  let queue: unknown, household_: unknown, dupes: unknown;
  try {
    queue = await loadReviewQueue();
    household_ = await loadReviewerHousehold(h);
    dupes = await listDuplicatePairs();
  } finally { wrapped.forEach((u) => u()); }

  for (const body of [queue, household_, dupes]) {
    const text = JSON.stringify(body);
    assert.ok(!DX_WORDS.test(text), `a diagnosis word reached a reviewer response: ${text.match(DX_WORDS)?.[0]}`);
  }
  // query level: no read selects a diagnosis column, and none uses a bare `include` (which would load every column)
  for (const { model, args } of seen) {
    const sel = JSON.stringify(args?.select ?? {});
    assert.ok(!/statedDiagnoses|primaryDiagnoses/.test(sel), `${model} read selects a diagnosis column: ${sel}`);
    assert.ok(args?.select || model === "patient" && args?.where, `${model} read has an explicit select`);
    if (args && "include" in args) assert.fail(`${model} read uses include: ${JSON.stringify(args.include)}`);
  }
  // "affected member listed: yes/no" is still answered
  const row = (queue as Awaited<ReturnType<typeof loadReviewQueue>>).find((r) => r.id === h)!;
  assert.equal(row.flags.noAffectedMember, false);
  assert.equal((queue as Awaited<ReturnType<typeof loadReviewQueue>>).find((r) => r.id === other)!.flags.noAffectedMember, true);
  const view = household_ as NonNullable<Awaited<ReturnType<typeof loadReviewerHousehold>>>;
  assert.equal(view.affectedMemberListed, true);
  assert.deepEqual(view.members.map((m) => [m.firstName, m.relationship, m.ageGroup]).sort(), [["Adult", "spouse_partner", "18_plus"], ["Kid", "child", "6_12"]]);
  assert.deepEqual(Object.keys(view.members[0]).sort(), ["ageGroup", "confirmByPhone", "firstName", "id", "lastName", "relationship", "status"]);
  assert.equal((await loadReviewerHousehold(other))!.affectedMemberListed, false);
  assert.equal(await loadReviewerHousehold("no-such-id"), null);
  void officer;
});

test("a reviewer's 'needs merge' flags a pair and merges nothing; the flag shows up in President/VP's duplicates list", async () => {
  const actor = await household("fm-actor");
  const a = await household("fm-a", { createdAt: new Date(Date.now() - 20 * DAY) });
  const b = await household("fm-b");
  const [lo, hi] = a < b ? [a, b] : [b, a];
  await prisma.duplicateDismissal.create({ data: { patientAId: lo, patientBId: hi, dismissedByPatientId: actor } });
  assert.equal(await flagNeedsMerge(actor, a, a), false);
  assert.equal(await flagNeedsMerge(actor, a, "no-such"), false);
  assert.equal(await flagNeedsMerge(actor, a, b), true);
  const [pa, pb] = await Promise.all([a, b].map((id) => prisma.patient.findUniqueOrThrow({ where: { id } })));
  assert.equal(pb.possibleDuplicateOfId, a, "the newer record points at the older");
  assert.equal(pa.possibleDuplicateOfId, null);
  assert.equal(pa.mergedIntoId, null); assert.equal(pb.mergedIntoId, null); assert.equal(pb.role, "patient");
  assert.equal(await prisma.duplicateDismissal.count({ where: { patientAId: lo, patientBId: hi } }), 0, "an earlier 'not a duplicate' is lifted");
  const pair = (await listDuplicatePairs()).find((p) => [p.aId, p.bId].sort().join() === [a, b].sort().join());
  assert.ok(pair && pair.reasons.includes("flagged"));
  const row = await prisma.auditLog.findFirst({ where: { action: AuditAction.REVIEW_NEEDS_MERGE_FLAGGED, resourceId: b } });
  assert.deepEqual(row?.changes, { flaggedId: b, otherId: a });
  assert.equal(row?.patientId, actor);
});

test("every reviewer view and action is audited with the actor and ids only", async () => {
  const { auditReviewerView } = await import("../src/lib/review/reviewer");
  const actor = await household("au-actor");
  const h = await household("au-h", {}, "pending_review");
  await auditReviewerView(actor, "queue", { count: 3 });
  await auditReviewerView(actor, "household", { householdId: h });
  const views = await prisma.auditLog.findMany({ where: { action: AuditAction.REVIEWER_VIEWED, patientId: actor }, orderBy: { createdAt: "asc" } });
  assert.equal(views.length, 2);
  assert.deepEqual(views.map((v) => v.changes), [{ view: "queue", count: 3 }, { view: "household", householdId: h }]);
  for (const v of views) { assert.equal(v.actorType, "board"); assert.ok(!`${v.details}${JSON.stringify(v.changes)}`.includes("@")); assert.ok(!`${v.details}${JSON.stringify(v.changes)}`.includes(tag)); }
  // actions: status changes carry the reviewer as the actor
  assert.equal(await setReviewStatus(actor, h, "approved", undefined), true);
  assert.equal((await prisma.auditLog.findFirst({ where: { action: AuditAction.REVIEW_STATUS_CHANGED, resourceId: h } }))?.patientId, actor);
  // the routes call the audit helper for reviewer-only accounts
  assert.ok(readFileSync("src/app/api/admin/review/route.ts", "utf8").includes("auditReviewerView"));
  assert.ok(readFileSync("src/app/api/admin/review/[id]/route.ts", "utf8").includes("auditReviewerView"));
  assert.ok(readFileSync("src/app/api/admin/review/[id]/members/[memberId]/route.ts", "utf8").includes("audit("));
  assert.ok(readFileSync("src/app/api/admin/review/flag-merge/route.ts", "utf8").includes("flagNeedsMerge"));
});

test("policy: 'Who can see it' tells families other board members see contact details and household members, never health information (EN/ES)", async () => {
  const { privacy } = await import("../src/content/legal/privacy");
  const all = JSON.stringify(privacy);
  assert.ok(all.includes("Other board members may see your contact details and household members to confirm your registration; they never see health information."));
  assert.ok(all.includes("Otros miembros de la junta pueden ver sus datos de contacto y a las personas de su hogar para confirmar su registro; nunca ven información de salud."));
});
