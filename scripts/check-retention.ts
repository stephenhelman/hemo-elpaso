/**
 * Retention job. Run: npm run check:retention   (db-guard refuses production; DEV database, throw-away rows deleted after)
 *  - tokens are cleared only for events that ended > 30 days ago
 *  - email logs > 1 year and audit logs > 3 years are deleted, newer ones kept
 *  - an inactive household is LISTED, an active one is not, and nothing is deleted
 */
import "./_load-env";
import assert from "node:assert/strict";
import { test, after } from "node:test";
import { prisma } from "../src/lib/db";
import { clearEndedEventTokens, purgeOldLogs, listInactiveHouseholds, CLEARED_PREFIX } from "../src/lib/retention";

const DAY = 864e5;
const ago = (d: number) => new Date(Date.now() - d * DAY);
const tag = `rt${Date.now()}`;
const patients: string[] = [];
const events: string[] = [];
const auditIds: string[] = [];
const emailIds: string[] = [];

after(async () => {
  await prisma.event.deleteMany({ where: { id: { in: events } } });
  await prisma.patient.deleteMany({ where: { id: { in: patients } } });
  await prisma.auditLog.deleteMany({ where: { id: { in: auditIds } } });
  await prisma.emailLog.deleteMany({ where: { id: { in: emailIds } } });
  await prisma.$disconnect();
});

const mkPatient = async (name: string, created: Date) => {
  const p = await prisma.patient.create({
    data: {
      email: `${tag}.${name}@example.org`, role: "patient", source: "phone", createdAt: created, updatedAt: created,
      contactProfile: { create: { firstName: name, lastName: tag, createdAt: created, updatedAt: created } },
    },
  });
  patients.push(p.id);
  return p.id;
};
const mkEvent = async (name: string, endedDaysAgo: number) => {
  const end = ago(endedDaysAgo);
  const e = await prisma.event.create({
    data: { slug: `${tag}-${name}`, titleEn: "T", titleEs: "T", eventDate: new Date(end.getTime() - 3 * 3600e3), endDate: end, location: "X", status: "published" },
  });
  events.push(e.id);
  return e.id;
};

test("event tokens: cleared after 30 days, kept before", async () => {
  const oldEv = await mkEvent("old", 40);
  const newEv = await mkEvent("new", 5);
  const pid = await mkPatient("tok", ago(10));
  const rsvp = (eventId: string) =>
    prisma.rsvp.create({ data: { eventId, patientId: pid, attendeeCount: 1, checkInTokenHash: `h${eventId}`, checkInTokenEnc: `e${eventId}` } });
  const rOld = await rsvp(oldEv);
  const rNew = await rsvp(newEv);
  const iOld = await prisma.invitation.create({ data: { eventId: oldEv, patientId: pid, tokenHash: `ih-${tag}-old` } });
  const iNew = await prisma.invitation.create({ data: { eventId: newEv, patientId: pid, tokenHash: `ih-${tag}-new` } });

  const out = await clearEndedEventTokens();
  assert.ok(out.rsvps >= 1);

  const a = await prisma.rsvp.findUniqueOrThrow({ where: { id: rOld.id } });
  assert.equal(a.checkInTokenHash, null);
  assert.equal(a.checkInTokenEnc, null, "the AES copy is cleared too");
  const b = await prisma.rsvp.findUniqueOrThrow({ where: { id: rNew.id } });
  assert.ok(b.checkInTokenHash && b.checkInTokenEnc, "recent event untouched");
  assert.ok((await prisma.invitation.findUniqueOrThrow({ where: { id: iOld.id } })).tokenHash.startsWith(CLEARED_PREFIX));
  assert.equal((await prisma.invitation.findUniqueOrThrow({ where: { id: iNew.id } })).tokenHash, `ih-${tag}-new`);

  const before = (await prisma.invitation.findUniqueOrThrow({ where: { id: iOld.id } })).tokenHash;
  await clearEndedEventTokens(); // idempotent: an already-cleared value is not rewritten
  assert.equal((await prisma.invitation.findUniqueOrThrow({ where: { id: iOld.id } })).tokenHash, before);
});

test("logs: email > 1 year and audit > 3 years deleted; newer kept", async () => {
  const mkE = async (d: number) =>
    (await prisma.emailLog.create({ data: { templateType: "RSVP_REMINDER", recipient: "", subject: "", status: "sent", sentAt: ago(d) } })).id;
  const mkA = async (d: number) =>
    (await prisma.auditLog.create({ data: { action: "PATIENT_VIEWED", details: tag, createdAt: ago(d) } })).id;
  const eOld = await mkE(400), eNew = await mkE(300), aOld = await mkA(3 * 365 + 5), aNew = await mkA(3 * 365 - 30);
  emailIds.push(eOld, eNew);
  auditIds.push(aOld, aNew);
  await purgeOldLogs();
  assert.equal(await prisma.emailLog.count({ where: { id: eOld } }), 0);
  assert.equal(await prisma.emailLog.count({ where: { id: eNew } }), 1);
  assert.equal(await prisma.auditLog.count({ where: { id: aOld } }), 0);
  assert.equal(await prisma.auditLog.count({ where: { id: aNew } }), 1);
});

test("inactive households are listed, active ones are not, nothing is deleted", async () => {
  const stale = await mkPatient("stale", ago(4 * 365));
  const fresh = await mkPatient("fresh", ago(4 * 365));
  const evId = await mkEvent("recent", 20);
  await prisma.rsvp.create({ data: { eventId: evId, patientId: fresh, attendeeCount: 1, rsvpDate: ago(20) } }); // recent RSVP keeps it active
  const ids = (await listInactiveHouseholds()).map((h) => h.id);
  assert.ok(ids.includes(stale), "stale household listed");
  assert.ok(!ids.includes(fresh), "household with a recent RSVP is not listed");
  assert.equal(await prisma.patient.count({ where: { id: { in: [stale, fresh] } } }), 2, "nothing deleted");
});
