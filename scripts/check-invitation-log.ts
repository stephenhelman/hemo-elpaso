/**
 * Invitation log. Run: npm run check:invitation-log   (db-guard refuses production; uses the DEV database)
 *  - match -> one INVITATION_MATCHED audit row per new invitation (actorType "system", ids only)
 *  - remove (reason code required) -> row kept as "removed", one INVITATION_REMOVED row naming the board user
 *  - re-running matching does NOT bring a removed household back; send ignores removed rows
 *  - the per-event report shows matched / sent / removed with who and when
 *  - no audit row for these invitations holds an email, a name or a diagnosis
 * Creates throw-away patients and an event, and deletes them (and their audit rows) afterwards.
 */
import "./_load-env";
import assert from "node:assert/strict";
import { test, after } from "node:test";
import { AuditAction } from "@prisma/client";
import { prisma } from "../src/lib/db";
import { generateInvitations } from "../src/lib/invitations/generate";
import { removeInvitation } from "../src/lib/invitations/remove";
import { pendingInvitationCount } from "../src/lib/invitations/send";
import { buildInvitationReport } from "../src/lib/invitations/report";
import { isRemovalReason, REMOVAL_REASONS } from "../src/lib/invitations/removal";
import { assertIdsOnly } from "../src/lib/audit";

test("removal reasons are the six approved codes; free text is rejected", () => {
  assert.deepEqual([...REMOVAL_REASONS], ["ASKED_NOT_INVITED", "DUPLICATE_HOUSEHOLD", "MOVED_AWAY", "NOT_ELIGIBLE_FOR_EVENT", "CONTACTING_BY_PHONE", "OTHER"]);
  assert.equal(isRemovalReason("MOVED_AWAY"), true);
  for (const bad of ["", "moved_away", "Has hemophilia A", null, undefined, 3]) assert.equal(isRemovalReason(bad), false, String(bad));
});

test("audit helper refuses an email address", () => {
  assert.throws(() => assertIdsOnly({ details: "sent to a@b.org" }));
  assert.throws(() => assertIdsOnly({ changes: { x: "a@b.org" } }));
  assert.doesNotThrow(() => assertIdsOnly({ details: "ids only", changes: { eventId: "e1", reasonCode: "OTHER" } }));
});

const tag = `il${Date.now()}`;
const made: string[] = [];
let eventId = "";
const invIds: string[] = [];
after(async () => {
  await prisma.auditLog.deleteMany({ where: { OR: [{ resourceId: { in: invIds } }, { resourceId: eventId }] } });
  if (eventId) await prisma.event.delete({ where: { id: eventId } }).catch(() => {});
  await prisma.patient.deleteMany({ where: { id: { in: made } } });
  await prisma.$disconnect();
});

test("match, remove, re-run, report (dev DB)", async () => {
  const mk = async (name: string, role: string, consent: boolean) => {
    const p = await prisma.patient.create({
      data: {
        email: `${tag}.${name}@example.org`, role, source: "phone", familySize: 1,
        primaryDiagnoses: role === "patient" ? ["hemophilia_a"] : [], statedDiagnoses: role === "patient" ? ["hemophilia_a"] : [],
        contactProfile: { create: { firstName: name, lastName: tag } },
      },
    });
    made.push(p.id);
    if (consent) await prisma.consentRecord.create({ data: { patientId: p.id, type: "data_and_contact", granted: true, textVersion: "v2", method: "phone" } });
    return p.id;
  };
  const board = await mk("boardy", "board", false);
  const a = await mk("alpha", "patient", true);
  const b = await mk("bravo", "patient", true);

  const ev = await prisma.event.create({
    data: { slug: `${tag}-ev`, titleEn: "T", titleEs: "T", eventDate: new Date(Date.now() + 14 * 864e5), location: "X", status: "published", category: "FAMILY_SUPPORT" },
  });
  eventId = ev.id;

  // 1. matching logs one row per new invitation
  const added = await generateInvitations(ev.id, { trigger: "publish", byBoardUserId: board });
  assert.ok(added >= 2, "both consenting households matched");
  const invs = await prisma.invitation.findMany({ where: { eventId: ev.id } });
  invs.forEach((i) => invIds.push(i.id));
  const invA = invs.find((i) => i.patientId === a)!;
  const invB = invs.find((i) => i.patientId === b)!;
  assert.ok(invA && invB);
  const matchedRows = await prisma.auditLog.findMany({ where: { action: AuditAction.INVITATION_MATCHED, resourceId: { in: invIds } } });
  assert.equal(matchedRows.length, invs.length, "one MATCHED row per invitation");
  for (const r of matchedRows) {
    assert.equal(r.actorType, "system");
    assert.equal(r.patientId, null);
    const c = r.changes as Record<string, unknown>;
    assert.equal(c.eventId, ev.id);
    assert.equal(c.trigger, "publish");
    assert.equal(c.triggeredByBoardUserId, board);
  }

  // 2. removal keeps the row and logs who/why
  assert.equal(await removeInvitation(ev.id, invA.id, "MOVED_AWAY", board), true);
  const afterRemove = await prisma.invitation.findUniqueOrThrow({ where: { id: invA.id } });
  assert.equal(afterRemove.status, "removed");
  assert.equal(afterRemove.removalReason, "MOVED_AWAY");
  assert.equal(afterRemove.removedByBoardUserId, board);
  assert.equal(await removeInvitation(ev.id, invA.id, "OTHER", board), false, "already removed: no second log row");
  const removedRows = await prisma.auditLog.findMany({ where: { action: AuditAction.INVITATION_REMOVED, resourceId: invA.id } });
  assert.equal(removedRows.length, 1);
  assert.equal(removedRows[0].actorType, "board");
  assert.equal(removedRows[0].patientId, board);
  assert.equal((removedRows[0].changes as Record<string, unknown>).reasonCode, "MOVED_AWAY");

  // 3. re-running matching never brings A back, and send would skip it
  await generateInvitations(ev.id, { trigger: "edit", byBoardUserId: board });
  const again = await prisma.invitation.findMany({ where: { eventId: ev.id, patientId: a } });
  assert.equal(again.length, 1);
  assert.equal(again[0].status, "removed");
  const pendingNow = await pendingInvitationCount(ev.id);
  assert.equal(pendingNow, invs.length - 1);

  // 4. a SENT invitation cannot be removed
  await prisma.invitation.update({ where: { id: invB.id }, data: { status: "sent", sentAt: new Date(), sentByBoardUserId: board } });
  assert.equal(await removeInvitation(ev.id, invB.id, "OTHER", board), false);

  // 5. the report
  const rep = await buildInvitationReport(ev.id);
  assert.equal(rep.matched.length, invs.length);
  assert.ok(rep.matched.every((m) => m.trigger === "publish" || m.trigger === "before_logging" || m.trigger === "edit"));
  assert.equal(rep.sent.length, 1);
  assert.equal(rep.sent[0].household.id, b);
  assert.equal(rep.sent[0].by?.id, board);
  assert.equal(rep.removed.length, 1);
  assert.equal(rep.removed[0].household.id, a);
  assert.equal(rep.removed[0].by?.id, board);
  assert.equal(rep.removed[0].reason, "MOVED_AWAY");
  assert.equal(rep.removed[0].backOnList, false);
  assert.equal(rep.counts.removedStillOff, 1);

  // 6. no email, name or diagnosis in any audit row for this event's invitations
  const all = await prisma.auditLog.findMany({ where: { resourceId: { in: invIds } } });
  assert.ok(all.length >= invs.length + 1);
  for (const r of all) {
    const text = `${r.details ?? ""} ${JSON.stringify(r.changes ?? {})}`.toLowerCase();
    assert.ok(!text.includes("@"), "no email");
    assert.ok(!text.includes(tag.toLowerCase()), "no name (last name carries the tag)");
    assert.ok(!text.includes("alpha") && !text.includes("bravo"), "no first name");
    assert.ok(!text.includes("hemophilia") && !text.includes("willebrand"), "no diagnosis");
    assert.ok(r.actorType, "every new row has an actorType");
  }
});
