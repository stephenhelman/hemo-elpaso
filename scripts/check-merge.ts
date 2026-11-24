/**
 * Merge hardening + admin consent controls. Run: npm run check:merge   (db-guard refuses production; uses the DEV database)
 *
 *  - pure rules: member matching, RSVP / invitation / check-in conflicts, consent resolution, contact choice, duplicate pairs, board consent rules
 *  - the append-only trigger: still rejects every UPDATE outside the merge window; inside it only owner columns may change
 *  - fixtures: board record into household (the dropped record recorded consents for others), two households for one
 *    family, conflicting RSVPs, consents on both, identities on both, removed invitations
 *  - preview writes nothing; the fingerprint stops a stale confirm; tombstones resolve and are purged after 12 months
 *  - officer consent changes: append-only, reason rules, immediate effect on non-essential email, ids-only audit
 * It creates throw-away rows (tagged) and deletes them.
 */
import "./_load-env";
import assert from "node:assert/strict";
import { test, after } from "node:test";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/db";
import { mergePeople } from "../src/lib/identity/merge";
import { planMerge } from "../src/lib/identity/merge-plan";
import {
  candidatePairs, normName, pairMembers, pickCheckIn, pickInvitation, pickMember, pickRsvp, resolveConsents, resolveEmail, resolvePhone, memberKey, pairKey,
} from "../src/lib/identity/merge-rules";
import { candidatesForEmail } from "../src/lib/identity/link";
import { dismissDuplicate, listDuplicatePairs } from "../src/lib/identity/duplicates";
import { purgeMergedTombstones } from "../src/lib/retention";
import { PATIENT_ONLY, currentConsents } from "../src/lib/patients/query";
import { blockedByWithdrawal } from "../src/lib/email/policy";
import { recordBoardConsent } from "../src/lib/consent/board";
import { checkBoardChange } from "../src/lib/consent/board-rules";
import { CONSENT_TEXT_VERSION } from "../src/content/consent";
import { generateInvitations } from "../src/lib/invitations/generate";
import { generateUnsubscribeToken } from "../src/lib/unsubscribe-token";
import { GET as unsubscribe } from "../src/app/api/unsubscribe/route";

delete process.env.RESEND_API_KEY;

const DAY = 864e5;
const tag = `mg${Date.now()}`;
const patients: string[] = [];
const events: string[] = [];
const subs: string[] = [];
const em = (n: string) => `${tag}.${n}@example.org`;
const t = (days: number) => new Date(Date.now() + days * DAY);

after(async () => {
  await prisma.userIdentity.deleteMany({ where: { auth0Sub: { in: subs } } });
  await prisma.event.deleteMany({ where: { id: { in: events } } });
  await prisma.auditLog.deleteMany({ where: { OR: [{ patientId: { in: patients } }, { resourceId: { in: patients } }] } });
  await prisma.patient.deleteMany({ where: { id: { in: patients } } });
  await prisma.$disconnect();
});

async function person(name: string, o: { role?: string; email?: string | null; phone?: string | null; consents?: { type: string; granted: boolean; day: number }[]; dx?: string[]; createdDay?: number } = {}) {
  const p = await prisma.patient.create({
    data: {
      email: o.email === undefined ? em(name) : o.email, role: o.role ?? "patient", source: "web", createdAt: t(o.createdDay ?? -30),
      primaryDiagnoses: o.dx ?? [], statedDiagnoses: o.dx ?? [], registrationCompletedAt: o.role === "board" ? null : t(-30),
      contactProfile: { create: { firstName: name, lastName: tag, phone: o.phone === undefined ? "+19155550100" : o.phone } },
      consentRecords: { create: (o.consents ?? [{ type: "data_and_contact", granted: true, day: -30 }]).map((c) => ({ type: c.type, granted: c.granted, textVersion: "v3", method: "web", createdAt: t(c.day) })) },
    },
  });
  patients.push(p.id);
  return p.id;
}
const boardPerson = async (name: string, role: "PRESIDENT" | "SECRETARY" = "PRESIDENT") => {
  const p = await prisma.patient.create({
    data: { email: `${tag}.${name}@hemoelpaso.org`, role: "board", source: "web", contactProfile: { create: { firstName: name, lastName: tag } }, boardRoles: { create: [{ role, assignedBy: "test" }] } },
  });
  patients.push(p.id);
  return p.id;
};
const member = (patientId: string, firstName: string, o: { lastName?: string; age?: string; status?: string; dx?: string[] } = {}) =>
  prisma.householdMember.create({
    data: { patientId, firstName, lastName: o.lastName ?? "Pérez", relationship: "child", ageGroup: o.age ?? "6_12", status: o.status ?? "not_required", statedDiagnoses: o.dx ?? [], email: o.status === "pending" ? em(`m${firstName}`) : null },
  });
async function event(slug: string) {
  const e = await prisma.event.create({ data: { slug: `${tag}-${slug}`, titleEn: "T", titleEs: "T", eventDate: t(30), location: "X", status: "published" } });
  events.push(e.id);
  return e.id;
}
const sub = (n: string) => { const s = `google-oauth2|${tag}${n}`; subs.push(s); return s; };

// ───────────────────────── pure rules ─────────────────────────
test("names: accents, case and spacing do not matter; no first name never matches", () => {
  assert.equal(normName("  José  PÉREZ "), "jose perez");
  const k = { firstName: "José", lastName: "Pérez", ageGroup: "6_12" };
  assert.equal(memberKey(k), memberKey({ firstName: "jose", lastName: "perez", ageGroup: "6_12" }));
  assert.notEqual(memberKey(k), memberKey({ ...k, ageGroup: "13_17" }));
  assert.equal(memberKey({ firstName: null, lastName: null, ageGroup: "6_12" }), null);
});
test("member pairing: each matches once; a confirmed adult beats a pending one", () => {
  const m = (id: string, f: string, status = "not_required") => ({ id, firstName: f, lastName: "P", ageGroup: "6_12", status });
  const r = pairMembers([m("k1", "Ana"), m("k2", "Ana")], [m("d1", "Ana"), m("d2", "Ana"), m("d3", "Luz")]);
  assert.deepEqual(r.pairs.map((p) => `${p.keepId}:${p.dropId}`), ["k1:d1", "k2:d2"]);
  assert.deepEqual(r.unmatched.map((x) => x.id), ["d3"]);
  assert.equal(pickMember({ status: "pending" }, { status: "confirmed" }), "drop");
  assert.equal(pickMember({ status: "confirmed" }, { status: "pending" }), "keep");
  assert.equal(pickMember({ status: "not_required" }, { status: "not_required" }), "keep");
  assert.equal(pickMember({ status: "pending" }, { status: "declined" }), "keep");
});
test("RSVP rules in order: active, checked in, larger party, newer, tie", () => {
  const r = (o: Partial<{ cancelled: boolean; checkedIn: number; attendees: number; rsvpDate: Date }>) => ({ id: "x", cancelled: false, checkedIn: 0, attendees: 2, rsvpDate: t(-5), ...o });
  assert.deepEqual(pickRsvp(r({ cancelled: true }), r({})), { winner: "drop", rule: "active_over_cancelled" });
  assert.deepEqual(pickRsvp(r({}), r({ checkedIn: 1 })), { winner: "drop", rule: "checked_in" });
  assert.deepEqual(pickRsvp(r({ checkedIn: 1, attendees: 5 }), r({ checkedIn: 1, attendees: 2 })), { winner: "keep", rule: "more_attendees" });
  assert.deepEqual(pickRsvp(r({ rsvpDate: t(-9) }), r({ rsvpDate: t(-1) })), { winner: "drop", rule: "more_recent" });
  assert.deepEqual(pickRsvp(r({}), r({})), { winner: "keep", rule: "tie_keeps_survivor" });
});
test("invitation rules: answered > sent > removed > pending; a removal is never undone by a never-sent invite", () => {
  assert.equal(pickInvitation({ status: "pending" }, { status: "removed" }).winner, "drop");
  assert.equal(pickInvitation({ status: "removed" }, { status: "pending" }).winner, "keep");
  assert.equal(pickInvitation({ status: "removed" }, { status: "sent" }).winner, "drop");
  assert.equal(pickInvitation({ status: "sent" }, { status: "rsvp_yes" }).winner, "drop");
  assert.equal(pickInvitation({ status: "sent" }, { status: "removed" }).rule, "answered_or_sent");
  assert.equal(pickInvitation({ status: "pending" }, { status: "removed" }).rule, "removal_kept");
  assert.equal(pickInvitation({ status: "sent" }, { status: "sent" }).rule, "tie_keeps_survivor");
});
test("check-ins: earlier arrival wins, headcount is the larger", () => {
  const r = pickCheckIn({ checkInTime: t(2), headcount: 3 }, { checkInTime: t(1), headcount: 4 });
  assert.deepEqual([r.winner, r.headcount], ["drop", 4]);
  assert.equal(pickCheckIn({ checkInTime: t(1), headcount: null }, { checkInTime: t(2), headcount: null }).headcount, null);
});
test("consents: the most restrictive wins; a refusal is appended only when time order would flip a no to a yes", () => {
  const c = (type: string, granted: boolean, day: number) => ({ type, granted, createdAt: t(day) });
  const res = resolveConsents([c("media", true, -1), c("data_and_contact", true, -5), c("sms", false, -3)], [c("media", false, -10), c("data_and_contact", true, -4), c("newsletter", true, -2)]);
  const by = Object.fromEntries(res.map((x) => [x.type, x]));
  assert.deepEqual([by.media.result, by.media.conflict, by.media.appendRefusal], [false, true, true], "older no + newer yes: still no, and a refusal is recorded");
  assert.deepEqual([by.data_and_contact.result, by.data_and_contact.conflict, by.data_and_contact.appendRefusal], [true, false, false]);
  assert.deepEqual([by.sms.result, by.sms.appendRefusal], [false, false], "a no with nothing newer needs no extra row");
  assert.equal(by.newsletter.result, true, "one yes, never recorded on the other side: yes");
  const never = resolveConsents([], []);
  assert.ok(never.every((x) => x.result === null && !x.appendRefusal), "a merge never opts anyone in");
});
test("contact choice: survivor by default, alias for the other email, phone discarded", () => {
  assert.deepEqual(resolveEmail("A@x.org", "b@x.org"), { primary: "a@x.org", alias: "b@x.org", conflict: true });
  assert.deepEqual(resolveEmail("a@x.org", "b@x.org", "other"), { primary: "b@x.org", alias: "a@x.org", conflict: true });
  assert.deepEqual(resolveEmail(null, "b@x.org"), { primary: "b@x.org", alias: null, conflict: false });
  assert.deepEqual(resolveEmail("a@x.org", "A@X.org"), { primary: "a@x.org", alias: null, conflict: false });
  assert.deepEqual(resolvePhone("+1", "+2", "other"), { primary: "+2", conflict: true });
  assert.deepEqual(resolvePhone(null, "+2"), { primary: "+2", conflict: false });
});
test("duplicate pairs: flag, email (any case), phone; dismissed pairs are left out", () => {
  const rec = (id: string, email: string | null, phone: string | null, of: string | null = null) => ({ id, email, phone, possibleDuplicateOfId: of });
  const all = candidatePairs([rec("a", "X@y.org", "1"), rec("b", "x@y.org", null), rec("c", null, "1"), rec("d", "d@y.org", null, "a"), rec("e", "e@y.org", "9")], new Set());
  const key = (p: { aId: string; bId: string }) => `${p.aId}${p.bId}`;
  assert.deepEqual(all.map(key).sort(), ["ab", "ac", "ad"]);
  assert.deepEqual(all.find((p) => key(p) === "ab")?.reasons, ["same_email"]);
  assert.deepEqual(candidatePairs([rec("a", "x@y.org", null), rec("b", "x@y.org", null)], new Set(["a|b"])), []);
  assert.deepEqual(pairKey("z", "a"), ["a", "z"]);
});
test("board consent rules: reason required; withdraw always; turn on only when the family asked", () => {
  assert.deepEqual(checkBoardChange(true, false, undefined), { ok: false, error: "bad_reason" });
  assert.deepEqual(checkBoardChange(true, false, "nope"), { ok: false, error: "bad_reason" });
  assert.deepEqual(checkBoardChange(true, false, "OTHER"), { ok: true }, "withdrawing with OTHER is allowed");
  assert.deepEqual(checkBoardChange(null, false, "OTHER"), { ok: true });
  assert.deepEqual(checkBoardChange(false, true, "OTHER"), { ok: false, error: "family_ask_required" });
  assert.deepEqual(checkBoardChange(null, true, "OTHER"), { ok: false, error: "family_ask_required" });
  for (const r of ["FAMILY_ASKED_PHONE", "FAMILY_ASKED_EMAIL", "FAMILY_ASKED_IN_PERSON"]) assert.deepEqual(checkBoardChange(false, true, r), { ok: true });
  assert.deepEqual(checkBoardChange(true, true, "FAMILY_ASKED_PHONE"), { ok: false, error: "no_change" });
});

// ───────────────────────── the trigger ─────────────────────────
test("append-only trigger: UPDATE is rejected everywhere except the transaction-local merge window, and even there only owner columns move", async () => {
  const a = await person("trg1"), b = await person("trg2");
  const rec = await prisma.consentRecord.create({ data: { patientId: a, type: "media", granted: true, textVersion: "v3", method: "web" } });
  const run = async (q: string, window: boolean) => {
    try {
      await prisma.$transaction(async (tx) => {
        if (window) await tx.$executeRawUnsafe(`SELECT set_config('hoep.merge', 'on', true)`);
        await tx.$executeRawUnsafe(q);
      });
      return "ok";
    } catch { return "rejected"; }
  };
  assert.equal(await run(`UPDATE consent_records SET granted = false WHERE id = '${rec.id}'`, false), "rejected");
  assert.equal(await run(`UPDATE consent_records SET "patientId" = '${b}' WHERE id = '${rec.id}'`, false), "rejected", "re-pointing needs the window");
  assert.equal(await run(`UPDATE consent_records SET granted = false WHERE id = '${rec.id}'`, true), "rejected", "the window never lets the value change");
  assert.equal(await run(`UPDATE consent_records SET "createdAt" = now() WHERE id = '${rec.id}'`, true), "rejected");
  assert.equal(await run(`UPDATE consent_records SET "reasonCode" = 'X' WHERE id = '${rec.id}'`, true), "rejected");
  assert.equal(await run(`UPDATE consent_records SET "patientId" = '${b}' WHERE id = '${rec.id}'`, true), "ok");
  assert.equal((await prisma.consentRecord.findUnique({ where: { id: rec.id } }))?.patientId, b);
  // the window closed with that transaction
  assert.equal(await run(`UPDATE consent_records SET "patientId" = '${a}' WHERE id = '${rec.id}'`, false), "rejected");
  assert.equal((await prisma.consentRecord.findUnique({ where: { id: rec.id } }))?.granted, true);
});

// ───────────────────────── fixtures ─────────────────────────
test("board record into household: the dropped record recorded consents for others, and the merge no longer fails", async () => {
  const hh = await person("hh1", { email: em("hh1") });
  const board = await boardPerson("brd1");
  const other = await person("otherfam");
  const kid = await member(other, "Nico");
  const adult = await member(other, "Rosa", { age: "18_plus", status: "confirmed" });
  // the board member recorded phone consents for another household, and for an adult member
  const c1 = await prisma.consentRecord.create({ data: { patientId: other, type: "media", granted: true, textVersion: "v3", method: "phone", recordedByBoardUserId: board } });
  const c2 = await prisma.consentRecord.create({ data: { householdMemberId: adult.id, type: "data_and_contact", granted: true, textVersion: "v3", method: "phone", recordedByBoardUserId: board } });
  void kid;
  const org = await prisma.userIdentity.create({ data: { auth0Sub: sub("o1"), provider: "google-oauth2", email: `${tag}.brd1@hemoelpaso.org`, emailVerified: true, patientId: board, linkedVia: "auto" } });
  const actor = await boardPerson("actor1", "SECRETARY");

  const r = await mergePeople(board, hh, actor);
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.ok(r.ok && r.keptId === hh && r.droppedId === board);
  // the SAME consent rows now say the survivor recorded them (original ids and dates)
  for (const id of [c1.id, c2.id]) assert.equal((await prisma.consentRecord.findUnique({ where: { id } }))?.recordedByBoardUserId, hh);
  assert.equal((await prisma.consentRecord.findUnique({ where: { id: c1.id } }))?.method, "phone");
  const kept = await prisma.patient.findUnique({ where: { id: hh }, include: { boardRoles: true, identities: true } });
  assert.equal(kept?.role, "board");
  assert.deepEqual(kept?.boardRoles.map((b) => b.role), ["PRESIDENT"]);
  assert.deepEqual(kept?.identities.map((i) => i.id), [org.id]);

  const tomb = await prisma.patient.findUnique({ where: { id: board }, include: { contactProfile: true, boardRoles: true, identities: true, consentRecords: true } });
  assert.equal(tomb?.role, "merged");
  assert.equal(tomb?.mergedIntoId, hh);
  assert.ok(tomb?.mergedAt);
  assert.deepEqual([tomb?.email, tomb?.contactProfile, tomb?.boardRoles.length, tomb?.identities.length, tomb?.consentRecords.length], [null, null, 0, 0, 0]);
  assert.equal(await prisma.patient.count({ where: { id: board, ...PATIENT_ONLY } }), 0, "a tombstone is never a household");

  const log = await prisma.auditLog.findFirst({ where: { action: "PATIENT_MERGED", resourceId: hh }, orderBy: { createdAt: "desc" } });
  const text = `${log?.details} ${JSON.stringify(log?.changes)}`;
  assert.ok(!/@/.test(text), "no email address in the audit row");
  assert.ok(text.includes(c1.id) && text.includes(org.id), "every moved row is listed by id");
});

test("two households for one family: duplicate members fold into one, attendance and consents follow, the other address becomes an alias", async () => {
  const h1 = await person("fam1", { email: em("fam1"), phone: "+19155550111", dx: ["hemophilia_a"], consents: [{ type: "data_and_contact", granted: true, day: -20 }, { type: "media", granted: true, day: -2 }] });
  const h2 = await person("fam2", { email: em("fam2"), phone: "+19155550122", dx: ["von_willebrand"], consents: [{ type: "data_and_contact", granted: true, day: -25 }, { type: "media", granted: false, day: -10 }] });
  const jose1 = await member(h1, "José", { dx: ["hemophilia_a"] });
  const jose2 = await member(h2, "jose", { lastName: "perez", dx: ["carrier"] });
  const ana = await member(h2, "Ana", { age: "0_5" });
  const luis1 = await member(h1, "Luis", { age: "18_plus", status: "pending" });
  const luis2 = await member(h2, "Luis", { age: "18_plus", status: "confirmed" });
  const luisConsent = await prisma.consentRecord.create({ data: { householdMemberId: luis2.id, type: "media", granted: true, textVersion: "v3", method: "web" } });
  const e1 = await event("e1");
  // same event on both: the second (h2) has José checked in
  const r1 = await prisma.rsvp.create({ data: { eventId: e1, patientId: h1, attendeeCount: 2, attendees: { create: [{ isPrimary: true }, { householdMemberId: jose1.id }] } } });
  const r2 = await prisma.rsvp.create({ data: { eventId: e1, patientId: h2, attendeeCount: 3, attendees: { create: [{ isPrimary: true }, { householdMemberId: jose2.id, checkedInAt: new Date() }, { householdMemberId: ana.id }] } } });
  const actor = await boardPerson("actor2", "SECRETARY");

  const before = await planMerge(prisma, h1, h2, { keepId: h1 });
  assert.ok(before.ok);
  const kinds = before.ok ? before.plan.conflicts.map((c) => c.kind).sort() : [];
  for (const k of ["consent", "diagnoses", "email", "member", "phone", "rsvp"]) assert.ok(kinds.includes(k as never), `preview lists a ${k} conflict`);
  assert.ok(before.ok && before.plan.conflicts.every((c) => !/hemophilia|von_willebrand|carrier/.test(JSON.stringify(c))), "the preview never shows diagnosis values");

  const r = await mergePeople(h1, h2, actor, h1);
  assert.ok(r.ok, JSON.stringify(r));
  const kept = await prisma.patient.findUnique({ where: { id: h1 }, include: { householdMembers: { include: { consentRecords: true } }, contactProfile: true, emailAliases: true, rsvps: { include: { attendees: true } } } });
  // members: José once (the survivor's row), Ana moved, Luis once and CONFIRMED (the further-along row wins)
  const names = kept!.householdMembers.map((m) => m.firstName?.toLowerCase()).sort();
  assert.deepEqual(names, ["ana", "josé", "luis"]);
  assert.equal(kept!.familySize, 4);
  assert.equal(kept!.householdMembers.find((m) => m.firstName === "Luis")?.status, "confirmed");
  assert.ok(kept!.householdMembers.find((m) => m.firstName === "Luis")?.consentRecords.some((c) => c.id === luisConsent.id), "the adult's own consent moved with them");
  assert.equal(await prisma.householdMember.count({ where: { id: { in: [jose2.id, luis1.id] } } }), 0, "the duplicate rows are gone");
  const josé = kept!.householdMembers.find((m) => m.firstName === "José")!;
  assert.deepEqual([...josé.statedDiagnoses].sort(), ["carrier", "hemophilia_a"], "a minor's diagnoses are united");
  // RSVP: h2's (checked in) wins; h1's is set aside; attendance re-points to the surviving José
  assert.equal(kept!.rsvps.length, 1);
  assert.equal(kept!.rsvps[0].id, r2.id);
  assert.equal(await prisma.rsvp.count({ where: { id: r1.id } }), 0);
  assert.equal(kept!.rsvps[0].attendees.find((a) => a.checkedInAt)?.householdMemberId, josé.id);
  assert.equal(kept!.rsvps[0].attendeeCount, 3);
  // contact details and aliases
  assert.equal(kept!.email, em("fam1"));
  assert.equal(kept!.contactProfile?.phone, "+19155550111");
  assert.deepEqual(kept!.emailAliases.map((a) => a.email), [em("fam2")]);
  assert.deepEqual((await candidatesForEmail(em("fam2"))).map((c) => c.id), [h1], "a first sign-in with the old address finds the surviving household");
  assert.deepEqual(await candidatesForEmail(em("fam1")).then((c) => c.map((x) => x.id)), [h1]);
  // diagnoses of the primary are united (never logged)
  assert.deepEqual([...(await prisma.patient.findUnique({ where: { id: h1 } }))!.primaryDiagnoses].sort(), ["hemophilia_a", "von_willebrand"]);
  // consents: all rows kept, one refusal appended (older no, newer yes -> no), data_and_contact untouched
  const rows = await prisma.consentRecord.findMany({ where: { patientId: h1 } });
  assert.equal(rows.length, 5);
  assert.equal(currentConsents(rows).media, false);
  assert.equal(currentConsents(rows).data_and_contact, true);
  const refusal = rows.find((x) => x.method === "merge");
  assert.deepEqual([refusal?.granted, refusal?.reasonCode, refusal?.recordedByBoardUserId], [false, "MERGE", actor]);
  // audit: ids of what moved and what was set aside, no personal data
  const log = await prisma.auditLog.findFirst({ where: { action: "PATIENT_MERGED", resourceId: h1 }, orderBy: { createdAt: "desc" } });
  const text = JSON.stringify(log?.changes);
  assert.ok(text.includes(r1.id) && text.includes(jose2.id) && text.includes(luis1.id));
  assert.ok(!/@|José|Luis|Ana|hemophilia/.test(`${log?.details}${text}`));
});

test("conflicting RSVPs and check-ins: cancelled loses to active; the set-aside RSVP is in the audit row", async () => {
  const a = await person("rv1"), b = await person("rv2");
  const e = await event("e2");
  const ra = await prisma.rsvp.create({ data: { eventId: e, patientId: a, attendeeCount: 4, cancelledAt: new Date(), status: "cancelled" } });
  const rb = await prisma.rsvp.create({ data: { eventId: e, patientId: b, attendeeCount: 1, attendees: { create: [{ isPrimary: true }] } } });
  const ca = await prisma.checkIn.create({ data: { eventId: e, patientId: a, checkInTime: t(1), sessionToken: `${tag}s1`, sessionExpiresAt: t(2), headcount: 2 } });
  const cb = await prisma.checkIn.create({ data: { eventId: e, patientId: b, checkInTime: t(0), sessionToken: `${tag}s2`, sessionExpiresAt: t(2), headcount: 5 } });
  const actor = await boardPerson("actor3");
  const r = await mergePeople(a, b, actor, a);
  assert.ok(r.ok);
  assert.equal(await prisma.rsvp.count({ where: { id: ra.id } }), 0);
  assert.equal((await prisma.rsvp.findUnique({ where: { id: rb.id } }))?.patientId, a);
  const ci = await prisma.checkIn.findMany({ where: { eventId: e, patientId: a } });
  assert.deepEqual(ci.map((c) => [c.id, c.headcount]), [[cb.id, 5]], "the earlier check-in survives with the larger headcount");
  assert.equal(await prisma.checkIn.count({ where: { id: ca.id } }), 0);
  const log = await prisma.auditLog.findFirst({ where: { action: "PATIENT_MERGED", resourceId: a }, orderBy: { createdAt: "desc" } });
  assert.ok(JSON.stringify(log?.changes).includes(ra.id) && JSON.stringify(log?.changes).includes(ca.id));
});

test("consents on both and identities on both: every row survives, the most restrictive applies, no sign-in is lost", async () => {
  const a = await person("ci1", { consents: [{ type: "data_and_contact", granted: true, day: -9 }, { type: "sms", granted: true, day: -3 }] });
  const b = await person("ci2", { consents: [{ type: "data_and_contact", granted: false, day: -12 }, { type: "newsletter", granted: true, day: -2 }] });
  const ids = [
    await prisma.userIdentity.create({ data: { auth0Sub: sub("i1"), provider: "google-oauth2", email: em("ci1"), emailVerified: true, patientId: a, linkedVia: "auto" } }),
    await prisma.userIdentity.create({ data: { auth0Sub: sub("i2"), provider: "apple", email: em("ci1"), emailVerified: true, patientId: a, linkedVia: "admin" } }),
    await prisma.userIdentity.create({ data: { auth0Sub: sub("i3"), provider: "google-oauth2", email: em("ci2"), emailVerified: true, patientId: b, linkedVia: "backfill" } }),
    await prisma.userIdentity.create({ data: { auth0Sub: sub("i4"), provider: "facebook", email: em("ci2"), emailVerified: true, patientId: b, linkedVia: "auto" } }),
  ];
  const original = (await prisma.consentRecord.findMany({ where: { patientId: { in: [a, b] } } })).map((c) => c.id).sort();
  const actor = await boardPerson("actor4");
  assert.ok((await mergePeople(a, b, actor, a)).ok);
  const rows = await prisma.consentRecord.findMany({ where: { patientId: a } });
  for (const id of original) assert.ok(rows.some((r) => r.id === id), "original consent rows moved, not copied");
  assert.equal(rows.length, original.length + 1, "one refusal appended: the no from b would otherwise be overridden by a's newer yes");
  assert.equal(currentConsents(rows).data_and_contact, false);
  assert.equal(await prisma.consentRecord.count({ where: { patientId: b } }), 0);
  const kept = await prisma.userIdentity.findMany({ where: { patientId: a }, orderBy: { auth0Sub: "asc" } });
  assert.deepEqual(kept.map((i) => i.id).sort(), ids.map((i) => i.id).sort());
  assert.equal(kept.find((i) => i.id === ids[2].id)?.linkedVia, "backfill", "grandfathered mark survives");
  assert.equal(kept.find((i) => i.id === ids[3].id)?.linkedVia, "merge");
});

test("removed invitations: a removal moves with the household and is never undone by a merge or by matching", async () => {
  const a = await person("iv1"), b = await person("iv2");
  const [e1, e2, e3, e4] = [await event("i1"), await event("i2"), await event("i3"), await event("i4")];
  const inv = (eventId: string, patientId: string, status: string, n: string) =>
    prisma.invitation.create({ data: { eventId, patientId, status, tokenHash: `${tag}${n}`, ...(status === "removed" ? { removedAt: new Date(), removalReason: "not_a_fit" } : {}) } });
  const iA2 = await inv(e2, a, "pending", "a2"), iB1 = await inv(e1, b, "removed", "b1"), iB2 = await inv(e2, b, "removed", "b2");
  const iA3 = await inv(e3, a, "sent", "a3"), iB3 = await inv(e3, b, "removed", "b3");
  const iA4 = await inv(e4, a, "removed", "a4"), iB4 = await inv(e4, b, "rsvp_yes", "b4");
  const actor = await boardPerson("actor5");
  assert.ok((await mergePeople(a, b, actor, a)).ok);

  const rows = await prisma.invitation.findMany({ where: { patientId: a }, orderBy: { eventId: "asc" } });
  const st = (eventId: string) => rows.filter((r) => r.eventId === eventId).map((r) => r.status);
  assert.deepEqual(st(e1), ["removed"], "b's removal moved");
  assert.equal(rows.find((r) => r.id === iB1.id)?.removalReason, "not_a_fit");
  assert.deepEqual(st(e2), ["removed"], "removed beats a never-sent invitation");
  assert.equal(rows.find((r) => r.eventId === e2)?.id, iB2.id);
  assert.deepEqual(st(e3), ["sent"], "sent beats removed");
  assert.deepEqual(st(e4), ["rsvp_yes"], "answered beats removed");
  assert.deepEqual([iA2.id, iB3.id, iA4.id].map((id) => rows.some((r) => r.id === id)), [false, false, false]);
  assert.ok(rows.some((r) => r.id === iA3.id) && rows.some((r) => r.id === iB4.id));
  // matching again never recreates or re-opens anything
  const count = await prisma.invitation.count({ where: { patientId: a } });
  for (const id of [e1, e2, e3, e4]) await generateInvitations(id);
  assert.equal(await prisma.invitation.count({ where: { patientId: a } }), count);
  assert.equal((await prisma.invitation.findUnique({ where: { id: iB1.id } }))?.status, "removed");
});

test("preview writes nothing; a changed record makes a stale confirm refuse; two households need a choice", async () => {
  const a = await person("pv1"), b = await person("pv2");
  await member(a, "Ana"); await member(b, "Beto");
  const snap = async () => JSON.stringify([await prisma.patient.count({ where: { id: { in: [a, b] } } }), await prisma.householdMember.count({ where: { patientId: { in: [a, b] } } }), await prisma.consentRecord.count({ where: { patientId: { in: [a, b] } } }), (await prisma.patient.findMany({ where: { id: { in: [a, b] } }, select: { role: true, mergedIntoId: true } }))]);
  const before = await snap();
  const needs = await planMerge(prisma, a, b);
  assert.deepEqual([needs.ok, !needs.ok && needs.error, !needs.ok && needs.summaries?.length], [false, "needs_keep_choice", 2]);
  const plan = await planMerge(prisma, a, b, { keepId: b });
  assert.ok(plan.ok);
  assert.equal(await snap(), before, "previewing changed nothing");
  const stale = plan.ok ? plan.plan.fingerprint : "";
  await member(a, "Carla"); // the record changes after the officer looked
  const refused = await mergePeople(a, b, await boardPerson("actor6"), b, { expectFingerprint: stale });
  assert.deepEqual([refused.ok, !refused.ok && refused.error], [false, "plan_changed"]);
  assert.equal(await prisma.patient.count({ where: { id: { in: [a, b] }, mergedIntoId: null } }), 2, "nothing was merged");
  const fresh = await planMerge(prisma, a, b, { keepId: b });
  assert.ok((await mergePeople(a, b, await boardPerson("actor6b"), b, { expectFingerprint: fresh.ok ? fresh.plan.fingerprint : "" })).ok);
  const admin = await prisma.patient.create({ data: { email: em("adm"), role: "admin" } });
  patients.push(admin.id);
  const c = await person("pv3");
  assert.deepEqual([(await mergePeople(admin.id, c, "x")).ok, !(await mergePeople(admin.id, c, "x")).ok], [false, true]);
  const again = await mergePeople(a, b, "x", b);
  assert.deepEqual([again.ok, !again.ok && again.error], [false, "already_merged"]);
});

test("tombstone: an old unsubscribe link applies to the survivor; tombstones are purged after 12 months, not before", async () => {
  const a = await person("tb1"), b = await person("tb2");
  const token = generateUnsubscribeToken(b);
  assert.ok((await mergePeople(a, b, await boardPerson("actor7"), a)).ok);
  const res = await unsubscribe(new NextRequest(`http://localhost/api/unsubscribe?token=${token}`));
  assert.ok(res.headers.get("location")?.includes("success=1"));
  assert.equal((await prisma.patient.findUnique({ where: { id: a } }))?.emailOptOut, true);
  // earlier tombstones follow a later merge
  const c = await person("tb3");
  assert.ok((await mergePeople(a, c, await boardPerson("actor8"), c)).ok);
  assert.equal((await prisma.patient.findUnique({ where: { id: b } }))?.mergedIntoId, c, "a chain collapses to the final survivor");
  // retention
  const old = new Date(Date.now() - 366 * DAY), young = new Date(Date.now() - 300 * DAY);
  await prisma.patient.update({ where: { id: b }, data: { mergedAt: old } });
  await prisma.patient.update({ where: { id: a }, data: { mergedAt: young } });
  const out = await purgeMergedTombstones();
  assert.ok(out.tombstones >= 1);
  assert.equal(await prisma.patient.count({ where: { id: b } }), 0, "past 12 months: purged");
  assert.equal(await prisma.patient.count({ where: { id: a } }), 1, "inside 12 months: kept");
  assert.equal(await prisma.patient.count({ where: { id: c } }), 1);
  const log = await prisma.auditLog.findFirst({ where: { action: "MERGED_RECORDS_PURGED" }, orderBy: { createdAt: "desc" } });
  assert.ok(log && !/@/.test(JSON.stringify(log.changes)));
  await prisma.auditLog.deleteMany({ where: { action: "MERGED_RECORDS_PURGED", createdAt: { gte: new Date(Date.now() - 60_000) } } });
});

test("duplicates list: same email and same phone are found; dismissing keeps a pair off the list, and merges are not offered twice", async () => {
  const email = em("dupshared");
  const a = await person("dp1", { email, phone: "+19155559900" }), b = await person("dp2", { email: email.toUpperCase(), phone: "+19155559911" });
  const c = await person("dp3", { phone: "+19155559900" });
  const mine = async () => (await listDuplicatePairs()).filter((p) => [a, b, c].includes(p.aId) && [a, b, c].includes(p.bId));
  const found = await mine();
  const key = (x: { aId: string; bId: string }) => pairKey(x.aId, x.bId).join("|");
  assert.deepEqual(found.map(key).sort(), [pairKey(a, b).join("|"), pairKey(a, c).join("|")].sort());
  assert.deepEqual(found.find((p) => key(p) === pairKey(a, c).join("|"))?.reasons, ["same_phone"]);
  assert.equal(await dismissDuplicate(a, b, a), true);
  assert.deepEqual((await mine()).map(key), [pairKey(a, c).join("|")]);
  const [x, y] = pairKey(a, b);
  assert.equal(await prisma.duplicateDismissal.count({ where: { patientAId: x, patientBId: y } }), 1);
  const log = await prisma.auditLog.findFirst({ where: { action: "PATIENT_DUPLICATE_DISMISSED", resourceId: x }, orderBy: { createdAt: "desc" } });
  assert.ok(log && !/@/.test(JSON.stringify(log.changes)));
  // a dismissal follows its record through a merge
  const d = await person("dp4", { email: em("dp4") });
  assert.equal(await dismissDuplicate(a, c, d), true);
  assert.ok((await mergePeople(c, a, await boardPerson("actor9"), a)).ok);
  assert.equal(await prisma.duplicateDismissal.count({ where: { OR: [{ patientAId: c }, { patientBId: c }] } }), 0);
  const [m, n] = pairKey(a, d);
  assert.equal(await prisma.duplicateDismissal.count({ where: { patientAId: m, patientBId: n } }), 1);
});

// ───────────────────────── officer consent controls ─────────────────────────
test("officer consent changes: append-only, reason rules, immediate effect on non-essential email, ids-only audit", async () => {
  const p = await person("bc1", { consents: [{ type: "data_and_contact", granted: true, day: -10 }, { type: "media", granted: true, day: -10 }] });
  const noPhone = await person("bc2", { phone: null });
  const officer = await boardPerson("actor10");
  const before = await prisma.consentRecord.findMany({ where: { patientId: p }, orderBy: { createdAt: "asc" } });

  const noReason = await recordBoardConsent(officer, p, { type: "media", granted: false, reason: undefined });
  assert.deepEqual([noReason.ok, !noReason.ok && noReason.error], [false, "bad_reason"]);
  const optIn = await recordBoardConsent(officer, p, { type: "sms", granted: true, reason: "OTHER" });
  assert.deepEqual([optIn.ok, !optIn.ok && optIn.error], [false, "family_ask_required"], "the board never opts a family in on its own");
  const asked = await recordBoardConsent(officer, p, { type: "newsletter", granted: true, reason: "FAMILY_ASKED_EMAIL" });
  assert.ok(asked.ok);
  const sms = await recordBoardConsent(officer, p, { type: "sms", granted: true, reason: "FAMILY_ASKED_PHONE" });
  assert.ok(sms.ok);
  const needsPhone = await recordBoardConsent(officer, noPhone, { type: "sms", granted: true, reason: "FAMILY_ASKED_PHONE" });
  assert.deepEqual([needsPhone.ok, !needsPhone.ok && needsPhone.error], [false, "needs_phone"]);
  const same = await recordBoardConsent(officer, p, { type: "media", granted: true, reason: "FAMILY_ASKED_PHONE" });
  assert.deepEqual([same.ok, !same.ok && same.error], [false, "no_change"]);
  assert.deepEqual((await recordBoardConsent(officer, p, { type: "bogus", granted: false, reason: "OTHER" })).ok, false);

  // withdrawing data_and_contact is allowed with any reason and stops non-essential email at once
  const recs0 = await prisma.consentRecord.findMany({ where: { patientId: p } });
  assert.equal(blockedByWithdrawal("EVENT_INVITATION", recs0), false);
  const w = await recordBoardConsent(officer, p, { type: "data_and_contact", granted: false, reason: "OTHER" });
  assert.ok(w.ok);
  const recs = await prisma.consentRecord.findMany({ where: { patientId: p } });
  assert.equal(blockedByWithdrawal("EVENT_INVITATION", recs), true);
  assert.equal(blockedByWithdrawal("MEMBER_CONFIRMATION", recs), true);
  assert.equal(blockedByWithdrawal("RSVP_CONFIRMATION", recs), false, "an RSVP the person keeps still gets its confirmation");

  // nothing was edited: the old rows are byte-for-byte the same, new rows were appended
  for (const old of before) assert.deepEqual(recs.find((r) => r.id === old.id), old);
  const added = recs.filter((r) => !before.some((o) => o.id === r.id));
  assert.equal(added.length, 3);
  assert.ok(added.every((r) => r.method === "board" && r.recordedByBoardUserId === officer && r.textVersion === CONSENT_TEXT_VERSION && r.reasonCode));
  assert.equal(currentConsents(recs).data_and_contact, false);

  const audits = await prisma.auditLog.findMany({ where: { action: "CONSENT_CHANGED_BY_BOARD", patientId: officer, resourceId: { in: added.map((r) => r.id) } } });
  assert.equal(audits.length, 3);
  for (const a of audits) {
    const c = a.changes as Record<string, unknown>;
    assert.deepEqual(Object.keys(c).sort(), ["granted", "memberId", "patientId", "type"]);
    assert.ok(!/FAMILY_ASKED|OTHER|@/.test(JSON.stringify(a)), "audit holds ids, the type and on/off only");
  }
});

test("officer consent changes for adult members: confirmed adults only, on their own record", async () => {
  const p = await person("bm1");
  const ok = await member(p, "Rosa", { age: "18_plus", status: "confirmed" });
  const pending = await member(p, "Pablo", { age: "18_plus", status: "pending" });
  const minor = await member(p, "Nico");
  const officer = await boardPerson("actor11");
  await prisma.consentRecord.create({ data: { householdMemberId: ok.id, type: "media", granted: true, textVersion: "v3", method: "web" } });
  assert.ok((await recordBoardConsent(officer, p, { memberId: ok.id, type: "media", granted: false, reason: "OTHER" })).ok);
  const rows = await prisma.consentRecord.findMany({ where: { householdMemberId: ok.id } });
  assert.deepEqual(rows.map((r) => r.granted).sort(), [false, true]);
  assert.equal((await prisma.consentRecord.findMany({ where: { patientId: p } })).filter((r) => r.method === "board").length, 0, "the household's own consents were not touched");
  for (const m of [pending, minor]) assert.equal((await recordBoardConsent(officer, p, { memberId: m.id, type: "media", granted: false, reason: "OTHER" })).ok, false);
  assert.equal((await recordBoardConsent(officer, p, { memberId: ok.id, type: "sms", granted: true, reason: "FAMILY_ASKED_PHONE" })).ok, false, "members have no sms/newsletter consent");
  const other = await person("bm2");
  assert.equal((await recordBoardConsent(officer, other, { memberId: ok.id, type: "media", granted: false, reason: "OTHER" })).ok, false, "a member of another household is not reachable");
});
