/**
 * Fixes needed before the phone system. Run: npm run check:phone-prereqs   (db-guard refuses production; DEV database,
 * throw-away rows are deleted after)
 *  - a household merge moves invitation_call_logs and rsvp_requests (and what points at them), closing colliding open requests
 *  - the call list never lists a household that withdrew contact consent for an invitation
 *  - texting consent covers only the number it was given for; a number change ends it until the family agrees again
 *  - CLAUDE.md says what the build really does with type errors
 */
import "./_load-env";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { test, after } from "node:test";
import { prisma } from "../src/lib/db";
import { mergePeople } from "../src/lib/identity/merge";
import { planMerge } from "../src/lib/identity/merge-plan";
import { openRequestsToWithdraw } from "../src/lib/identity/merge-rules";
import { eventCallList } from "../src/lib/rsvp/call-list";
import { createPatient, validatePatientInput } from "../src/lib/patients/create";
import { currentSmsConsent, smsConsentCovers, smsNeedsReconsent } from "../src/lib/consent/sms";
import { recordBoardConsent } from "../src/lib/consent/board";
import { recordPortalConsent } from "../src/lib/portal/service";
import { updateProfile } from "../src/lib/portal/edit";
import { loadHousehold } from "../src/lib/portal/household";

const DAY = 864e5;
const tag = `phpre${Date.now()}`;
const startedAt = new Date();
const patients: string[] = [];
const events: string[] = [];
const t = (days: number) => new Date(Date.now() + days * DAY);

after(async () => {
  await prisma.auditLog.deleteMany({ where: { OR: [{ patientId: { in: patients } }, { resourceId: { in: patients } }] } });
  await prisma.emailLog.deleteMany({ where: { sentAt: { gte: startedAt }, patientId: { in: patients } } });
  await prisma.event.deleteMany({ where: { id: { in: events } } });
  await prisma.patient.deleteMany({ where: { id: { in: patients } } });
  await prisma.$disconnect();
});

type Consent = { type: string; granted: boolean; day?: number; phoneNumber?: string };
async function household(name: string, o: { phone?: string | null; email?: string | null; consents?: Consent[]; createdDay?: number; registered?: boolean } = {}) {
  const p = await prisma.patient.create({
    data: {
      email: o.email === undefined ? `${tag}.${name}@example.org` : o.email, role: "patient", source: "web", registrationCompletedAt: o.registered === false ? null : new Date(), createdAt: t(o.createdDay ?? -30),
      contactProfile: { create: { firstName: name, lastName: tag, phone: o.phone === undefined ? "+19155550100" : o.phone } },
      consentRecords: { create: (o.consents ?? [{ type: "data_and_contact", granted: true }]).map((c) => ({ type: c.type, granted: c.granted, textVersion: "v4", method: "web", createdAt: t(c.day ?? -20), phoneNumber: c.phoneNumber })) },
    },
  });
  patients.push(p.id);
  return p.id;
}
async function officer(name: string) {
  const p = await prisma.patient.create({
    data: { email: `${tag}.${name}@hemoelpaso.org`, role: "board", source: "web", contactProfile: { create: { firstName: name, lastName: tag } }, boardRoles: { create: [{ role: "PRESIDENT", assignedBy: "test" }] } },
  });
  patients.push(p.id);
  return p.id;
}
async function event(slug: string) {
  const e = await prisma.event.create({ data: { slug: `${tag}-${slug}`, titleEn: "T", titleEs: "T", eventDate: t(30), location: "X", status: "published" } });
  events.push(e.id);
  return e.id;
}
const invitation = (eventId: string, patientId: string, status = "sent") =>
  prisma.invitation.create({ data: { eventId, patientId, status, tokenHash: `${tag}-${eventId}-${patientId}` } });
const request = (eventId: string, patientId: string, data: Partial<{ status: string; invitationId: string; rsvpId: string; selMemberIds: string[]; createdAt: Date; decidedByPatientId: string }> = {}) =>
  prisma.rsvpRequest.create({ data: { eventId, patientId, source: "board", partySize: 1 + (data.selMemberIds?.length ?? 0), ...data } });
const call = (eventId: string, patientId: string, data: Partial<{ invitationId: string; calledByPatientId: string }> = {}) =>
  prisma.invitationCallLog.create({ data: { eventId, patientId, purpose: "invitation", outcome: "REACHED", ...data } });

// ───────────────────────── merge ─────────────────────────
test("merge rules: which open requests close", () => {
  const r = (id: string, eventId: string, status: string, day = 0) => ({ id, eventId, status, createdAt: t(day) });
  const none = new Set<string>();
  assert.deepEqual(openRequestsToWithdraw([r("k", "e", "pending")], [r("d", "e", "waitlisted")], none, none), [{ id: "k", eventId: "e", rule: "one_open_request" }], "further along wins");
  assert.deepEqual(openRequestsToWithdraw([r("k", "e", "pending", -1)], [r("d", "e", "pending", -5)], none, none), [{ id: "k", eventId: "e", rule: "one_open_request" }], "then the older");
  assert.deepEqual(openRequestsToWithdraw([], [r("d", "e", "pending")], new Set(["e"]), none), [{ id: "d", eventId: "e", rule: "already_attending" }]);
  assert.deepEqual(openRequestsToWithdraw([r("k", "e", "pending")], [r("d", "e", "declined")], none, none), [], "closed requests are history");
  assert.deepEqual(openRequestsToWithdraw([r("k", "e", "pending")], [r("d", "f", "pending")], none, none), [], "different events");
});

test("merge moves call logs and RSVP requests, re-points what hangs off them, and they survive the tombstone purge", async () => {
  const keep = await household("keep", { createdDay: -90 });
  const drop = await household("drop", { createdDay: -10 });
  const actor = await officer("actor");
  const [e1, e2, e3, e4] = [await event("m1"), await event("m2"), await event("m3"), await event("m4")];

  // e1: only the dropped record has anything
  const inv1 = await invitation(e1, drop);
  const r1 = await request(e1, drop, { status: "pending", invitationId: inv1.id });
  const c1 = await call(e1, drop, { invitationId: inv1.id });
  // e2: both invited (the sent one beats the pending one), both with an open request
  const keepInv2 = await invitation(e2, keep, "sent");
  const dropInv2 = await invitation(e2, drop, "pending");
  const keepR2 = await request(e2, keep, { status: "pending" });
  const dropR2 = await request(e2, drop, { status: "waitlisted", invitationId: dropInv2.id });
  const c2 = await call(e2, drop, { invitationId: dropInv2.id });
  // e3: the survivor already attends; the other record still has an open request
  await prisma.rsvp.create({ data: { eventId: e3, patientId: keep, attendeeCount: 1 } });
  const r3 = await request(e3, drop, { status: "pending" });
  // e4: both RSVP'd; the dropped record's confirmed request points at the RSVP that loses
  const keepRsvp = await prisma.rsvp.create({ data: { eventId: e4, patientId: keep, attendeeCount: 3 } });
  const dropRsvp = await prisma.rsvp.create({ data: { eventId: e4, patientId: drop, attendeeCount: 1, cancelledAt: new Date() } });
  // the same child on both records: the request's member ids must follow the entry that is kept
  const kid = { lastName: tag, firstName: "Nico", relationship: "child", ageGroup: "6_12", status: "not_required" };
  const keepKid = await prisma.householdMember.create({ data: { ...kid, patientId: keep } });
  const dropKid = await prisma.householdMember.create({ data: { ...kid, patientId: drop } });
  const r4 = await request(e4, drop, { status: "confirmed_in_person", rsvpId: dropRsvp.id, selMemberIds: [dropKid.id], decidedByPatientId: actor });

  const preview = await planMerge(prisma, keep, drop, { keepId: keep });
  assert.ok(preview.ok);
  assert.equal(preview.plan.conflicts.filter((c) => c.kind === "rsvp_request").length, 2, "the officer sees the requests that will close");

  const res = await mergePeople(keep, drop, actor, keep);
  assert.ok(res.ok, JSON.stringify(res));

  assert.equal(await prisma.rsvpRequest.count({ where: { patientId: drop } }), 0);
  assert.equal(await prisma.invitationCallLog.count({ where: { patientId: drop } }), 0);
  const req = async (id: string) => prisma.rsvpRequest.findUniqueOrThrow({ where: { id } });
  assert.deepEqual([(await req(r1.id)).patientId, (await req(r1.id)).status, (await req(r1.id)).invitationId], [keep, "pending", inv1.id]);
  assert.equal((await req(keepR2.id)).status, "withdrawn", "the weaker open request closes");
  assert.deepEqual([(await req(dropR2.id)).status, (await req(dropR2.id)).patientId, (await req(dropR2.id)).invitationId], ["waitlisted", keep, keepInv2.id]);
  assert.deepEqual([(await req(r3.id)).status, (await req(r3.id)).patientId], ["withdrawn", keep]);
  const moved4 = await req(r4.id);
  const keptKid = (await prisma.householdMember.findMany({ where: { patientId: keep, id: { in: [keepKid.id, dropKid.id] } } })).map((m) => m.id);
  assert.equal(keptKid.length, 1);
  assert.deepEqual([moved4.rsvpId, moved4.selMemberIds, moved4.partySize], [keepRsvp.id, keptKid, 2]);

  const log = async (id: string) => prisma.invitationCallLog.findUniqueOrThrow({ where: { id } });
  assert.deepEqual([(await log(c1.id)).patientId, (await log(c1.id)).invitationId], [keep, inv1.id]);
  assert.deepEqual([(await log(c2.id)).patientId, (await log(c2.id)).invitationId], [keep, keepInv2.id], "a call on the losing invitation follows the one kept");

  const row = await prisma.auditLog.findFirstOrThrow({ where: { action: "PATIENT_MERGED", resourceId: keep } });
  const changes = row.changes as { rsvpRequests: { moved: string[]; withdrawn: unknown[] }; callLogs: { moved: string[] } };
  assert.deepEqual([changes.rsvpRequests.moved.length, changes.rsvpRequests.withdrawn.length, changes.callLogs.moved.length], [4, 2, 2]);

  // what the retention job does to the tombstone 12 months later
  await prisma.patient.delete({ where: { id: drop } });
  assert.equal(await prisma.rsvpRequest.count({ where: { id: { in: [r1.id, dropR2.id, r3.id, r4.id] } } }), 4);
  assert.equal(await prisma.invitationCallLog.count({ where: { id: { in: [c1.id, c2.id] } } }), 2);
});

test("merge re-points the calls and decisions a board member made", async () => {
  const keep = await officer("dupkeep");
  const drop = await household("dupdrop", { createdDay: -5, consents: [], registered: false }); // a bare duplicate of the officer, no household data
  const actor = await officer("actor2");
  const other = await household("other");
  const ev = await event("caller");
  const c = await call(ev, other, { calledByPatientId: drop });
  const r = await request(ev, other, { status: "withdrawn", decidedByPatientId: drop });
  const res = await mergePeople(keep, drop, actor, keep);
  assert.ok(res.ok, JSON.stringify(res));
  assert.equal((await prisma.invitationCallLog.findUniqueOrThrow({ where: { id: c.id } })).calledByPatientId, keep);
  assert.equal((await prisma.rsvpRequest.findUniqueOrThrow({ where: { id: r.id } })).decidedByPatientId, keep);
});

// ───────────────────────── call list ─────────────────────────
test("call list: an invited household that withdrew contact consent is not listed; agreeing again lists it", async () => {
  const ev = await event("calls");
  const gone = await household("gone", { email: null, consents: [{ type: "data_and_contact", granted: true, day: -9 }, { type: "data_and_contact", granted: false, day: -2 }] });
  const fine = await household("fine", { email: null });
  const kept = await household("kept", { email: null, consents: [{ type: "data_and_contact", granted: false, day: -2 }] });
  await invitation(ev, gone);
  await invitation(ev, fine, "pending");
  // a withdrawn household that keeps a confirmed RSVP still needs its confirmation (essential, like the email)
  const rsvp = await prisma.rsvp.create({ data: { eventId: ev, patientId: kept, attendeeCount: 1 } });
  await request(ev, kept, { status: "confirmed_in_person", rsvpId: rsvp.id });

  const list = async () => new Map((await eventCallList(ev, { recordingsOn: false })).map((r) => [r.patientId, r.purpose]));
  let rows = await list();
  assert.equal(rows.has(gone), false);
  assert.equal(rows.get(fine), "invitation");
  assert.equal(rows.get(kept), "confirmation");
  await prisma.consentRecord.create({ data: { patientId: gone, type: "data_and_contact", granted: true, textVersion: "v4", method: "phone" } });
  rows = await list();
  assert.equal(rows.get(gone), "invitation");
});

// ───────────────────────── texting consent ─────────────────────────
const smsRows = (where: { patientId?: string; householdMemberId?: string }) =>
  prisma.consentRecord.findMany({ where: { ...where, type: "sms" }, orderBy: { createdAt: "asc" } });
const phoneOf = async (id: string) => (await prisma.contactProfile.findUnique({ where: { patientId: id } }))?.phone ?? null;
const covered = async (id: string) => smsConsentCovers(await smsRows({ patientId: id }), await phoneOf(id));

test("the rule: only the newest yes, only for the number it was given for", () => {
  const row = (granted: boolean, day: number, phoneNumber: string | null) => ({ type: "sms", granted, createdAt: t(day), phoneNumber });
  assert.equal(smsConsentCovers([row(true, -1, "+19155550100")], "(915) 555-0100"), true, "formats don't matter");
  assert.equal(smsConsentCovers([row(true, -1, "+19155550100")], "+19155550199"), false);
  assert.equal(smsConsentCovers([row(true, -1, null)], "+19155550100"), false, "a record with no number covers none");
  assert.equal(smsConsentCovers([row(true, -1, "+19155550100")], null), false);
  assert.equal(smsConsentCovers([row(true, -2, "+19155550100"), row(false, -1, null)], "+19155550100"), false);
  assert.equal(currentSmsConsent([], "+19155550100"), null);
  assert.equal(smsNeedsReconsent([row(true, -1, null)], "+19155550100"), true);
});

test("registration records the number with a texting yes (and with nothing else)", async () => {
  const v = validatePatientInput({
    firstName: "Reg", lastName: tag, phone: "915-555-0142", email: `${tag}.reg@example.org`,
    diagnoses: [], members: [], familySize: 1, consentDataAndContact: true, consentMedia: true, consentSms: true, consentNewsletter: false, attestation: true,
  } as never);
  assert.ok(v.ok, JSON.stringify(v));
  const { id } = await createPatient(v.value, { source: "web", method: "web" });
  patients.push(id);
  const rows = await prisma.consentRecord.findMany({ where: { patientId: id } });
  assert.equal(rows.find((r) => r.type === "sms")?.phoneNumber, "+19155550142");
  assert.ok(rows.filter((r) => r.type !== "sms").every((r) => r.phoneNumber === null));
});

test("family page: a number change ends texting consent, changing back does not restore it, agreeing again does", async () => {
  const p = await household("fam");
  const ctx = { householdId: p, actor: { kind: "primary" as const } };
  const save = (phone: string) => updateProfile(ctx, { firstName: "fam", lastName: tag, phone, language: "en" });
  assert.deepEqual(await recordPortalConsent(p, "sms", true), { ok: true, changed: true, granted: true });
  assert.equal(await covered(p), true);

  assert.equal((await save("915-555-0100")).ok, true); // same number, different format
  assert.equal((await smsRows({ patientId: p })).length, 1, "no change, no row");

  assert.equal((await save("915-555-0111")).ok, true);
  let rows = await smsRows({ patientId: p });
  assert.deepEqual([rows.length, rows[1].granted, rows[1].method, rows[1].reasonCode], [2, false, "system", "PHONE_CHANGED"]);
  assert.equal(await covered(p), false);

  assert.equal((await save("915-555-0100")).ok, true); // back again
  assert.equal(await covered(p), false);
  assert.equal((await smsRows({ patientId: p })).length, 2, "already refused: nothing more to record");
  assert.equal((await loadHousehold(p))?.consents.sms, false, "the page shows it off, so it can be turned on");

  assert.deepEqual(await recordPortalConsent(p, "sms", true), { ok: true, changed: true, granted: true });
  assert.equal(await covered(p), true);
  rows = await smsRows({ patientId: p });
  assert.equal(rows[2].phoneNumber, "+19155550100");

  assert.equal((await save("")).ok, true); // number removed
  assert.equal(await covered(p), false);
  assert.deepEqual(await recordPortalConsent(p, "sms", true), { ok: false, status: 409, error: "needs_phone" });
  for (const r of await prisma.auditLog.findMany({ where: { patientId: p } })) assert.ok(!/555-?01/.test(JSON.stringify(r)), "no phone number in the audit log");
});

test("an adult's own number works the same way on their own row", async () => {
  const p = await household("adult");
  const m = await prisma.householdMember.create({ data: { patientId: p, firstName: "Ana", lastName: tag, relationship: "sibling", ageGroup: "18_plus", status: "confirmed", phone: "+19155550150" } });
  assert.equal((await recordPortalConsent(p, "sms", true, m.id)).ok, true);
  assert.equal((await updateProfile({ householdId: p, actor: { kind: "member", memberId: m.id } }, { firstName: "Ana", lastName: tag, phone: "915-555-0151", language: "en" })).ok, true);
  const rows = await smsRows({ householdMemberId: m.id });
  assert.deepEqual(rows.map((r) => r.granted), [true, false]);
  assert.equal((await smsRows({ patientId: p })).length, 0, "the household's own consent is not touched");
});

test("an old yes with no number covers nothing; the board can record a new one or a refusal", async () => {
  const actor = await officer("actor3");
  const consents: Consent[] = [{ type: "data_and_contact", granted: true }, { type: "sms", granted: true }];
  const a = await household("legacy", { consents });
  assert.equal(await covered(a), false);
  assert.equal((await loadHousehold(a))?.consents.sms, false);
  assert.ok((await recordBoardConsent(actor, a, { type: "sms", granted: true, reason: "FAMILY_ASKED_PHONE" })).ok, "not 'no change'");
  assert.equal(await covered(a), true);
  const b = await household("legacy2", { consents });
  assert.ok((await recordBoardConsent(actor, b, { type: "sms", granted: false, reason: "OTHER" })).ok);
});

test("merge: a yes follows the number; choosing the other number ends it", async () => {
  const actor = await officer("actor4");
  const yes: Consent[] = [{ type: "data_and_contact", granted: true }, { type: "sms", granted: true, phoneNumber: "+19155550160" }];
  const a = await household("sm-a", { phone: "+19155550160", consents: yes, createdDay: -50 });
  const b = await household("sm-b", { phone: "+19155550161", createdDay: -5 });
  assert.ok((await mergePeople(a, b, actor, a)).ok);
  assert.equal(await covered(a), true, "same number kept: still agreed");
  const c = await household("sm-c", { phone: "+19155550160", consents: yes, createdDay: -50 });
  const d = await household("sm-d", { phone: "+19155550161", createdDay: -5 });
  assert.ok((await mergePeople(c, d, actor, c, { primaryPhone: "other" })).ok);
  assert.equal(await covered(c), false);
  assert.equal((await smsRows({ patientId: c })).at(-1)?.reasonCode, "PHONE_CHANGED");
});

test("the database refuses to edit the number on a consent record", async () => {
  const p = await household("trig", { consents: [{ type: "sms", granted: true, phoneNumber: "+19155550170" }] });
  const [row] = await smsRows({ patientId: p });
  await assert.rejects(prisma.consentRecord.update({ where: { id: row.id }, data: { phoneNumber: "+19155550171" } }), /append-only/);
});

test("every place that changes a phone number also ends a texting yes for the old one", () => {
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) ? [p] : []; });
  const writes = /(contactProfile|householdMember)\.(update|updateMany|upsert)\(\s*\{[\s\S]{0,300}?\bphone\b/;
  const writers = walk("src").filter((f) => writes.test(readFileSync(f, "utf8"))).sort();
  assert.deepEqual(writers, ["src/app/api/admin/patients/[id]/route.ts", "src/lib/identity/merge.ts", "src/lib/portal/edit.ts"], "a new writer must call lapseSmsConsent and be added here");
  for (const f of writers) assert.match(readFileSync(f, "utf8"), /await lapseSmsConsent\(tx,/, f);
});

// ───────────────────────── docs ─────────────────────────
test("CLAUDE.md matches next.config: type errors fail the build", () => {
  assert.match(readFileSync("next.config.mjs", "utf8"), /ignoreBuildErrors:\s*false/);
  const doc = readFileSync(".claude/CLAUDE.md", "utf8");
  assert.ok(!/does NOT catch type errors/.test(doc));
  assert.match(doc, /ignoreBuildErrors: false/);
});
