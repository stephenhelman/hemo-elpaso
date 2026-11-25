/**
 * RSVP requests, in-person / virtual attendance, call list, contact preferences. Run: npm run check:rsvp-requests
 * (db-guard refuses production; DEV database, throw-away rows are deleted after; emails are captured, never sent)
 *  - invited + approved households RSVP instantly; uninvited ones create a request
 *  - registering from the modal creates a request that waits on household review and moves to pending on approval
 *  - in-person confirmation is blocked at capacity (confirmed in-person spots only); a full event can waitlist
 *  - virtual confirmation is blocked unless the event's virtual option AND the recordings toggle are on
 *  - confirming creates exactly one invitation and one RSVP with the right attendance type and origin
 *  - virtual links never appear on public pages or in in-person emails; the decline email names no reason
 *  - the call list shows only households with no email; calls are logged with codes only
 *  - "also send to" adds only confirmed adults; every action is logged with ids only
 *  - the modal flows render in both languages
 */
import "./_load-env";
import "./_react-global";
import assert from "node:assert/strict";
import { test, after } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { render } from "@react-email/render";
import { prisma } from "../src/lib/db";
import { emailOutbox } from "../src/lib/email/send";
import { rsvpOrRequest, confirmRequest, declineRequest, waitlistRequest, withdrawRequest, promoteWaitingRequests, createRegistrationRequest, setInvitationAttendance } from "../src/lib/rsvp/requests";
import { decideRsvpPath, confirmBlock, mayResubmit, requestWindowOpen, DECLINE_REASONS, CALL_OUTCOMES } from "../src/lib/rsvp/request-rules";
import { eventRequestSettings } from "../src/lib/rsvp/event-settings";
import { eventCallList, logCall } from "../src/lib/rsvp/call-list";
import { setReviewStatus } from "../src/lib/review/service";
import { alsoSendRecipients, pickAlsoSendIds } from "../src/lib/households/also-send";
import { setAlsoSendTo, setPhoneCanText } from "../src/lib/households/contact-prefs";
import { sendInvitations } from "../src/lib/invitations/send";
import { sendRsvpEmail, sendRequestEmail } from "../src/lib/rsvp/emails";
import { publicEventSelect } from "../src/lib/events/public-select";
import { validatePatientInput } from "../src/lib/patients/create";
import { generateToken, hashToken } from "../src/lib/tokens";
import RsvpRequestEmail from "../src/messages/RsvpRequestEmail";
import RsvpEmail from "../src/messages/RsvpEmail";
import EventInvitation from "../src/messages/EventInvitation";
import RsvpModal from "../src/components/rsvp/RsvpModal";
import { rsvpModalTranslation } from "../src/translation/rsvpModal";
import { rsvpPageTranslation } from "../src/translation/rsvpPage";
import type { EventRsvpView } from "../src/lib/review/event-view";

const tag = `req${Date.now()}`;
const MEET = "https://meet.google.com/abc-defg-hij";
const YT = "https://www.youtube.com/watch?v=test1234";
const patients: string[] = [];
const events: string[] = [];
const startedAt = new Date();
// Emails are CAPTURED (EMAIL_MODE=capture is forced by _load-env): `sent` IS the in-memory outbox, cleared with `sent.length = 0`.
const sent = emailOutbox();

after(async () => {
  const rows = await prisma.auditLog.findMany({ where: { createdAt: { gte: startedAt } }, select: { id: true, patientId: true, resourceId: true, changes: true } });
  const ids = [...patients, ...events];
  const mine = rows.filter((r) => (r.patientId && patients.includes(r.patientId)) || (r.resourceId && ids.includes(r.resourceId)) || ids.some((i) => JSON.stringify(r.changes ?? {}).includes(i)));
  await prisma.auditLog.deleteMany({ where: { id: { in: mine.map((r) => r.id) } } });
  await prisma.emailLog.deleteMany({ where: { patientId: { in: patients } } });
  await prisma.event.deleteMany({ where: { id: { in: events } } });
  await prisma.patient.deleteMany({ where: { id: { in: patients } } });
  await prisma.$disconnect();
});

// ── helpers ──────────────────────────────────────────────────────────────────
let n = 0;
async function mkPatient(o: { email?: string | null; phone?: string | null; review?: "approved" | "pending_review" | "on_hold"; lang?: "en" | "es"; first?: string } = {}) {
  n++;
  const p = await prisma.patient.create({
    data: {
      email: o.email === undefined ? `${tag}-${n}@example.org` : o.email, role: "patient", preferredLanguage: o.lang ?? "en", familySize: 1, source: "web",
      reviewStatus: o.review ?? "approved", reviewHoldReason: o.review === "on_hold" ? "OTHER" : null,
      contactProfile: { create: { firstName: o.first ?? `Fam${n}`, lastName: "Test", phone: o.phone === undefined ? null : o.phone } },
      consentRecords: { create: [{ type: "data_and_contact", granted: true, textVersion: "t", method: "web" }] },
    },
  });
  patients.push(p.id);
  return p;
}
async function mkEvent(o: { maxCapacity?: number | null; allow?: boolean; virtual?: boolean; deadline?: Date | null; targetConditions?: string[] } = {}) {
  n++;
  const e = await prisma.event.create({
    data: {
      slug: `${tag}-e${n}`, titleEn: `Event ${n}`, titleEs: `Evento ${n}`, eventDate: new Date(Date.now() + 14 * 864e5), location: "Hall", status: "published",
      maxCapacity: o.maxCapacity ?? null, allowUninvitedRequests: o.allow ?? true, rsvpDeadline: o.deadline ?? null,
      virtualEnabled: o.virtual ?? false, meetUrl: o.virtual ? MEET : null, youtubeUrl: o.virtual ? YT : null,
      ...(o.targetConditions ? { targeting: { create: { targetConditions: o.targetConditions, targetSeverity: [], targetAgeGroups: [], targetInterests: [] } } } : {}),
    },
  });
  events.push(e.id);
  return e;
}
const invite = (eventId: string, patientId: string, extra: Record<string, unknown> = {}) =>
  prisma.invitation.create({ data: { eventId, patientId, tokenHash: hashToken(generateToken()), status: "sent", ...extra } });
const board = async () => (await mkPatient({ review: "approved" })).id;
const SEL = { primary: true, memberIds: [], guests: 0 };
const audits = (ids: string[]) => prisma.auditLog.findMany({ where: { createdAt: { gte: startedAt } } }).then((rows) => rows.filter((r) => ids.some((i) => r.resourceId === i || JSON.stringify(r.changes ?? {}).includes(i))));

// ── the path decision (pure) ─────────────────────────────────────────────────
test("invited + approved goes direct; an uninvited household asks; a pre-cutoff invitation stays direct", () => {
  const inv = { createdAt: new Date("2026-12-02"), status: "sent" };
  const ev = { allowUninvitedRequests: true };
  assert.deepEqual(decideRsvpPath({ reviewStatus: "approved", invitation: inv, event: ev, cutoff: null }), { path: "direct" });
  assert.deepEqual(decideRsvpPath({ reviewStatus: "approved", invitation: null, event: ev, cutoff: null }), { path: "request", initialStatus: "pending" });
  assert.deepEqual(decideRsvpPath({ reviewStatus: "pending_review", invitation: null, event: ev, cutoff: null }), { path: "request", initialStatus: "waiting_household_review" });
  assert.deepEqual(decideRsvpPath({ reviewStatus: "on_hold", invitation: inv, event: ev, cutoff: null }), { path: "request", initialStatus: "waiting_household_review" }, "invited but not approved (and not grandfathered): asks");
  assert.deepEqual(decideRsvpPath({ reviewStatus: "pending_review", invitation: inv, event: ev, cutoff: new Date("2026-12-03") }), { path: "direct" }, "grandfathered");
  assert.deepEqual(decideRsvpPath({ reviewStatus: "approved", invitation: null, event: { allowUninvitedRequests: false }, cutoff: null }), { path: "refuse", code: "BY_INVITATION" });
  assert.deepEqual(decideRsvpPath({ reviewStatus: "approved", invitation: { createdAt: new Date(), status: "removed" }, event: { allowUninvitedRequests: false }, cutoff: null }), { path: "refuse", code: "BY_INVITATION" }, "a removed invitation is not an invitation");
});

test("resubmission: blocked after NOT_ELIGIBLE / DUPLICATE / OTHER; reopens after FAMILY_WITHDREW or withdrawn", () => {
  for (const r of ["NOT_ELIGIBLE_FOR_EVENT", "DUPLICATE_REQUEST", "OTHER"]) assert.equal(mayResubmit({ status: "declined", declineReason: r }), false, r);
  assert.equal(mayResubmit({ status: "declined", declineReason: "FAMILY_WITHDREW" }), true);
  assert.equal(mayResubmit({ status: "withdrawn", declineReason: null }), true);
  assert.equal(mayResubmit(null), true);
});

test("new requests stop at the RSVP deadline and when the event ends", () => {
  const base = { status: "published", eventDate: new Date(Date.now() + 864e5), endDate: null };
  assert.equal(requestWindowOpen({ ...base, rsvpDeadline: null }), true);
  assert.equal(requestWindowOpen({ ...base, rsvpDeadline: new Date(Date.now() - 1000) }), false);
  assert.equal(requestWindowOpen({ ...base, status: "draft", rsvpDeadline: null }), false);
  assert.equal(requestWindowOpen({ status: "published", eventDate: new Date(Date.now() - 2 * 864e5), endDate: null, rsvpDeadline: null }), false);
});

test("confirmBlock: capacity counts in-person spots only; virtual needs the event option, the recordings toggle and both links", () => {
  const ev = { maxCapacity: 10, virtualEnabled: true, meetUrl: MEET, youtubeUrl: YT };
  const f = { status: "pending", householdApproved: true, partySize: 4, inPersonTaken: 6, event: ev, recordingsOn: true };
  assert.equal(confirmBlock({ ...f, type: "in_person" }), null, "6 + 4 = 10 fits");
  assert.equal(confirmBlock({ ...f, type: "in_person", inPersonTaken: 7 }), "AT_CAPACITY");
  assert.equal(confirmBlock({ ...f, type: "virtual", inPersonTaken: 99 }), null, "virtual takes no seat");
  assert.equal(confirmBlock({ ...f, type: "virtual", recordingsOn: false }), "RECORDINGS_OFF");
  assert.equal(confirmBlock({ ...f, type: "virtual", event: { ...ev, virtualEnabled: false } }), "VIRTUAL_OFF");
  assert.equal(confirmBlock({ ...f, type: "virtual", event: { ...ev, youtubeUrl: null } }), "NO_VIRTUAL_LINKS");
  assert.equal(confirmBlock({ ...f, type: "in_person", householdApproved: false }), "HOUSEHOLD_NOT_APPROVED");
  assert.equal(confirmBlock({ ...f, type: "in_person", status: "waiting_household_review" }), "HOUSEHOLD_NOT_APPROVED");
  assert.equal(confirmBlock({ ...f, type: "in_person", status: "declined" }), "NOT_OPEN");
});

test("event form: virtual can't be switched on without the recordings toggle or with a bad link; an already-virtual event isn't blocked", () => {
  assert.equal(eventRequestSettings({ virtualEnabled: true, meetUrl: MEET, youtubeUrl: YT }, { recordingsOn: false }).ok, false);
  assert.equal(eventRequestSettings({ virtualEnabled: true, meetUrl: MEET, youtubeUrl: YT }, { recordingsOn: true }).ok, true);
  assert.equal(eventRequestSettings({ virtualEnabled: true, meetUrl: MEET, youtubeUrl: YT }, { recordingsOn: false, current: { virtualEnabled: true } }).ok, true, "an unrelated edit of an already-virtual event");
  assert.equal(eventRequestSettings({ meetUrl: "http://meet.google.com/x" }, { recordingsOn: true }).ok, false, "https only");
  assert.equal(eventRequestSettings({ youtubeUrl: "https://evil.example.com/watch" }, { recordingsOn: true }).ok, false, "youtube hosts only");
  assert.equal(eventRequestSettings({ meetUrl: "https://example.com/meet.google.com" }, { recordingsOn: true }).ok, false);
});

// ── database flows ───────────────────────────────────────────────────────────
test("an invited, approved household RSVPs instantly; an uninvited one creates a request (and no RSVP)", async () => {
  const ev = await mkEvent();
  const invited = await mkPatient();
  await invite(ev.id, invited.id);
  const a = await rsvpOrRequest({ eventId: ev.id, patientId: invited.id, source: "modal", selection: SEL });
  assert.equal(a.kind, "rsvp");
  assert.equal(await prisma.rsvp.count({ where: { eventId: ev.id, patientId: invited.id, cancelledAt: null } }), 1);
  assert.equal(await prisma.rsvpRequest.count({ where: { eventId: ev.id, patientId: invited.id } }), 0);

  const outsider = await mkPatient();
  const b = await rsvpOrRequest({ eventId: ev.id, patientId: outsider.id, source: "modal", selection: SEL });
  assert.equal(b.kind, "request");
  assert.equal(b.kind === "request" && b.status, "pending");
  assert.equal(await prisma.rsvp.count({ where: { eventId: ev.id, patientId: outsider.id } }), 0);
  const again = await rsvpOrRequest({ eventId: ev.id, patientId: outsider.id, source: "modal", selection: SEL });
  assert.equal(again.kind === "request" && again.existing, true, "a second submit returns the same open request");
  assert.equal(await prisma.rsvpRequest.count({ where: { eventId: ev.id, patientId: outsider.id } }), 1);
});

test("a household in review saves a request that waits; an event by invitation refuses outsiders; a closed deadline refuses new requests", async () => {
  const ev = await mkEvent();
  const reviewing = await mkPatient({ review: "pending_review" });
  const r = await rsvpOrRequest({ eventId: ev.id, patientId: reviewing.id, source: "modal", selection: SEL });
  assert.equal(r.kind === "request" && r.status, "waiting_household_review");

  const closedByInvite = await mkEvent({ allow: false });
  const o = await mkPatient();
  assert.equal((await rsvpOrRequest({ eventId: closedByInvite.id, patientId: o.id, source: "modal", selection: SEL })).kind, "by_invitation");

  const late = await mkEvent({ deadline: new Date(Date.now() - 60_000) });
  assert.equal((await rsvpOrRequest({ eventId: late.id, patientId: o.id, source: "modal", selection: SEL })).kind, "closed");
});

test("registering from the modal creates a request that waits on household review, then moves to pending on approval", async () => {
  const ev = await mkEvent();
  const fresh = await mkPatient({ review: "pending_review" });
  const id = await createRegistrationRequest(ev.id, fresh.id);
  assert.ok(id);
  let req = await prisma.rsvpRequest.findUniqueOrThrow({ where: { id: id! } });
  assert.equal(req.status, "waiting_household_review");
  assert.equal(req.source, "registration");
  const actor = await board();
  assert.equal(await setReviewStatus(actor, fresh.id, "approved", null), true);
  req = await prisma.rsvpRequest.findUniqueOrThrow({ where: { id: id! } });
  assert.equal(req.status, "pending");
  assert.equal(await promoteWaitingRequests(fresh.id, actor), 0, "nothing left to promote");

  assert.equal(await createRegistrationRequest("not-an-event", fresh.id), null, "an unknown event id is ignored");
  const byInvite = await mkEvent({ allow: false });
  assert.equal(await createRegistrationRequest(byInvite.id, fresh.id), null, "an event that takes no requests is ignored");
});

test("in-person confirmation is blocked at capacity and counts confirmed in-person spots only (pending requests never count)", async () => {
  const ev = await mkEvent({ maxCapacity: 2 });
  const admin = await board();
  const [a, b, c] = [await mkPatient(), await mkPatient(), await mkPatient()];
  const ra = await rsvpOrRequest({ eventId: ev.id, patientId: a.id, source: "modal", selection: { primary: true, memberIds: [], guests: 1 } });
  const rb = await rsvpOrRequest({ eventId: ev.id, patientId: b.id, source: "modal", selection: SEL });
  const rc = await rsvpOrRequest({ eventId: ev.id, patientId: c.id, source: "modal", selection: SEL });
  assert.ok(ra.kind === "request" && rb.kind === "request" && rc.kind === "request");
  const idOf = (r: unknown) => (r as { requestId: string }).requestId;
  // three pending requests (4 people) over a capacity of 2: pending never counts, so the first confirm works
  const c1 = await confirmRequest({ requestId: idOf(ra), type: "in_person", adminId: admin });
  assert.equal(c1.ok, true);
  const c2 = await confirmRequest({ requestId: idOf(rb), type: "in_person", adminId: admin });
  assert.equal(c2.ok === false && c2.code, "AT_CAPACITY");
  assert.equal((await prisma.rsvpRequest.findUniqueOrThrow({ where: { id: idOf(rb) } })).status, "pending", "a refused confirm changes nothing");
  assert.equal(await prisma.rsvp.count({ where: { eventId: ev.id, patientId: b.id } }), 0);
  // waitlist it; later, when room appears, it can still be confirmed
  assert.equal((await waitlistRequest({ requestId: idOf(rb), adminId: admin })).ok, true);
  assert.equal((await prisma.rsvpRequest.findUniqueOrThrow({ where: { id: idOf(rb) } })).status, "waitlisted");
  await prisma.event.update({ where: { id: ev.id }, data: { maxCapacity: 5 } });
  assert.equal((await confirmRequest({ requestId: idOf(rb), type: "in_person", adminId: admin })).ok, true);
  assert.equal((await prisma.rsvpRequest.findUniqueOrThrow({ where: { id: idOf(rb) } })).status, "confirmed_in_person");
});

test("virtual confirmation is blocked unless the event's virtual option AND the recordings toggle are both on; virtual takes no seat", async () => {
  const admin = await board();
  const off = await mkEvent({ virtual: false });
  const on = await mkEvent({ virtual: true, maxCapacity: 1 });
  const p1 = await mkPatient(), p2 = await mkPatient();
  const r1 = await rsvpOrRequest({ eventId: off.id, patientId: p1.id, source: "modal", selection: SEL });
  const r2 = await rsvpOrRequest({ eventId: on.id, patientId: p2.id, source: "modal", selection: SEL });
  const id1 = (r1 as { requestId: string }).requestId, id2 = (r2 as { requestId: string }).requestId;
  const a = await confirmRequest({ requestId: id1, type: "virtual", adminId: admin, recordingsOn: true });
  assert.equal(a.ok === false && a.code, "VIRTUAL_OFF", "the event doesn't offer it");
  const b = await confirmRequest({ requestId: id2, type: "virtual", adminId: admin, recordingsOn: false });
  assert.equal(b.ok === false && b.code, "RECORDINGS_OFF", "the toggle is off");
  assert.equal(await prisma.invitation.count({ where: { eventId: { in: [off.id, on.id] } } }), 0, "refusals create nothing");
  assert.equal(await prisma.rsvp.count({ where: { eventId: { in: [off.id, on.id] } } }), 0);
  const c = await confirmRequest({ requestId: id2, type: "virtual", adminId: admin, recordingsOn: true });
  assert.equal(c.ok, true);
  const rsvp = await prisma.rsvp.findFirstOrThrow({ where: { eventId: on.id, patientId: p2.id } });
  assert.equal(rsvp.attendanceType, "virtual");
  // the one in-person seat is still free
  const p3 = await mkPatient();
  const r3 = await rsvpOrRequest({ eventId: on.id, patientId: p3.id, source: "modal", selection: SEL });
  assert.equal((await confirmRequest({ requestId: (r3 as { requestId: string }).requestId, type: "in_person", adminId: admin, recordingsOn: true })).ok, true);
});

test("confirming creates exactly one invitation and one RSVP, with the right attendance type and origin; a second confirm is refused", async () => {
  const admin = await board();
  const ev = await mkEvent({ virtual: true });
  for (const type of ["in_person", "virtual"] as const) {
    const p = await mkPatient();
    const r = (await rsvpOrRequest({ eventId: ev.id, patientId: p.id, source: "modal", selection: SEL })) as { requestId: string };
    const c = await confirmRequest({ requestId: r.requestId, type, adminId: admin, recordingsOn: true });
    assert.equal(c.ok, true, type);
    const invs = await prisma.invitation.findMany({ where: { eventId: ev.id, patientId: p.id } });
    assert.equal(invs.length, 1);
    assert.equal(invs[0].origin, "request");
    assert.equal(invs[0].attendanceType, type);
    assert.equal(invs[0].status, "rsvp_yes");
    const rsvps = await prisma.rsvp.findMany({ where: { eventId: ev.id, patientId: p.id, cancelledAt: null } });
    assert.equal(rsvps.length, 1);
    assert.equal(rsvps[0].attendanceType, type);
    const req = await prisma.rsvpRequest.findUniqueOrThrow({ where: { id: r.requestId } });
    assert.equal(req.status, type === "virtual" ? "confirmed_virtual" : "confirmed_in_person");
    assert.equal(req.invitationId, invs[0].id);
    assert.equal(req.rsvpId, rsvps[0].id);
    assert.equal(req.decidedByPatientId, admin);
    const again = await confirmRequest({ requestId: r.requestId, type, adminId: admin, recordingsOn: true });
    assert.equal(again.ok, false);
    assert.equal(await prisma.invitation.count({ where: { eventId: ev.id, patientId: p.id } }), 1);
    assert.equal(await prisma.rsvp.count({ where: { eventId: ev.id, patientId: p.id } }), 1);
  }
});

test("a household that is not approved yet can't be confirmed", async () => {
  const ev = await mkEvent();
  const p = await mkPatient({ review: "pending_review" });
  const r = (await rsvpOrRequest({ eventId: ev.id, patientId: p.id, source: "modal", selection: SEL })) as { requestId: string };
  const c = await confirmRequest({ requestId: r.requestId, type: "in_person", adminId: await board() });
  assert.equal(c.ok === false && c.code, "HOUSEHOLD_NOT_APPROVED");
});

test("decline: reason stored, EVENT_FULL refused (use the waitlist), resubmission rules apply", async () => {
  const admin = await board();
  const ev = await mkEvent();
  const mk = async () => { const p = await mkPatient(); const r = (await rsvpOrRequest({ eventId: ev.id, patientId: p.id, source: "modal", selection: SEL })) as { requestId: string }; return { p, id: r.requestId }; };
  const x = await mk();
  assert.equal((await declineRequest({ requestId: x.id, reason: "EVENT_FULL", adminId: admin })).ok, false);
  assert.equal((await declineRequest({ requestId: x.id, reason: "nonsense", adminId: admin })).ok, false);
  assert.equal((await declineRequest({ requestId: x.id, reason: "NOT_ELIGIBLE_FOR_EVENT", adminId: admin })).ok, true);
  const row = await prisma.rsvpRequest.findUniqueOrThrow({ where: { id: x.id } });
  assert.deepEqual([row.status, row.declineReason, row.decidedByPatientId], ["declined", "NOT_ELIGIBLE_FOR_EVENT", admin]);
  assert.equal((await rsvpOrRequest({ eventId: ev.id, patientId: x.p.id, source: "modal", selection: SEL })).kind, "blocked");
  assert.equal((await declineRequest({ requestId: x.id, reason: "OTHER", adminId: admin })).ok, false, "already decided");

  const y = await mk();
  assert.equal((await declineRequest({ requestId: y.id, reason: "FAMILY_WITHDREW", adminId: admin })).ok, true);
  assert.equal((await rsvpOrRequest({ eventId: ev.id, patientId: y.p.id, source: "modal", selection: SEL })).kind, "request", "FAMILY_WITHDREW reopens");
});

test("withdraw: an unconfirmed request becomes withdrawn; a confirmed one cancels its RSVP through the existing path", async () => {
  const admin = await board();
  const ev = await mkEvent();
  const a = await mkPatient(), b = await mkPatient();
  const ra = (await rsvpOrRequest({ eventId: ev.id, patientId: a.id, source: "portal", selection: SEL })) as { requestId: string };
  assert.equal((await withdrawRequest({ requestId: ra.requestId, patientId: b.id })).ok, false, "only the household's own request");
  assert.equal((await withdrawRequest({ requestId: ra.requestId, patientId: a.id })).ok, true);
  assert.equal((await prisma.rsvpRequest.findUniqueOrThrow({ where: { id: ra.requestId } })).status, "withdrawn");
  assert.equal((await rsvpOrRequest({ eventId: ev.id, patientId: a.id, source: "portal", selection: SEL })).kind, "request", "can ask again after withdrawing");

  const rb = (await rsvpOrRequest({ eventId: ev.id, patientId: b.id, source: "modal", selection: SEL })) as { requestId: string };
  await confirmRequest({ requestId: rb.requestId, type: "in_person", adminId: admin });
  assert.equal((await withdrawRequest({ requestId: rb.requestId, patientId: b.id })).ok, true);
  const req = await prisma.rsvpRequest.findUniqueOrThrow({ where: { id: rb.requestId } });
  assert.equal(req.status, "confirmed_in_person", "the request keeps its decision");
  assert.ok((await prisma.rsvp.findUniqueOrThrow({ where: { id: req.rsvpId! } })).cancelledAt, "the RSVP is cancelled");
});

test("a matched invitation can be switched to virtual (when allowed) and the household's RSVP follows", async () => {
  const admin = await board();
  const ev = await mkEvent({ virtual: true });
  const p = await mkPatient();
  const inv = await invite(ev.id, p.id);
  assert.equal((await setInvitationAttendance({ invitationId: inv.id, type: "virtual", adminId: admin, recordingsOn: false })).ok, false);
  assert.equal((await setInvitationAttendance({ invitationId: inv.id, type: "virtual", adminId: admin, recordingsOn: true })).ok, true);
  assert.equal((await prisma.invitation.findUniqueOrThrow({ where: { id: inv.id } })).attendanceType, "virtual");
  // an RSVP made from a virtual invitation is virtual
  const r = await rsvpOrRequest({ eventId: ev.id, patientId: p.id, source: "emailed_link", selection: SEL });
  assert.equal(r.kind, "rsvp");
  assert.equal((await prisma.rsvp.findFirstOrThrow({ where: { eventId: ev.id, patientId: p.id } })).attendanceType, "virtual");
});

// ── emails and public pages ──────────────────────────────────────────────────
test("virtual links appear in virtual confirmations/reminders and nowhere else; in-person emails never carry them", async () => {
  const ev = await mkEvent({ virtual: true });
  const p = await mkPatient({ first: "Vee" });
  const full = await prisma.patient.findUniqueOrThrow({ where: { id: p.id }, include: { contactProfile: true } });
  sent.length = 0;
  await sendRsvpEmail({ kind: "confirmation", patient: full, event: ev, partySize: 2, token: generateToken(), attendanceType: "virtual" });
  await sendRsvpEmail({ kind: "reminder", patient: full, event: ev, partySize: 2, token: generateToken(), attendanceType: "virtual" });
  assert.equal(sent.length, 2);
  for (const m of sent) { assert.ok(m.html.includes(MEET) && m.html.includes(YT), m.subject); assert.ok(!m.html.includes("/api/checkin-qr/"), "no QR in a virtual email"); }

  sent.length = 0;
  await sendRsvpEmail({ kind: "confirmation", patient: full, event: ev, partySize: 2, token: generateToken(), attendanceType: "in_person" });
  await sendRsvpEmail({ kind: "reminder", patient: full, event: ev, partySize: 2, token: generateToken(), attendanceType: "in_person" });
  await sendRsvpEmail({ kind: "cancelled", patient: full, event: ev, partySize: 2, attendanceType: "virtual" });
  await sendRequestEmail({ kind: "received", patient: full, event: ev });
  await sendRequestEmail({ kind: "waitlisted", patient: full, event: ev });
  await sendRequestEmail({ kind: "declined", patient: full, event: ev });
  assert.equal(sent.length, 6);
  for (const m of sent) assert.ok(!m.html.includes(MEET) && !m.html.includes(YT) && !/meet\.google|youtube/i.test(m.html), m.subject);

  const plain = await render(EventInvitation({ lang: "en", firstName: "A", eventTitle: "T", eventDate: "d", eventTime: "t", location: "Hall", rsvpUrl: "https://x/y", unsubscribeUrl: "https://x/u" }));
  assert.ok(!/meet\.google|youtube/i.test(plain), "an in-person invitation has no links");
  const withLinks = await render(EventInvitation({ lang: "es", firstName: "A", eventTitle: "T", eventDate: "d", eventTime: "t", location: "Hall", rsvpUrl: "https://x/y", unsubscribeUrl: "https://x/u", virtual: { meetUrl: MEET, youtubeUrl: YT } }));
  assert.ok(withLinks.includes(MEET) && withLinks.includes(YT));
});

test("sendInvitations: links go only to invitations marked virtual, only while virtual is allowed", async () => {
  const ev = await mkEvent({ virtual: true });
  const admin = await board();
  const pv = await mkPatient(), pi = await mkPatient();
  await invite(ev.id, pv.id, { status: "pending", attendanceType: "virtual" });
  await invite(ev.id, pi.id, { status: "pending" });
  sent.length = 0;
  const r = await sendInvitations(ev.id, admin, { recordingsOn: true });
  assert.equal(r.sent, 2);
  const to = (email: string | null) => sent.find((m) => [m.to].flat().includes(email!));
  assert.ok(to(pv.email)!.html.includes(MEET), "the virtual invitation has the links");
  assert.ok(!to(pi.email)!.html.includes(MEET), "the in-person one does not");
  // recordings off: even a virtual invitation carries no links
  const ev2 = await mkEvent({ virtual: true });
  const pw = await mkPatient();
  await invite(ev2.id, pw.id, { status: "pending", attendanceType: "virtual" });
  sent.length = 0;
  await sendInvitations(ev2.id, admin, { recordingsOn: false });
  assert.ok(sent.length === 1 && !/meet\.google|youtube/i.test(sent[0].html));
});

test("the confirm emails: in person gets the QR and no links; virtual gets links and no QR (end to end through confirmRequest)", async () => {
  const admin = await board();
  const ev = await mkEvent({ virtual: true });
  const a = await mkPatient(), b = await mkPatient();
  const ra = (await rsvpOrRequest({ eventId: ev.id, patientId: a.id, source: "modal", selection: SEL })) as { requestId: string };
  const rb = (await rsvpOrRequest({ eventId: ev.id, patientId: b.id, source: "modal", selection: SEL })) as { requestId: string };
  sent.length = 0;
  await confirmRequest({ requestId: ra.requestId, type: "in_person", adminId: admin, recordingsOn: true });
  const inPerson = sent.find((m) => [m.to].flat().includes(a.email!))!;
  assert.ok(inPerson.html.includes("/api/checkin-qr/") && !inPerson.html.includes(MEET) && !inPerson.html.includes(YT));
  await confirmRequest({ requestId: rb.requestId, type: "virtual", adminId: admin, recordingsOn: true });
  const virtual = sent.find((m) => [m.to].flat().includes(b.email!))!;
  assert.ok(virtual.html.includes(MEET) && virtual.html.includes(YT) && !virtual.html.includes("/api/checkin-qr/"));
});

test("the decline email contains no reason code (and no reason at all), in both languages", async () => {
  const admin = await board();
  const ev = await mkEvent();
  for (const lang of ["en", "es"] as const) {
    const p = await mkPatient({ lang });
    const r = (await rsvpOrRequest({ eventId: ev.id, patientId: p.id, source: "modal", selection: SEL })) as { requestId: string };
    sent.length = 0;
    assert.equal((await declineRequest({ requestId: r.requestId, reason: "NOT_ELIGIBLE_FOR_EVENT", adminId: admin })).ok, true);
    const m = sent.find((x) => [x.to].flat().includes(p.email!))!;
    assert.ok(m, "a decline email was sent");
    for (const code of DECLINE_REASONS) assert.ok(!m.html.includes(code) && !m.subject.includes(code), code);
    assert.ok(!/NOT_ELIGIBLE|not eligible|no elegible|duplicate|duplicad|full|lleno/i.test(m.html), "no reason in any wording");
  }
  const rendered = await render(RsvpRequestEmail({ kind: "declined", lang: "en", firstName: "A", eventTitle: "T", eventDate: "d", eventTime: "t" }));
  assert.ok(rendered.includes("sorry"));
});

test("public pages and routes never carry the virtual links", () => {
  assert.ok(!("meetUrl" in publicEventSelect) && !("youtubeUrl" in publicEventSelect) && !("virtualEnabled" in publicEventSelect));
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) ? [p] : []; });
  const publicFiles = [...walk("src/app/(public)"), ...walk("src/app/api/events"), ...walk("src/components/events"), ...walk("src/components/rsvp"), "src/lib/event-utils.ts"];
  for (const f of publicFiles) {
    const src = readFileSync(f, "utf8");
    assert.ok(!/meetUrl|youtubeUrl/.test(src), `${f} must not touch the virtual links`);
  }
  // the only places that read them: emails, the call list, the admin screens and the event save
  const readers = [...walk("src")].filter((f) => /meetUrl|youtubeUrl/.test(readFileSync(f, "utf8")));
  for (const f of readers) assert.ok(/messages\/|lib\/rsvp\/|lib\/invitations\/send|components\/admin\/|app\/admin\/|app\/api\/admin\/|VirtualSettings|call-list/.test(f), `unexpected reader: ${f}`);
});

// ── call list ────────────────────────────────────────────────────────────────
test("the call list shows only households with no email, with the right script, and calls are logged by code", async () => {
  const admin = await board();
  const ev = await mkEvent({ virtual: true });
  const phoneOnly = await mkPatient({ email: null, phone: "9155550101", lang: "es" });
  const withEmail = await mkPatient({ phone: "9155550102" });
  const noPhone = await mkPatient({ email: null, phone: null });
  await invite(ev.id, phoneOnly.id, { status: "sent" });
  await invite(ev.id, withEmail.id, { status: "sent" });
  await invite(ev.id, noPhone.id, { status: "sent" });
  // a no-email household whose request the board confirmed virtual: they need the confirmation by phone
  const vp = await mkPatient({ email: null, phone: "9155550103" });
  const rq = (await rsvpOrRequest({ eventId: ev.id, patientId: vp.id, source: "board", selection: SEL })) as { requestId: string };
  assert.equal((await confirmRequest({ requestId: rq.requestId, type: "virtual", adminId: admin, recordingsOn: true })).ok, true);

  const rows = await eventCallList(ev.id, { recordingsOn: true });
  const ids = rows.map((r) => r.patientId);
  assert.ok(ids.includes(phoneOnly.id) && ids.includes(vp.id));
  assert.ok(!ids.includes(withEmail.id), "a household with an email is not on the call list");
  assert.ok(!ids.includes(noPhone.id), "nothing to call without a number");
  for (const r of rows) { const p = await prisma.patient.findUniqueOrThrow({ where: { id: r.patientId } }); assert.equal(p.email, null); }
  const a = rows.find((r) => r.patientId === phoneOnly.id)!;
  assert.deepEqual([a.purpose, a.language, a.script.kind], ["invitation", "es", "in_person"]);
  assert.ok(a.script.kind === "in_person" && a.script.title.startsWith("Evento"), "the script is in the household's language");
  const v = rows.find((r) => r.patientId === vp.id)!;
  assert.deepEqual([v.purpose, v.attendanceType, v.script.kind], ["confirmation", "virtual", "virtual"]);
  assert.ok(v.script.kind === "virtual" && v.script.meetUrl === MEET && v.script.youtubeUrl === YT);
  // virtual links are never in the script while virtual is off
  const off = await eventCallList(ev.id, { recordingsOn: false });
  assert.equal(off.find((r) => r.patientId === vp.id)!.script.kind, "in_person");

  assert.equal((await logCall({ eventId: ev.id, patientId: phoneOnly.id, purpose: "invitation", outcome: "VOICEMAIL", adminId: admin })).ok, true);
  assert.equal((await logCall({ eventId: ev.id, patientId: phoneOnly.id, purpose: "invitation", outcome: "free text note", adminId: admin })).ok, false, "outcomes are codes");
  assert.equal((await logCall({ eventId: ev.id, patientId: phoneOnly.id, purpose: "other", outcome: "REACHED", adminId: admin })).ok, false);
  const log = await prisma.invitationCallLog.findFirstOrThrow({ where: { eventId: ev.id, patientId: phoneOnly.id } });
  assert.deepEqual([log.outcome, log.source, log.calledByPatientId, log.purpose], ["VOICEMAIL", "manual", admin, "invitation"]);
  assert.ok(log.invitationId);
  assert.equal((await eventCallList(ev.id, { recordingsOn: true })).find((r) => r.patientId === phoneOnly.id)!.lastCall?.outcome, "VOICEMAIL");
  assert.deepEqual([...CALL_OUTCOMES], ["REACHED", "VOICEMAIL", "NO_ANSWER", "WRONG_NUMBER", "CALLBACK_NEEDED"]);
});

// ── contact preferences ──────────────────────────────────────────────────────
test("\"also send to\" adds only confirmed adults with an email, and they receive the invitation and confirmation", async () => {
  const mem = (status: string, age: string, email: string | null) => ({ firstName: "M", relationship: "spouse_partner", ageGroup: age, status, email });
  const p = await mkPatient({ first: "Prim" });
  const mk = (d: ReturnType<typeof mem>) => prisma.householdMember.create({ data: { patientId: p.id, ...d } });
  const ok = await mk(mem("confirmed", "18_plus", `${tag}-ok@example.org`));
  const pending = await mk(mem("pending", "18_plus", `${tag}-pending@example.org`));
  const minor = await mk(mem("not_required", "6_12", null));
  const noEmail = await mk(mem("confirmed", "18_plus", null));
  const declined = await mk(mem("declined", "18_plus", `${tag}-declined@example.org`));
  const all = await prisma.householdMember.findMany({ where: { patientId: p.id } });
  assert.deepEqual(pickAlsoSendIds(all, [ok.id, pending.id, minor.id, noEmail.id, declined.id, "ghost"]), [ok.id], "only the confirmed adult with an email");

  const actor = { type: "family", memberId: null } as const;
  for (const bad of [pending.id, minor.id, noEmail.id, declined.id, "ghost"]) assert.deepEqual(await setAlsoSendTo(p.id, [ok.id, bad], actor), { ok: false, error: "invalid" }, bad);
  assert.equal((await prisma.patient.findUniqueOrThrow({ where: { id: p.id } })).alsoSendToMemberIds.length, 0, "a refused change stores nothing");
  const r = await setAlsoSendTo(p.id, [ok.id], actor);
  assert.deepEqual(r.ok && r.ids, [ok.id]);
  assert.deepEqual((await alsoSendRecipients(p.id)).map((x) => x.email), [`${tag}-ok@example.org`]);

  // a member who is later removed or no longer confirmed drops out without anyone editing the list
  const ev = await mkEvent();
  await invite(ev.id, p.id, { status: "pending" });
  sent.length = 0;
  await sendInvitations(ev.id, await board(), { recordingsOn: false });
  const recipients = sent.flatMap((m) => [m.to].flat());
  assert.ok(recipients.includes(p.email!) && recipients.includes(`${tag}-ok@example.org`));
  assert.ok(!recipients.some((x) => /pending|declined/.test(String(x))));
  const full = await prisma.patient.findUniqueOrThrow({ where: { id: p.id }, include: { contactProfile: true } });
  sent.length = 0;
  await sendRsvpEmail({ kind: "confirmation", patient: full, event: ev, partySize: 1, token: generateToken() });
  assert.deepEqual(sent.flatMap((m) => [m.to].flat()).sort(), [p.email, `${tag}-ok@example.org`].sort());
  sent.length = 0;
  await sendRsvpEmail({ kind: "reminder", patient: full, event: ev, partySize: 1, token: generateToken() });
  assert.equal(sent.length, 1, "reminders go to the primary only");
  await prisma.householdMember.update({ where: { id: ok.id }, data: { status: "declined" } });
  assert.deepEqual(await alsoSendRecipients(p.id), []);
});

test("\"can this number get texts\": primary and adults, needs a phone, stored only; registration accepts it", async () => {
  const p = await mkPatient({ phone: "9155550111" });
  const noPhone = await mkPatient({ phone: null });
  const adult = await prisma.householdMember.create({ data: { patientId: p.id, firstName: "A", relationship: "spouse_partner", ageGroup: "18_plus", status: "confirmed", email: `${tag}-a@example.org`, phone: "9155550112" } });
  const actor = { type: "family", memberId: null } as const;
  assert.equal((await setPhoneCanText(p.id, { kind: "primary" }, true, actor)).ok, true);
  assert.equal((await prisma.patient.findUniqueOrThrow({ where: { id: p.id } })).phoneCanText, true);
  assert.equal((await setPhoneCanText(p.id, { kind: "member", memberId: adult.id }, false, actor)).ok, true);
  assert.equal((await prisma.householdMember.findUniqueOrThrow({ where: { id: adult.id } })).phoneCanText, false);
  assert.deepEqual(await setPhoneCanText(noPhone.id, { kind: "primary" }, true, actor), { ok: false, error: "no_phone" });
  assert.deepEqual(await setPhoneCanText(p.id, { kind: "primary" }, "yes", actor), { ok: false, error: "invalid" });
  const v = validatePatientInput({ firstName: "A", lastName: "B", email: "", phone: "9155550113", phoneCanText: true, address: {}, language: "en", familySize: 1, diagnoses: [], consentDataAndContact: true, consentMedia: false, attestation: true });
  assert.ok(v.ok && v.value.phoneCanText === true);
  const none = validatePatientInput({ firstName: "A", lastName: "B", email: "a@example.org", phone: "", phoneCanText: true, address: {}, language: "en", familySize: 1, diagnoses: [], consentDataAndContact: true, consentMedia: false, attestation: true });
  assert.ok(none.ok && none.value.phoneCanText === null, "no phone, nothing to mark");
});

// ── logging ──────────────────────────────────────────────────────────────────
test("every action is logged with ids, statuses and reason codes only", async () => {
  const rows = await audits([...patients, ...events]);
  const actions = new Set(rows.map((r) => r.action));
  for (const a of ["RSVP_REQUEST_CREATED", "RSVP_REQUEST_PROMOTED", "RSVP_REQUEST_CONFIRMED", "RSVP_REQUEST_WAITLISTED", "RSVP_REQUEST_DECLINED", "RSVP_REQUEST_WITHDRAWN", "INVITATION_ATTENDANCE_CHANGED", "INVITATION_CALL_LOGGED", "ALSO_SEND_TO_CHANGED", "PHONE_TEXT_PREF_CHANGED"]) assert.ok(actions.has(a as never), `${a} was logged`);
  const codes = rows.filter((r) => r.action === "RSVP_REQUEST_DECLINED").map((r) => (r.changes as { reasonCode?: string }).reasonCode);
  assert.ok(codes.includes("NOT_ELIGIBLE_FOR_EVENT"), "the reason code is in the log");
  for (const r of rows) {
    const text = `${r.details ?? ""} ${JSON.stringify(r.changes ?? {})}`;
    assert.ok(!/[^\s@]+@[^\s@]+\.[^\s@]+/.test(text), `no email address in ${r.action}`);
    assert.ok(!/\b\d{3}[-. ]?\d{3}[-. ]?\d{4}\b/.test(text), `no phone number in ${r.action}`);
    assert.ok(!/Fam\d|Vee|Prim|Test/.test(text), `no names in ${r.action}`);
    assert.ok(!/meet\.google|youtube/i.test(text), `no links in ${r.action}`);
  }
});

// ── the modal ────────────────────────────────────────────────────────────────
const NOTICES = { recorded: false, captions: false };
/** SSR escapes apostrophes and ampersands; compare against the plain text. */
const unescapeHtml = (h: string) => h.replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
const modal = (view: EventRsvpView, locale: "en" | "es", full = false) =>
  unescapeHtml(renderToString(createElement(RsvpModal, { view, locale, eventId: "ev-1", turnstileSiteKey: null, notices: NOTICES, full, defaultOpen: true })));

test("the modal renders every flow in both languages, as an accessible dialog", () => {
  const views: [string, EventRsvpView][] = [
    ["anon", { kind: "anon", byInvitation: false }],
    ["anon by invitation", { kind: "anon", byInvitation: true }],
    ["member direct", { kind: "member", firstName: "Ana", options: [{ id: "m1", label: "Luis", relationship: "child", ageGroup: "6_12", status: "not_required" }], path: "direct", reviewing: false }],
    ["member request", { kind: "member", firstName: "Ana", options: [], path: "request", reviewing: false }],
    ["member in review", { kind: "member", firstName: "Ana", options: [], path: "request", reviewing: true }],
    ["request waiting", { kind: "request", requestId: "r1", status: "waiting_household_review" }],
    ["request pending", { kind: "request", requestId: "r1", status: "pending" }],
    ["request waitlisted", { kind: "request", requestId: "r1", status: "waitlisted" }],
    ["already", { kind: "already", partySize: 2, attendanceType: "in_person" }],
    ["already virtual", { kind: "already", partySize: 2, attendanceType: "virtual" }],
    ["by invitation", { kind: "by_invitation" }],
    ["blocked", { kind: "blocked" }],
  ];
  for (const locale of ["en", "es"] as const) {
    const t = rsvpModalTranslation[locale];
    for (const [name, view] of views) {
      const html = modal(view, locale);
      assert.ok(html.includes('role="dialog"') && html.includes('aria-modal="true"') && html.includes("aria-labelledby"), `${name} ${locale}: dialog semantics`);
      assert.ok(html.includes(`aria-label="${t.close}"`) && html.includes(t.title), `${name} ${locale}: close button and title`);
      assert.ok(!/undefined|\[object/.test(html), `${name} ${locale}: no missing text`);
    }
    const anon = modal({ kind: "anon", byInvitation: false }, locale);
    // the three choices
    assert.ok(anon.includes(t.registerTitle) && anon.includes(t.emailTitle) && anon.includes(t.phoneTitle), `${locale}: the three choices`);
    assert.ok(anon.includes("/register-info?event=ev-1") && anon.includes("mode=phone"), `${locale}: the event is carried through registration`);
    const inv = modal({ kind: "anon", byInvitation: true }, locale);
    assert.ok(!inv.includes(t.registerTitle) && inv.includes('type="email"'), `${locale}: by invitation offers only the email flow`);
    assert.ok(modal({ kind: "member", firstName: "A", options: [], path: "direct", reviewing: false }, locale).includes(`>${t.rsvp}<`), `${locale}: direct button`);
    assert.ok(modal({ kind: "member", firstName: "A", options: [], path: "request", reviewing: true }, locale).includes(t.reviewNote), `${locale}: review note`);
    assert.ok(modal({ kind: "member", firstName: "A", options: [], path: "request", reviewing: false }, locale, true).includes(t.full), `${locale}: full-event note`);
  }
  // closed: only the button, no dialog
  const closed = renderToString(createElement(RsvpModal, { view: { kind: "anon", byInvitation: false }, locale: "en", eventId: "e", turnstileSiteKey: null, notices: NOTICES, full: false }));
  assert.ok(closed.includes("RSVP now") && !closed.includes('role="dialog"'));
});

test("modal, RSVP page and registration strings exist in both languages with the same keys", () => {
  assert.deepEqual(Object.keys(rsvpModalTranslation.en).sort(), Object.keys(rsvpModalTranslation.es).sort());
  assert.deepEqual(Object.keys(rsvpPageTranslation.en).sort(), Object.keys(rsvpPageTranslation.es).sort());
  for (const k of Object.keys(rsvpModalTranslation.en)) assert.ok(rsvpModalTranslation.es[k].trim(), `ES ${k} is not empty`);
  const reg = readFileSync("src/translation/registerInfoPage.ts", "utf8");
  for (const k of ["eventNote", "phoneMode", "phoneModeNote", "successCall", "successEvent", "canText"]) assert.equal((reg.match(new RegExp(`\\b${k}:`, "g")) ?? []).length, 2, `${k} in EN and ES`);
});

test("the admin screens and routes are gated by canManageEvents / canManageUsers", () => {
  for (const f of ["src/app/api/admin/events/[id]/requests/[requestId]/route.ts", "src/app/api/admin/events/[id]/call-log/route.ts", "src/app/api/admin/events/[id]/invitations/[invId]/attendance/route.ts"]) assert.ok(readFileSync(f, "utf8").includes('requirePermission("canManageEvents")'), f);
  assert.ok(readFileSync("src/app/api/admin/patients/[id]/contact-prefs/route.ts", "utf8").includes('requirePermission("canManageUsers")'));
  assert.ok(readFileSync("src/app/admin/events/[id]/requests/page.tsx", "utf8").includes('admin.can("canManageEvents")'));
});
