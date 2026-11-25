/**
 * Family page edits + sign-in for every confirmed adult. Run: npm run check:portal-edits   (db-guard refuses production; DEV database)
 *
 *  - pure: the permission matrix (primary / adult / guardian), sign-in matching across primaries and adults
 *  - an adult signs in and sees the household but not another adult's consents or diagnoses
 *  - pending / declined adults and minors can't sign in; an email on both a primary and an adult is ambiguous
 *  - guardian rule: a non-guardian adult can't see or edit a minor's diagnoses; a designated guardian can once they attest
 *  - one adult can't remove another; an adult can leave (nothing kept); a family can't touch another household
 *  - an email change needs the link, from the same signed-in person, and the answer is neutral
 *  - adding an adult starts confirmation; removing a member cleans up future RSVPs
 *  - every change is logged with the acting person, field names and ids only
 * It creates throw-away rows (tagged) and deletes them.
 */
import "./_load-env";
import "./_react-global"; // the member confirmation email is a React Email template
import assert from "node:assert/strict";
import { test, after } from "node:test";
import { prisma } from "../src/lib/db";
import { can, canSeeAdultPrivate, isGuardianOf, needsAgeCheck, type Actor, type GuardianshipFacts } from "../src/lib/portal/permissions";
import { decideLink } from "../src/lib/identity/rules";
import { resolveForUser } from "../src/lib/identity/session";
import { candidatesForEmail } from "../src/lib/identity/link";
import { linkIdentity } from "../src/lib/identity/admin";
import { mergePeople } from "../src/lib/identity/merge";
import { loadPortalView } from "../src/lib/portal/view";
import { overEditLimit, type PortalCtx } from "../src/lib/portal/context";
import {
  acceptGuardianAttestation, addMember, confirmEmailChange, convertMinor, designateGuardian, editMinor, EMAIL_NEUTRAL_MESSAGE, leaveHousehold, removeMember,
  requestDeletion, requestEmailChange, revokeGuardian, setMinorDiagnoses, setOwnDiagnoses, updateAddress, updateProfile,
} from "../src/lib/portal/edit";
import { purgeEmailChangeRequests } from "../src/lib/retention";
import { recordPortalConsent } from "../src/lib/portal/service";
import { generateToken, hashToken } from "../src/lib/tokens";
import { CONSENT_TEXT_VERSION } from "../src/content/consent";

delete process.env.RESEND_API_KEY; // nothing in a test sends a real email

const DAY = 864e5;
const tag = `pe${Date.now()}`;
const startedAt = new Date();
const patients: string[] = [];
const events: string[] = [];
const subs: string[] = [];
const em = (n: string) => `${tag}.${n}@example.org`;
const sub = (n: string, provider = "google-oauth2") => { const s = `${provider}|${tag}${n}`; subs.push(s); return s; };
const user = (s: string, email: string, verified = true) => ({ sub: s, email, email_verified: verified });

after(async () => {
  await prisma.userIdentity.deleteMany({ where: { auth0Sub: { in: subs } } });
  await prisma.event.deleteMany({ where: { id: { in: events } } });
  await prisma.auditLog.deleteMany({ where: { OR: [{ patientId: { in: patients } }, { resourceId: { in: patients } }, { createdAt: { gte: startedAt }, actorType: "system", resourceType: { in: ["UserIdentity", "DuplicateNotice"] } }] } });
  await prisma.emailLog.deleteMany({ where: { sentAt: { gte: startedAt }, templateType: { in: ["DUPLICATE_SIGNIN_NOTICE", "EMAIL_CHANGE_CONFIRMATION", "MEMBER_LEFT_NOTICE", "DELETION_REQUEST_NOTICE", "MEMBER_CONFIRMATION"] } } });
  await prisma.patient.deleteMany({ where: { id: { in: patients } } });
  await prisma.$disconnect();
});

/** A household as registration makes it, plus the people in it. */
async function household(name: string, o: { email?: string | null; dx?: string[]; role?: string } = {}) {
  const p = await prisma.patient.create({
    data: {
      email: o.email === undefined ? em(name) : o.email, role: o.role ?? "patient", source: "web", registrationCompletedAt: new Date(), primaryDiagnoses: o.dx ?? ["hemophilia_a"], statedDiagnoses: o.dx ?? ["hemophilia_a"],
      contactProfile: { create: { firstName: name, lastName: tag, phone: "+19155550100", addressLine1: "1 Main St" } },
      consentRecords: { create: [{ type: "data_and_contact", granted: true, textVersion: "v4", method: "web" }, { type: "media", granted: true, textVersion: "v4", method: "web" }] },
    },
  });
  patients.push(p.id);
  const mem = (firstName: string, o2: { age?: string; status?: string; email?: string | null; dx?: string[]; rel?: string } = {}) =>
    prisma.householdMember.create({
      data: { patientId: p.id, firstName, lastName: tag, relationship: o2.rel ?? "child", ageGroup: o2.age ?? "6_12", status: o2.status ?? "not_required", statedDiagnoses: o2.dx ?? [], email: o2.email === undefined ? null : o2.email },
    });
  return { id: p.id, mem };
}
const primary = (id: string): PortalCtx => ({ householdId: id, actor: { kind: "primary" } });
const asMember = (id: string, memberId: string): PortalCtx => ({ householdId: id, actor: { kind: "member", memberId } });
const audits = (householdId: string, since = startedAt) => prisma.auditLog.findMany({ where: { patientId: householdId, actorType: "family", createdAt: { gte: since } }, orderBy: { createdAt: "asc" } });
async function event(slug: string) {
  const e = await prisma.event.create({ data: { slug: `${tag}-${slug}`, titleEn: "T", titleEs: "T", eventDate: new Date(Date.now() + 30 * DAY), location: "X", status: "published" } });
  events.push(e.id);
  return e.id;
}

// ───────────────────────── pure ─────────────────────────
const P: Actor = { kind: "primary" };
const A: Actor = { kind: "member", memberId: "adult1" };
const minor = { id: "kid1", ageGroup: "6_12", status: "not_required" };
const adult = { id: "adult2", ageGroup: "18_plus", status: "confirmed" };
const attested: GuardianshipFacts[] = [{ childMemberId: "kid1", guardianMemberId: "adult1", attestedAt: new Date() }];
const waiting: GuardianshipFacts[] = [{ childMemberId: "kid1", guardianMemberId: "adult1", attestedAt: null }];

test("permission matrix: what the primary and another confirmed adult can do", () => {
  for (const a of ["profile.edit_own", "email.edit_own", "consent.edit_own", "diagnoses.edit_own", "address.edit", "member.add"] as const) {
    assert.equal(can(P, a), true, `primary ${a}`);
    assert.equal(can(A, a), true, `adult ${a}`);
  }
  assert.equal(can(P, "minor.edit", { target: minor }), true);
  assert.equal(can(A, "minor.edit", { target: minor }), true, "any confirmed adult edits a minor's name, relationship, age group");
  assert.equal(can(A, "minor.edit", { target: adult }), false, "never another adult's row");
  // a minor's diagnoses, and converting
  for (const act of ["minor.diagnoses", "minor.convert"] as const) {
    assert.equal(can(P, act, { target: minor }), true);
    assert.equal(can(A, act, { target: minor, guardianships: [] }), false, "not a guardian");
    assert.equal(can(A, act, { target: minor, guardianships: waiting }), false, "designated but has not attested");
    assert.equal(can(A, act, { target: minor, guardianships: attested }), true, "designated and attested");
    assert.equal(can({ kind: "member", memberId: "adult9" }, act, { target: minor, guardianships: attested }), false, "another adult is not that guardian");
    assert.equal(can(P, act, { target: adult }), false, "only minors");
  }
  // removing, leaving, deleting
  assert.equal(can(P, "member.remove", { target: adult }), true);
  assert.equal(can(A, "member.remove", { target: adult }), false, "one adult can't remove another");
  assert.equal(can(A, "member.remove", { target: minor }), false);
  assert.equal(can(A, "household.leave"), true);
  assert.equal(can(P, "household.leave"), false);
  assert.deepEqual([can(P, "household.request_deletion"), can(A, "household.request_deletion"), can(P, "own.request_deletion"), can(A, "own.request_deletion")], [true, false, false, true]);
  assert.equal(can(P, "guardian.designate", { target: minor }), true);
  assert.equal(can(A, "guardian.designate", { target: minor }), false);
  assert.equal(isGuardianOf(P, "anything", []), true);
});
test("nobody sees another adult's private information", () => {
  assert.equal(canSeeAdultPrivate(P, { kind: "member", memberId: "adult1" }), false, "not even the primary");
  assert.equal(canSeeAdultPrivate(A, P), false);
  assert.equal(canSeeAdultPrivate(A, { kind: "member", memberId: "adult2" }), false);
  assert.equal(canSeeAdultPrivate(A, A), true);
  assert.equal(canSeeAdultPrivate(P, P), true);
});
test("age check nudge: only 13-17, only after a year", () => {
  const old = new Date(Date.now() - 400 * DAY), fresh = new Date(Date.now() - 10 * DAY);
  assert.equal(needsAgeCheck({ ageGroup: "13_17", updatedAt: old }), true);
  assert.equal(needsAgeCheck({ ageGroup: "13_17", updatedAt: fresh }), false);
  assert.equal(needsAgeCheck({ ageGroup: "6_12", updatedAt: old }), false);
});
test("sign-in matching: one person links; a primary and an adult sharing an address are several matches", () => {
  assert.deepEqual(decideLink(true, [{ id: "h1", memberId: "m1" }]), { kind: "link", patientId: "h1", memberId: "m1" });
  assert.deepEqual(decideLink(true, [{ id: "h1" }]), { kind: "link", patientId: "h1", memberId: null });
  assert.equal(decideLink(true, [{ id: "h1" }, { id: "h1", memberId: "m1" }]).kind, "ambiguous");
  assert.equal(decideLink(true, [{ id: "h1", memberId: "m1" }, { id: "h2", memberId: "m2" }]).kind, "ambiguous");
  assert.equal(decideLink(true, []).kind, "unmatched");
  assert.equal(decideLink(false, [{ id: "h1" }]).kind, "ignore");
});

// ───────────────────────── sign-in as an adult ─────────────────────────
test("a confirmed adult signs in with the email they confirmed, sees the household, but not another adult's consents or diagnoses", async () => {
  const h = await household("wf", { dx: ["hemophilia_a"] });
  const wife = await h.mem("Wife", { age: "18_plus", status: "confirmed", email: em("wifeA"), dx: ["carrier"], rel: "spouse_partner" });
  const other = await h.mem("Other", { age: "18_plus", status: "confirmed", email: em("otherA"), dx: ["von_willebrand"], rel: "sibling" });
  await prisma.consentRecord.createMany({ data: [{ householdMemberId: wife.id, type: "media", granted: true, textVersion: "v4", method: "web" }, { householdMemberId: other.id, type: "media", granted: false, textVersion: "v4", method: "web" }] });
  const kid = await h.mem("Kid", { dx: ["hemophilia_b"] });

  const s = await resolveForUser(user(sub("w1"), em("wifeA")));
  assert.equal(s.mode, "family");
  assert.equal(s.hasHousehold, true);
  assert.deepEqual(s.actor, { kind: "member", memberId: wife.id });
  assert.equal(s.patient?.id, h.id, "the household is the member's household");
  assert.deepEqual(s.patient?.activeRoles, []);
  const ident = await prisma.userIdentity.findUnique({ where: { auth0Sub: `google-oauth2|${tag}w1` } });
  assert.deepEqual([ident?.patientId, ident?.householdMemberId, ident?.linkedVia], [h.id, wife.id, "auto"]);

  const v = await loadPortalView(h.id, s.actor!);
  assert.ok(v);
  assert.deepEqual(v!.me.diagnoses, ["carrier"], "her own");
  assert.equal(v!.consents.media, true, "her own consent, not the other adult's no");
  const dump = JSON.stringify(v);
  assert.ok(!dump.includes("von_willebrand"), "another adult's diagnoses are not in what she is sent");
  assert.ok(!dump.includes("hemophilia_a"), "nor the primary's");
  assert.ok(!dump.includes("hemophilia_b"), "nor a minor's, because she is not that child's guardian");
  assert.ok(!dump.includes(em("otherA")), "nor another adult's email");
  assert.equal(v!.members.find((m) => m.id === kid.id)?.diagnoses, null);
  assert.equal(v!.members.find((m) => m.id === other.id)?.diagnoses, null);
  assert.deepEqual(v!.members.find((m) => m.id === other.id)?.canRemove, false);

  // the primary doesn't see the adults' private information either, only their own
  const pv = await loadPortalView(h.id, { kind: "primary" });
  const pdump = JSON.stringify(pv);
  assert.ok(!pdump.includes("carrier") && !pdump.includes("von_willebrand"), "the primary never sees another adult's diagnoses");
  assert.equal(pv!.members.find((m) => m.id === kid.id)?.diagnoses?.[0], "hemophilia_b", "but does see a minor's");
  assert.equal(pv!.consents.media, true);
});

test("a pending or declined adult, a minor, and a member's org-domain address do not link; an address on a primary AND an adult is ambiguous", async () => {
  const h = await household("pd");
  await h.mem("Pend", { age: "18_plus", status: "pending", email: em("pendA"), rel: "spouse_partner" });
  await h.mem("Gone", { age: "18_plus", status: "declined", email: em("goneA"), rel: "spouse_partner" });
  await h.mem("Kid", { age: "13_17", status: "not_required", email: em("kidA") });
  await h.mem("Org", { age: "18_plus", status: "confirmed", email: `${tag}.org@hemoelpaso.org`, rel: "other" });
  for (const n of ["pendA", "goneA", "kidA"]) {
    const s = await resolveForUser(user(sub(n), em(n)));
    assert.equal(s.mode, "none", `${n} can't sign in`);
    assert.equal(s.patient, null);
  }
  assert.deepEqual(await candidatesForEmail(`${tag}.org@hemoelpaso.org`), [], "an org address never matches a member");

  // same address on a primary and on a member of ANOTHER household: several matches, no link, officer notice
  const h2 = await household("amb", { email: em("shared") });
  const h3 = await household("amb2");
  await h3.mem("Shared", { age: "18_plus", status: "confirmed", email: em("shared"), rel: "spouse_partner" });
  assert.equal((await candidatesForEmail(em("shared"))).length, 2);
  const s = await resolveForUser(user(sub("shared"), em("shared")));
  assert.deepEqual([s.mode, s.patient], ["none", null]);
  assert.equal((await prisma.userIdentity.findUnique({ where: { auth0Sub: `google-oauth2|${tag}shared` } }))?.patientId, null);
  assert.ok(await prisma.auditLog.findFirst({ where: { resourceType: "DuplicateNotice", createdAt: { gte: startedAt } } }), "the officer notice was triggered");
  // the same address on the primary and a member of the SAME household is ambiguous too
  const h4 = await household("same", { email: em("both") });
  await h4.mem("Both", { age: "18_plus", status: "confirmed", email: em("both"), rel: "spouse_partner" });
  assert.equal((await resolveForUser(user(sub("both"), em("both")))).mode, "none");
  void h2;
});

test("President/VP can link a sign-in to a confirmed adult by hand; only a confirmed adult of that household", async () => {
  const h = await household("lk");
  const wife = await h.mem("Wife", { age: "18_plus", status: "confirmed", email: null, rel: "spouse_partner" }); // confirmed by phone: no email
  const pend = await h.mem("Pend", { age: "18_plus", status: "pending", email: em("lkp"), rel: "spouse_partner" });
  const officer = await prisma.patient.create({ data: { email: em("officer"), role: "board" } });
  patients.push(officer.id);
  const ident = await prisma.userIdentity.create({ data: { auth0Sub: sub("lk1", "apple"), provider: "apple", email: em("hidden"), emailVerified: true } });
  assert.equal((await linkIdentity(ident.id, h.id, { id: officer.id }, pend.id)).ok, false, "pending adult");
  const other = await household("lk2");
  assert.equal((await linkIdentity(ident.id, other.id, { id: officer.id }, wife.id)).ok, false, "a member of a different household");
  assert.equal((await linkIdentity(ident.id, h.id, { id: officer.id }, wife.id)).ok, true);
  const s = await resolveForUser(user(`apple|${tag}lk1`, em("hidden")));
  assert.deepEqual([s.mode, s.actor], ["family", { kind: "member", memberId: wife.id }]);
});

test("a member sign-in is never board mode, even when the household's primary record holds a board role", async () => {
  const h = await household("bd", { role: "board" });
  await prisma.boardRole.create({ data: { patientId: h.id, role: "SECRETARY", assignedBy: "test" } });
  const wife = await h.mem("Wife", { age: "18_plus", status: "confirmed", email: `${tag}.wife@hemoelpaso.org`.replace("hemoelpaso.org", "example.org"), rel: "spouse_partner" });
  const s = await resolveForUser(user(sub("bd1"), wife.email!));
  assert.equal(s.mode, "family");
  assert.deepEqual(s.patient?.activeRoles, []);
  assert.equal(s.patient?.role, "patient");
});

test("database guards: a member identity needs a household, and a removed member can never turn into the primary", async () => {
  const h = await household("db");
  const m = await h.mem("Wife", { age: "18_plus", status: "confirmed", email: em("dbw"), rel: "spouse_partner" });
  await assert.rejects(() => prisma.userIdentity.create({ data: { auth0Sub: sub("db0"), provider: "apple", email: "x@y.org", householdMemberId: m.id } }), "check constraint");
  const ident = await prisma.userIdentity.create({ data: { auth0Sub: sub("db1"), provider: "apple", email: "x@y.org", patientId: h.id, householdMemberId: m.id } });
  await prisma.householdMember.delete({ where: { id: m.id } });
  assert.equal(await prisma.userIdentity.count({ where: { id: ident.id } }), 0, "cascade: the identity goes with the member");
});

// ───────────────────────── guardians ─────────────────────────
test("guardian rule: a non-guardian adult can't see or edit a minor's diagnoses; a designated guardian can, after attesting", async () => {
  const h = await household("gd");
  const mom = await h.mem("Mom", { age: "18_plus", status: "confirmed", email: em("gdmom"), rel: "spouse_partner" });
  const aunt = await h.mem("Aunt", { age: "18_plus", status: "confirmed", email: em("gdaunt"), rel: "sibling" });
  const kid = await h.mem("Kid", { dx: ["hemophilia_b"] });
  const P1 = primary(h.id), Mom = asMember(h.id, mom.id), Aunt = asMember(h.id, aunt.id);

  const kidDx = async (c: PortalCtx) => (await loadPortalView(h.id, c.actor))!.members.find((m) => m.id === kid.id)!.diagnoses;
  assert.equal(await kidDx(Mom), null);
  assert.equal((await setMinorDiagnoses(Mom, kid.id, ["other"])).ok, false);
  assert.deepEqual((await prisma.householdMember.findUnique({ where: { id: kid.id } }))?.statedDiagnoses, ["hemophilia_b"], "unchanged");
  // but she can edit the child's name and age group
  assert.equal((await editMinor(Mom, kid.id, { firstName: "Kiddo", lastName: tag, relationship: "child", ageGroup: "13_17" })).ok, true);

  // only the primary designates
  assert.equal((await designateGuardian(Mom, kid.id, mom.id)).ok, false);
  assert.equal((await designateGuardian(P1, kid.id, mom.id)).ok, true);
  assert.equal(await kidDx(Mom), null, "designated is not enough");
  assert.equal((await setMinorDiagnoses(Mom, kid.id, ["other"])).ok, false);
  assert.equal((await convertMinor(Mom, kid.id, { email: em("kidconv") })).ok, false);

  // her view now shows the pending statement; she attests
  assert.deepEqual((await loadPortalView(h.id, Mom.actor))!.pendingAttestations.map((p) => p.childMemberId), [kid.id]);
  assert.equal((await acceptGuardianAttestation(Aunt)).ok && (await acceptGuardianAttestation(Aunt) as { accepted: number }).accepted, 0, "the other adult has nothing to accept");
  const acc = await acceptGuardianAttestation(Mom);
  assert.deepEqual([acc.ok, acc.ok && acc.accepted], [true, 1]);
  const rec = await prisma.consentRecord.findFirst({ where: { householdMemberId: mom.id, type: "age_guardian_attestation" } });
  assert.deepEqual([rec?.granted, rec?.textVersion, rec?.method], [true, CONSENT_TEXT_VERSION, "portal"]);
  assert.deepEqual(await kidDx(Mom), ["hemophilia_b"]);
  assert.equal((await setMinorDiagnoses(Mom, kid.id, ["other", "carrier"])).ok, true);
  assert.deepEqual((await prisma.householdMember.findUnique({ where: { id: kid.id } }))?.statedDiagnoses, ["other", "carrier"]);
  assert.equal(await kidDx(Aunt), null, "a different adult still can't");
  assert.equal((await setMinorDiagnoses(Aunt, kid.id, ["other"])).ok, false);
  // diagnoses of an ADULT row can't be set through the minor path, by anyone
  assert.equal((await setMinorDiagnoses(P1, aunt.id, ["other"])).ok, false);

  // she steps down; the permission ends
  assert.equal((await revokeGuardian(Mom, kid.id, mom.id)).ok, true);
  assert.equal(await kidDx(Mom), null);
  assert.equal((await revokeGuardian(Aunt, kid.id, mom.id)).ok, false, "an adult can only step down themselves");
});

test("an adult edits only their own diagnoses, profile and email; nothing reaches another adult's row", async () => {
  const h = await household("own");
  const a = await h.mem("A", { age: "18_plus", status: "confirmed", email: em("owna"), dx: ["carrier"], rel: "spouse_partner" });
  const b = await h.mem("B", { age: "18_plus", status: "confirmed", email: em("ownb"), dx: ["von_willebrand"], rel: "sibling" });
  const A1 = asMember(h.id, a.id);
  assert.equal((await setOwnDiagnoses(A1, ["other"])).ok, true);
  assert.deepEqual((await prisma.householdMember.findUnique({ where: { id: a.id } }))?.statedDiagnoses, ["other"]);
  assert.deepEqual((await prisma.householdMember.findUnique({ where: { id: b.id } }))?.statedDiagnoses, ["von_willebrand"], "the other adult's are untouched");
  assert.deepEqual((await prisma.patient.findUnique({ where: { id: h.id } }))?.primaryDiagnoses, ["hemophilia_a"], "so are the primary's");
  assert.deepEqual([...(await prisma.patient.findUnique({ where: { id: h.id } }))!.statedDiagnoses].sort(), ["hemophilia_a", "other", "von_willebrand"], "the household union follows");

  assert.equal((await updateProfile(A1, { firstName: "Ana", lastName: "Ruiz", phone: "915-555-0111", language: "es" })).ok, true);
  const row = await prisma.householdMember.findUnique({ where: { id: a.id } });
  assert.deepEqual([row?.firstName, row?.phone, row?.preferredLanguage], ["Ana", "+19155550111", "es"]);
  assert.equal((await prisma.contactProfile.findUnique({ where: { patientId: h.id } }))?.firstName, "own", "the primary's profile is untouched");
  assert.equal((await updateProfile(A1, { firstName: "", lastName: "x", phone: "", language: "en" })).ok, false);
  assert.deepEqual(await updateProfile(A1, { firstName: "A", lastName: "B", phone: "12", language: "en" }), { ok: false, status: 400, error: "invalid", field: "phone" });
  // the address is the household's: any adult may update it
  assert.equal((await updateAddress(A1, { line1: "9 New Rd", line2: "", city: "El Paso", state: "TX", zip: "79901" })).ok, true);
  assert.equal((await prisma.contactProfile.findUnique({ where: { patientId: h.id } }))?.addressLine1, "9 New Rd");

  // the primary can't be left without a way to reach them
  const nm = await household("nomail", { email: null });
  assert.deepEqual(await updateProfile(primary(nm.id), { firstName: "a", lastName: "b", phone: "", language: "en" }), { ok: false, status: 400, error: "invalid", field: "contact" });
});

// ───────────────────────── one household can't touch another ─────────────────────────
test("a family can't edit another household: every member lookup is scoped to the session's household", async () => {
  const mine = await household("mine"), theirs = await household("theirs");
  const kid = await theirs.mem("Kid");
  const adult = await theirs.mem("Adult", { age: "18_plus", status: "confirmed", email: em("tha"), rel: "spouse_partner" });
  const c = primary(mine.id);
  assert.equal((await editMinor(c, kid.id, { firstName: "X", lastName: "Y", relationship: "child", ageGroup: "6_12" })).ok, false);
  assert.equal((await setMinorDiagnoses(c, kid.id, ["other"])).ok, false);
  assert.equal((await removeMember(c, kid.id)).ok, false);
  assert.equal((await convertMinor(c, kid.id, { email: em("zz") })).ok, false);
  assert.equal((await designateGuardian(c, kid.id, adult.id)).ok, false);
  assert.equal((await designateGuardian(primary(theirs.id), kid.id, (await mine.mem("Mine", { age: "18_plus", status: "confirmed", email: em("mm"), rel: "other" })).id)).ok, false, "a guardian from another household");
  assert.ok(await prisma.householdMember.findUnique({ where: { id: kid.id } }), "nothing was removed");
  // a member context for someone else's member id is refused too
  assert.equal((await setOwnDiagnoses(asMember(mine.id, adult.id), ["other"])).ok, false);
  assert.equal((await recordPortalConsent(mine.id, "media", false, adult.id)).ok, false, "a consent can't be recorded on another household's adult");
  assert.deepEqual((await prisma.householdMember.findUnique({ where: { id: adult.id } }))?.statedDiagnoses, []);
});

test("consents: an adult's choice goes on their own row, never the household's or another adult's", async () => {
  const h = await household("cs");
  const a = await h.mem("A", { age: "18_plus", status: "confirmed", email: em("csa"), rel: "spouse_partner" });
  const b = await h.mem("B", { age: "18_plus", status: "confirmed", email: em("csb"), rel: "sibling" });
  assert.deepEqual(await recordPortalConsent(h.id, "sms", true, a.id), { ok: true, changed: true, granted: true });
  assert.equal(await prisma.consentRecord.count({ where: { householdMemberId: a.id, type: "sms", granted: true, method: "portal" } }), 1);
  assert.equal(await prisma.consentRecord.count({ where: { OR: [{ householdMemberId: b.id }, { patientId: h.id }], type: "sms" } }), 0);
  const log = await prisma.auditLog.findFirst({ where: { patientId: h.id, action: "PORTAL_CONSENT_CHANGED" } });
  assert.deepEqual([log?.actorType, log?.actorMemberId], ["family", a.id]);
});

// ───────────────────────── removing, leaving, converting ─────────────────────────
test("one adult can't remove another; the primary can, and future RSVP rows go while attended ones stay as counts", async () => {
  const h = await household("rm");
  const a = await h.mem("A", { age: "18_plus", status: "confirmed", email: em("rma"), rel: "spouse_partner" });
  const b = await h.mem("B", { age: "18_plus", status: "confirmed", email: em("rmb"), rel: "sibling" });
  const kid = await h.mem("Kid");
  const ev = await event("rm1"), past = await event("rm2");
  const rsvp = await prisma.rsvp.create({ data: { eventId: ev, patientId: h.id, attendeeCount: 3, attendees: { create: [{ isPrimary: true }, { householdMemberId: kid.id }, { householdMemberId: b.id }] } } });
  const old = await prisma.rsvp.create({ data: { eventId: past, patientId: h.id, attendeeCount: 2, attendees: { create: [{ isPrimary: true }, { householdMemberId: b.id, checkedInAt: new Date() }] } } });

  assert.equal((await removeMember(asMember(h.id, a.id), b.id)).ok, false, "one adult can't remove another");
  assert.equal((await removeMember(asMember(h.id, a.id), kid.id)).ok, false);
  assert.ok(await prisma.householdMember.findUnique({ where: { id: b.id } }));

  assert.equal((await removeMember(primary(h.id), b.id)).ok, true);
  assert.equal(await prisma.householdMember.count({ where: { id: b.id } }), 0);
  assert.equal(await prisma.rsvpAttendee.count({ where: { rsvpId: rsvp.id } }), 2, "future RSVP: only the removed adult's row went");
  assert.equal((await prisma.rsvp.findUnique({ where: { id: rsvp.id } }))?.attendeeCount, 2);
  assert.equal(await prisma.rsvpAttendee.count({ where: { rsvpId: old.id, checkedInAt: { not: null } } }), 1, "attendance that already happened stays, as a count");
  assert.equal((await prisma.patient.findUnique({ where: { id: h.id } }))?.familySize, 3);
});

test("an adult leaves: nothing kept, sign-in unlinked, consents withdrawn, future RSVP rows gone, primary told by a link-only email", async () => {
  const h = await household("lv", { email: em("lvp") });
  const a = await h.mem("Leaver", { age: "18_plus", status: "confirmed", email: em("lva"), dx: ["carrier"], rel: "spouse_partner" });
  await prisma.consentRecord.createMany({ data: [{ householdMemberId: a.id, type: "data_and_contact", granted: true, textVersion: "v4", method: "web" }, { householdMemberId: a.id, type: "media", granted: true, textVersion: "v4", method: "web" }, { householdMemberId: a.id, type: "adult_attestation", granted: true, textVersion: "v4", method: "web" }] });
  const s = await resolveForUser(user(sub("lv1"), em("lva")));
  assert.equal(s.mode, "family");
  const ev = await event("lv1");
  const rsvp = await prisma.rsvp.create({ data: { eventId: ev, patientId: h.id, attendeeCount: 2, attendees: { create: [{ isPrimary: true }, { householdMemberId: a.id }] } } });

  assert.equal((await leaveHousehold(primary(h.id))).ok, false, "the primary doesn't leave this way");
  assert.equal((await leaveHousehold(asMember(h.id, a.id))).ok, true);
  const row = await prisma.householdMember.findUnique({ where: { id: a.id } });
  assert.deepEqual([row?.status, row?.firstName, row?.lastName, row?.email, row?.phone, row?.statedDiagnoses], ["declined", null, null, null, null, []]);
  const ident = await prisma.userIdentity.findUnique({ where: { auth0Sub: `google-oauth2|${tag}lv1` } });
  assert.deepEqual([ident?.patientId, ident?.householdMemberId, ident?.linkedVia], [null, null, "unlinked"]);
  assert.equal((await resolveForUser(user(`google-oauth2|${tag}lv1`, em("lva")))).mode, "none", "the sign-in no longer reaches the household");
  assert.equal(await prisma.rsvpAttendee.count({ where: { rsvpId: rsvp.id, householdMemberId: a.id } }), 0);
  assert.equal((await prisma.rsvp.findUnique({ where: { id: rsvp.id } }))?.attendeeCount, 1);
  const consents = await prisma.consentRecord.findMany({ where: { householdMemberId: a.id }, orderBy: { createdAt: "asc" } });
  const latest = (t: string) => consents.filter((c) => c.type === t).pop()?.granted;
  assert.deepEqual([latest("data_and_contact"), latest("media")], [false, false], "withdrawn; the earlier rows stay as evidence");
  assert.equal(await prisma.emailLog.count({ where: { patientId: null, templateType: "MEMBER_LEFT_NOTICE", sentAt: { gte: startedAt } } }) >= 1, true, "the primary was told");
  const log = (await audits(h.id)).find((l) => l.action === "PORTAL_MEMBER_LEFT");
  assert.ok(log && log.actorMemberId === a.id && !/@/.test(JSON.stringify(log)));
  assert.equal((await prisma.patient.findUnique({ where: { id: h.id } }))?.statedDiagnoses.includes("carrier"), false, "their diagnoses left the household union");
});

test("converting a minor: they become a pending adult, diagnoses cleared, guardianships end; the adult can't sign in until confirmed", async () => {
  const h = await household("cv");
  const mom = await h.mem("Mom", { age: "18_plus", status: "confirmed", email: em("cvmom"), rel: "spouse_partner" });
  const teen = await h.mem("Teen", { age: "13_17", dx: ["hemophilia_a"] });
  await prisma.memberGuardianship.create({ data: { childMemberId: teen.id, guardianMemberId: mom.id, attestedAt: new Date() } });
  assert.equal((await convertMinor(primary(h.id), teen.id, { email: "not-an-email" })).ok, false);
  assert.equal((await convertMinor(primary(h.id), teen.id, { email: em("cvteen") })).ok, true);
  const t = await prisma.householdMember.findUnique({ where: { id: teen.id } });
  assert.deepEqual([t?.ageGroup, t?.status, t?.statedDiagnoses, t?.email], ["18_plus", "pending", [], em("cvteen")]);
  assert.ok(t?.confirmTokenHash && t.confirmTokenExpiresAt, "the same confirmation token as registration");
  assert.equal(await prisma.memberGuardianship.count({ where: { childMemberId: teen.id } }), 0);
  assert.equal((await resolveForUser(user(sub("cvt"), em("cvteen")))).mode, "none", "pending: no sign-in");
  assert.equal((await convertMinor(primary(h.id), mom.id, { email: em("q") })).ok, false, "an adult can't be 'converted'");
  assert.equal((await editMinor(primary(h.id), teen.id, { firstName: "T", lastName: "x", relationship: "child", ageGroup: "6_12" })).ok, false, "an adult row is not edited as a minor");
});

// ───────────────────────── adding, email change, deletion ─────────────────────────
test("adding an adult starts confirmation (token, pending, email logged); adding a minor needs none; the household caps at 12", async () => {
  const h = await household("ad");
  const wife = await h.mem("Wife", { age: "18_plus", status: "confirmed", email: em("adw"), rel: "spouse_partner" });
  const r = await addMember(asMember(h.id, wife.id), { firstName: "Luis", lastName: "Ruiz", relationship: "sibling", ageGroup: "18_plus", email: em("luis") });
  assert.ok(r.ok);
  const m = await prisma.householdMember.findUnique({ where: { id: r.ok ? r.memberId : "" } });
  assert.deepEqual([m?.status, m?.email, m?.statedDiagnoses], ["pending", em("luis"), []]);
  assert.ok(m?.confirmTokenHash && m.confirmTokenExpiresAt && m.confirmTokenExpiresAt.getTime() > Date.now() + 29 * DAY);
  assert.ok(await prisma.emailLog.findFirst({ where: { patientId: h.id, templateType: "MEMBER_CONFIRMATION", sentAt: { gte: startedAt } } }), "the confirmation email was attempted");
  // by phone: no token, the board calls
  const byPhone = await addMember(primary(h.id), { firstName: "Rosa", lastName: "R", relationship: "other", ageGroup: "18_plus", confirmByPhone: true });
  const pm = await prisma.householdMember.findUnique({ where: { id: byPhone.ok ? byPhone.memberId : "" } });
  assert.deepEqual([pm?.status, pm?.confirmByPhone, pm?.confirmTokenHash], ["pending", true, null]);
  // an adult needs an email or phone; invalid input is refused
  assert.equal((await addMember(primary(h.id), { firstName: "No", lastName: "Mail", relationship: "other", ageGroup: "18_plus" })).ok, false);
  assert.equal((await addMember(primary(h.id), { firstName: "", lastName: "x", relationship: "child", ageGroup: "6_12" })).ok, false);
  // a minor: no token, no consent; a non-guardian adult can't set the new child's diagnoses, the primary can
  const k1 = await addMember(asMember(h.id, wife.id), { firstName: "Kid1", lastName: "x", relationship: "child", ageGroup: "6_12", diagnoses: ["hemophilia_a"] });
  const k2 = await addMember(primary(h.id), { firstName: "Kid2", lastName: "x", relationship: "child", ageGroup: "6_12", diagnoses: ["hemophilia_b"] });
  assert.deepEqual((await prisma.householdMember.findUnique({ where: { id: k1.ok ? k1.memberId : "" } }))?.statedDiagnoses, []);
  assert.deepEqual((await prisma.householdMember.findUnique({ where: { id: k2.ok ? k2.memberId : "" } }))?.statedDiagnoses, ["hemophilia_b"]);
  assert.equal((await prisma.householdMember.findUnique({ where: { id: k2.ok ? k2.memberId : "" } }))?.confirmTokenHash, null);
  // pending adults don't count for matching until they confirm
  assert.equal((await prisma.patient.findUnique({ where: { id: h.id } }))?.statedDiagnoses.includes("hemophilia_b"), true, "a minor counts");
  // the cap
  for (let i = 0; i < 12; i++) await prisma.householdMember.create({ data: { patientId: h.id, firstName: `F${i}`, relationship: "child", ageGroup: "6_12" } }).catch(() => null);
  assert.deepEqual(await addMember(primary(h.id), { firstName: "Over", lastName: "x", relationship: "child", ageGroup: "6_12" }), { ok: false, status: 400, error: "invalid", field: "familySize" });
});

test("an email change needs the link: neutral answer either way, the link only works for the same signed-in person, the sign-in stays linked", async () => {
  const h = await household("ec", { email: em("ecp") });
  const wife = await h.mem("Wife", { age: "18_plus", status: "confirmed", email: em("ecw"), rel: "spouse_partner" });
  const s = await resolveForUser(user(sub("ec1"), em("ecp")));
  assert.equal(s.mode, "family");
  const taken = await household("ect", { email: em("taken") });
  void taken;

  assert.deepEqual(await requestEmailChange(primary(h.id), "nope"), { ok: false, status: 400, error: "invalid", field: "email" });
  const good = await requestEmailChange(primary(h.id), em("newp").toUpperCase());
  const bad1 = await requestEmailChange(primary(h.id), em("taken"));
  const bad2 = await requestEmailChange(primary(h.id), em("ecw")); // an adult in the household already uses it
  for (const r of [good, bad1, bad2]) assert.deepEqual(r, { ok: true, message: EMAIL_NEUTRAL_MESSAGE }, "the same answer whether or not the address can be used");
  assert.equal((await prisma.patient.findUnique({ where: { id: h.id } }))?.email, em("ecp"), "nothing changed yet");
  assert.equal(await prisma.emailChangeRequest.count({ where: { patientId: h.id, newEmail: em("newp") } }), 1, "a usable address got a request");
  assert.equal(await prisma.emailChangeRequest.count({ where: { patientId: h.id, newEmail: { in: [em("taken"), em("ecw")] } } }), 0, "an unusable one did not");

  // the link: hash-only storage, so tests mint a known token
  const raw = generateToken();
  await prisma.emailChangeRequest.deleteMany({ where: { patientId: h.id } });
  await prisma.emailChangeRequest.create({ data: { patientId: h.id, newEmail: em("newp"), tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + DAY) } });
  assert.equal((await confirmEmailChange(raw, asMember(h.id, wife.id))).ok, false, "another adult can't use it");
  assert.equal((await confirmEmailChange(raw, primary((await household("ecx")).id))).ok, false, "nor another household");
  assert.equal((await confirmEmailChange("nonsense", primary(h.id))).ok, false);
  assert.equal((await confirmEmailChange(raw, primary(h.id))).ok, true);
  assert.equal((await prisma.patient.findUnique({ where: { id: h.id } }))?.email, em("newp"));
  assert.equal((await confirmEmailChange(raw, primary(h.id))).ok, false, "single use");
  assert.equal((await resolveForUser(user(`google-oauth2|${tag}ec1`, em("ecp")))).mode, "family", "the existing sign-in stays linked");
  // expired
  const raw2 = generateToken();
  await prisma.emailChangeRequest.create({ data: { patientId: h.id, newEmail: em("late"), tokenHash: hashToken(raw2), expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await confirmEmailChange(raw2, primary(h.id))).ok, false);
  // an adult changes their own the same way
  const raw3 = generateToken();
  await prisma.emailChangeRequest.create({ data: { patientId: h.id, householdMemberId: wife.id, newEmail: em("neww"), tokenHash: hashToken(raw3), expiresAt: new Date(Date.now() + DAY) } });
  assert.equal((await confirmEmailChange(raw3, primary(h.id))).ok, false, "the primary can't confirm an adult's change");
  assert.equal((await confirmEmailChange(raw3, asMember(h.id, wife.id))).ok, true);
  assert.equal((await prisma.householdMember.findUnique({ where: { id: wife.id } }))?.email, em("neww"));
  assert.equal((await prisma.patient.findUnique({ where: { id: h.id } }))?.email, em("newp"), "the primary's is unchanged");
});

test("a request to delete: only the right person, link-only email, logged, deletes nothing, once a day", async () => {
  const h = await household("dl");
  const a = await h.mem("A", { age: "18_plus", status: "confirmed", email: em("dla"), rel: "spouse_partner" });
  const before = await prisma.emailLog.count({ where: { templateType: "DELETION_REQUEST_NOTICE", sentAt: { gte: startedAt } } });
  assert.equal((await requestDeletion(primary(h.id))).ok, true);
  assert.equal((await requestDeletion(primary(h.id))).ok, true);
  assert.equal(await prisma.emailLog.count({ where: { templateType: "DELETION_REQUEST_NOTICE", sentAt: { gte: startedAt } } }), before + 1, "no second email the same day");
  assert.equal((await requestDeletion(asMember(h.id, a.id))).ok, true);
  const logs = (await audits(h.id)).filter((l) => l.action === "PORTAL_DELETION_REQUESTED");
  assert.deepEqual(logs.map((l) => [l.actorMemberId, (l.changes as { scope: string }).scope]), [[null, "household"], [a.id, "self"]]);
  assert.ok(await prisma.patient.findUnique({ where: { id: h.id } }) && (await prisma.householdMember.findUnique({ where: { id: a.id } }))?.status === "confirmed", "nothing was deleted");
  assert.equal((await requestDeletion({ householdId: h.id, actor: { kind: "member", memberId: "00000000-0000-0000-0000-000000000000" } })).ok, false);
});

// ───────────────────────── logging ─────────────────────────
test("every change is logged with the acting person: field names and ids only, never values", async () => {
  const h = await household("lg", { email: em("lgp") });
  const wife = await h.mem("Wife", { age: "18_plus", status: "confirmed", email: em("lgw"), rel: "spouse_partner" });
  const kid = await h.mem("Kid");
  const since = new Date(Date.now() - 1000);
  const P1 = primary(h.id), W = asMember(h.id, wife.id);
  await updateProfile(P1, { firstName: "Pri", lastName: "Mary", phone: "915-555-0199", language: "es" });
  await updateProfile(W, { firstName: "Wi", lastName: "Fe", phone: "915-555-0188", language: "en" });
  await updateAddress(W, "77 Secret Street, El Paso");
  await setOwnDiagnoses(W, ["carrier"]);
  await setMinorDiagnoses(P1, kid.id, ["hemophilia_b"]);
  await editMinor(W, kid.id, { firstName: "Kidname", lastName: "Zed", relationship: "child", ageGroup: "13_17" });
  await addMember(P1, { firstName: "Newkid", lastName: "Q", relationship: "child", ageGroup: "0_5" });
  await requestEmailChange(W, "brand.new@example.org");
  await designateGuardian(P1, kid.id, wife.id);
  await acceptGuardianAttestation(W);
  await recordPortalConsent(h.id, "media", false, wife.id);
  const rows = await audits(h.id, since);
  const actions = rows.map((r) => r.action);
  for (const a of ["PORTAL_PROFILE_CHANGED", "PORTAL_DIAGNOSES_CHANGED", "PORTAL_MEMBER_CHANGED", "PORTAL_EMAIL_CHANGE_REQUESTED", "PORTAL_GUARDIAN_CHANGED", "PORTAL_CONSENT_CHANGED"])
    assert.ok(actions.includes(a as never), `${a} logged`);
  assert.ok(rows.length >= 11);
  for (const r of rows) {
    assert.equal(r.actorType, "family");
    assert.equal(r.patientId, h.id, "the household");
    const c = r.changes as Record<string, unknown>;
    assert.ok(c.actor === (r.actorMemberId ?? h.id), "the acting person's id is in every row");
    assert.ok(r.actorMemberId === null || r.actorMemberId === wife.id);
    const text = `${r.details} ${JSON.stringify(c)}`;
    for (const secret of ["Pri", "Mary", "Wi ", "915-555", "Secret", "carrier", "hemophilia", "Kidname", "Zed", "brand.new", "@", "Newkid"]) assert.ok(!text.includes(secret), `no value (${secret}) in an audit row`);
  }
  assert.equal(rows.filter((r) => r.actorMemberId === wife.id).length >= 7 && rows.filter((r) => r.actorMemberId === null).length >= 2, true);
  const prof = rows.find((r) => r.action === "PORTAL_PROFILE_CHANGED" && r.actorMemberId === null);
  assert.deepEqual((prof?.changes as { fields: string[] }).fields.sort(), ["firstName", "language", "lastName", "phone"].sort());
});

test("changes are rate limited per person, counted from the audit log", async () => {
  const h = await household("rl");
  const a = await h.mem("A", { age: "18_plus", status: "confirmed", email: em("rla"), rel: "spouse_partner" });
  const P1 = primary(h.id), A1 = asMember(h.id, a.id);
  assert.equal(await overEditLimit(P1), false);
  await prisma.auditLog.createMany({ data: Array.from({ length: 30 }, () => ({ patientId: h.id, actorType: "family", actorMemberId: null, action: "PORTAL_PROFILE_CHANGED" as const, resourceType: "Patient", resourceId: h.id })) });
  assert.equal(await overEditLimit(P1), true);
  assert.equal(await overEditLimit(A1), false, "the limit is per person, not per household");
});

test("merging two households folds a duplicate adult's sign-in and guardian designations into the kept entry", async () => {
  const a = await household("mg1"), b = await household("mg2");
  const wa = await a.mem("Wife", { age: "18_plus", status: "pending", email: em("mgw1"), rel: "spouse_partner" });
  const wb = await b.mem("Wife", { age: "18_plus", status: "confirmed", email: em("mgw2"), rel: "spouse_partner" });
  const kid = await b.mem("Kid");
  await prisma.memberGuardianship.create({ data: { childMemberId: kid.id, guardianMemberId: wb.id, attestedAt: new Date() } });
  await prisma.userIdentity.create({ data: { auth0Sub: sub("mg1", "apple"), provider: "apple", email: em("mgw2"), emailVerified: true, patientId: b.id, householdMemberId: wb.id, linkedVia: "auto" } });
  const officer = await prisma.patient.create({ data: { email: em("mgo"), role: "board" } });
  patients.push(officer.id);
  const r = await mergePeople(b.id, a.id, officer.id, a.id);
  assert.ok(r.ok, JSON.stringify(r));
  const ident = await prisma.userIdentity.findUnique({ where: { auth0Sub: `apple|${tag}mg1` } });
  assert.deepEqual([ident?.patientId, ident?.householdMemberId], [a.id, wb.id], "the sign-in follows the entry that was kept (the confirmed one)");
  assert.equal(await prisma.householdMember.count({ where: { id: wa.id } }), 0, "the pending duplicate is gone");
  assert.equal((await resolveForUser(user(`apple|${tag}mg1`, em("mgw2")))).patient?.id, a.id);
  assert.equal(await prisma.memberGuardianship.count({ where: { guardianMemberId: wb.id, childMemberId: kid.id } }), 1);
});

test("retention: used and expired email-change requests (they hold the new address) are deleted a day later; live ones stay", async () => {
  const h = await household("pg");
  const mk = (newEmail: string, o: { expiresAt: Date; usedAt?: Date }) => prisma.emailChangeRequest.create({ data: { patientId: h.id, newEmail, tokenHash: hashToken(generateToken()), ...o } });
  const live = await mk(em("pg1"), { expiresAt: new Date(Date.now() + DAY) });
  const justExpired = await mk(em("pg2"), { expiresAt: new Date(Date.now() - 3600_000) });
  const oldExpired = await mk(em("pg3"), { expiresAt: new Date(Date.now() - 3 * DAY) });
  const oldUsed = await mk(em("pg4"), { expiresAt: new Date(Date.now() + DAY), usedAt: new Date(Date.now() - 2 * DAY) });
  await purgeEmailChangeRequests();
  const left = (await prisma.emailChangeRequest.findMany({ where: { patientId: h.id }, select: { id: true } })).map((r) => r.id).sort();
  assert.deepEqual(left, [live.id, justExpired.id].sort());
  void oldExpired; void oldUsed;
});
