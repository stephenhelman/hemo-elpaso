/**
 * Withdrawn contact consent. Run: npm run check:withdrawal   (db-guard refuses production; uses the DEV database)
 *  - pure rules: essential vs non-essential email, "withdrawn" = newest record is a refusal
 *  - the invitation matcher and the send-time check exclude a withdrawn household and keep a consenting one
 * It creates two throw-away patients and deletes them.
 */
import "./_load-env";
import assert from "node:assert/strict";
import { test, after } from "node:test";
import { blockedByWithdrawal, isEssentialEmail, hasWithdrawnContactConsent } from "../src/lib/email/policy";
import { emailBlocker } from "../src/lib/invitations/match";
import { prisma } from "../src/lib/db";
import { matchPatientsForEvent } from "../src/lib/invitations/match";

const t0 = (n: number) => new Date(Date.UTC(2026, 0, 1 + n));
const rec = (granted: boolean, day: number, type = "data_and_contact") => ({ type, granted, createdAt: t0(day) });

test("essential vs non-essential kinds", () => {
  for (const k of ["RSVP_CONFIRMATION", "RSVP_REMINDER", "RSVP_CANCELLATION"] as const) assert.equal(isEssentialEmail(k), true);
  for (const k of ["EVENT_INVITATION", "REGISTRATION_INFO_CONFIRMATION", "MEMBER_CONFIRMATION"] as const) assert.equal(isEssentialEmail(k), false);
});

test("withdrawn = newest data_and_contact record is a refusal", () => {
  assert.equal(hasWithdrawnContactConsent([rec(true, 1), rec(false, 2)]), true);
  assert.equal(hasWithdrawnContactConsent([rec(false, 1), rec(true, 2)]), false); // re-granted later
  assert.equal(hasWithdrawnContactConsent([]), false); // never recorded is not a withdrawal
  assert.equal(hasWithdrawnContactConsent([rec(true, 1), rec(false, 2, "media")]), false); // media withdrawal is separate
});

test("withdrawal blocks non-essential mail but not an RSVP the person keeps", () => {
  const withdrawn = [rec(true, 1), rec(false, 2)];
  assert.equal(blockedByWithdrawal("EVENT_INVITATION", withdrawn), true);
  assert.equal(blockedByWithdrawal("REGISTRATION_INFO_CONFIRMATION", withdrawn), true);
  assert.equal(blockedByWithdrawal("MEMBER_CONFIRMATION", withdrawn), true);
  assert.equal(blockedByWithdrawal("RSVP_CONFIRMATION", withdrawn), false);
  assert.equal(blockedByWithdrawal("RSVP_REMINDER", withdrawn), false);
  assert.equal(blockedByWithdrawal("RSVP_CANCELLATION", withdrawn), false);
  assert.equal(blockedByWithdrawal("EVENT_INVITATION", [rec(true, 1)]), false);
});

test("invitation send-time blocker", () => {
  assert.equal(emailBlocker({ email: "a@b.co", emailOptOut: false, consentData: false }), "no_consent");
  assert.equal(emailBlocker({ email: "a@b.co", emailOptOut: false, consentData: null }), "no_consent");
  assert.equal(emailBlocker({ email: "a@b.co", emailOptOut: false, consentData: true }), null);
});

const tag = `wd${Date.now()}`;
const made: string[] = [];
let eventId = "";
after(async () => {
  if (eventId) await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
  await prisma.patient.deleteMany({ where: { id: { in: made } } });
  await prisma.$disconnect();
});

test("matcher excludes a withdrawn household and keeps a consenting one (dev DB)", async () => {
  const mk = async (name: string, consents: boolean[]) => {
    const p = await prisma.patient.create({
      data: {
        email: `${tag}.${name}@example.org`, role: "patient", source: "phone", familySize: 1,
        contactProfile: { create: { firstName: name, lastName: tag } },
      },
    });
    made.push(p.id);
    for (let i = 0; i < consents.length; i++)
      await prisma.consentRecord.create({ data: { patientId: p.id, type: "data_and_contact", granted: consents[i], textVersion: "v2", method: "phone", createdAt: t0(i) } });
    return p.id;
  };
  const keep = await mk("keep", [true]);
  const gone = await mk("gone", [true, false]);
  const ev = await prisma.event.create({
    data: { slug: `${tag}-ev`, titleEn: "T", titleEs: "T", eventDate: new Date(Date.now() + 14 * 864e5), location: "X", status: "published", category: "FAMILY_SUPPORT" },
  });
  eventId = ev.id;
  const m = await matchPatientsForEvent(ev.id);
  assert.ok(m);
  const ids = m!.emailMatches.map((p) => p.id);
  assert.ok(ids.includes(keep), "consenting household is matched");
  assert.ok(!ids.includes(gone), "withdrawn household is excluded");
  assert.ok(!m!.callList.some((p) => p.id === gone), "withdrawn household is not on the call list either");
});
