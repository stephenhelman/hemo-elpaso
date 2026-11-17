/**
 * End-to-end check of per-person RSVP and check-in: attendee selection, derived
 * attendeeCount and capacity, per-person NO PHOTOS, partial check-in and undo,
 * member removal, email totals, and the migration backfill (if its seed rows exist).
 * Runs the real handlers against the DEV database and deletes what it creates.
 * Usage: npm run check:rsvp   (db-guard refuses production)
 */
import * as ReactNS from "react"; (globalThis as any).React = ReactNS; // tsx uses the classic JSX runtime
import { config } from "dotenv";
config({ path: ".env.local" });
process.env.REGISTRATION_OPEN = "true";
process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA"; // Cloudflare always-pass test secret

let fails = 0;
const say = (m: string) => process.stdout.write(m + "\n");
const ok = (c: boolean, m: string) => { say((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };

async function main() {
  const { NextRequest } = await import("next/server");
  const { prisma } = await import("@/lib/db");
  const pub = await import("@/app/api/rsvp/public/route");
  const { rsvpYes, rsvpPeopleByEvent } = await import("@/lib/rsvp");
  const { ATTENDEE_WITH_MEMBER, mapPeople } = await import("@/lib/rsvp/people");
  const { checkInRsvp, undoAttendeeCheckIn } = await import("@/lib/checkin");
  const { phoneConfirmMember, reissueMemberToken, declineMember } = await import("@/lib/households/confirm");
  const { default: RsvpEmail } = await import("@/messages/RsvpEmail");
  const { render } = await import("@react-email/render");

  const tag = `rsv${Date.now()}`;
  const day = 86400000;
  const patients: string[] = [];
  const events: string[] = [];
  const admin = (await prisma.patient.findFirst({ where: { role: { in: ["board", "admin"] } } }))!;
  const adminCtx = { id: admin.id, email: admin.email ?? "board@example.org" };

  const mkEvent = async (over: object = {}) => {
    const e = await prisma.event.create({
      data: { slug: `${tag}-${events.length}`, titleEn: "t", titleEs: "t", eventDate: new Date(Date.now() + 10 * day), location: "x", status: "published", registrationEnabled: true, language: "both", ...over },
    });
    events.push(e.id);
    return e;
  };
  const post = (handler: any, body: unknown) =>
    handler(new NextRequest("http://localhost/x", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } }));
  const people = async (rsvpId: string) => {
    const r = await prisma.rsvp.findUnique({
      where: { id: rsvpId },
      include: {
        patient: { select: { contactProfile: true, consentRecords: { where: { type: "media" }, orderBy: { createdAt: "desc" }, take: 1, select: { granted: true } } } },
        attendees: { include: ATTENDEE_WITH_MEMBER, orderBy: { createdAt: "asc" } },
      },
    });
    return mapPeople(r!.attendees, r!.patient.contactProfile?.firstName ?? "", r!.patient.consentRecords[0]?.granted);
  };

  // --- migration backfill (only if the seed rows from the migration test exist) ---
  const legacy = await prisma.rsvp.findMany({ where: { patient: { contactProfile: { lastName: "legacyrsvp" } } }, include: { attendees: true, patient: { include: { contactProfile: true } } } });
  if (legacy.length) {
    const a = legacy.find((r) => r.patient.contactProfile!.firstName === "A")!;
    const ci = await prisma.checkIn.findUnique({ where: { eventId_patientId: { eventId: a.eventId, patientId: a.patientId } } });
    ok(a.attendeeCount === 3 && a.guestCount === 2 && a.attendees.length === 1 && a.attendees[0].isPrimary && !!a.attendees[0].checkedInAt, "backfill: party of 3 -> primary row (checked in) + 2 guests");
    ok(ci!.headcount === 2 && ci!.guestsCheckedIn === 1, "backfill: existing check-in of 2 -> primary + 1 guest confirmed");
    const b = legacy.find((r) => r.patient.contactProfile!.firstName === "B")!;
    ok(b.attendeeCount === 1 && b.guestCount === 0 && b.attendees.length === 1 && !b.attendees[0].checkedInAt, "backfill: party of 1 -> primary row, 0 guests, not checked in");
    await prisma.patient.deleteMany({ where: { id: { in: legacy.map((r) => r.patientId) } } });
    await prisma.event.deleteMany({ where: { id: legacy[0].eventId } });
  } else say("SKIP backfill assertions (no legacy seed rows present)");

  // --- household of 4 RSVPs for 3 + 1 guest through the public form ---
  const ev = await mkEvent({ maxCapacity: 5 });
  const members = [
    { firstName: "Sam", lastName: "", relationship: "spouse_partner", ageGroup: "18_plus", email: `delivered+${tag}s@resend.dev`, confirmByPhone: false, diagnoses: [] },
    { firstName: "Kid", lastName: "", relationship: "child", ageGroup: "6_12", email: "", confirmByPhone: false, diagnoses: ["hemophilia_a"] },
    { firstName: "Gran", lastName: "", relationship: "parent", ageGroup: "18_plus", email: "", confirmByPhone: true, diagnoses: [] },
  ];
  const body = (over: object = {}) => ({
    firstName: "Pat", lastName: tag, email: `delivered+${tag}a@resend.dev`, phone: "", address: "", language: "en", familySize: 4, diagnoses: [],
    members, consentDataAndContact: true, consentMedia: false, attestation: true, website: "", turnstileToken: "XXXX.DUMMY.TOKEN.XXXX", eventId: ev.id,
    attendees: { primary: true, memberIndexes: [0, 1], guests: 1 }, ...over,
  });
  let r = await post(pub.POST, body({ attendees: { primary: false, memberIndexes: [], guests: 0 } }));
  ok(r.status === 400, "public RSVP needs at least one person or guest");
  r = await post(pub.POST, body({ attendees: { primary: true, memberIndexes: [7], guests: 0 } }));
  ok(r.status === 400, "public RSVP rejects a member position that doesn't exist");
  r = await post(pub.POST, body({ attendees: { primary: true, memberIndexes: [], guests: 11 } }));
  ok(r.status === 400, "guests are limited to 10");
  r = await post(pub.POST, body());
  ok(r.status === 200, "household of 4 RSVPs for 3 people + 1 guest");
  const cp = await prisma.contactProfile.findFirst({ where: { lastName: tag } });
  const pid = cp!.patientId!;
  patients.push(pid);
  const rsvp = (await prisma.rsvp.findFirst({ where: { patientId: pid, eventId: ev.id }, include: { attendees: true } }))!;
  const mem = await prisma.householdMember.findMany({ where: { patientId: pid }, orderBy: { createdAt: "asc" } });
  const byName = Object.fromEntries(mem.map((m) => [m.firstName!, m]));
  ok(rsvp.attendees.length === 3 && rsvp.guestCount === 1 && rsvp.attendeeCount === 4, "attendee rows 3 + guests 1 => attendeeCount 4");
  ok(rsvp.attendees.some((a) => a.isPrimary) && rsvp.attendees.some((a) => a.householdMemberId === byName.Sam.id) && rsvp.attendees.some((a) => a.householdMemberId === byName.Kid.id) && !rsvp.attendees.some((a) => a.householdMemberId === byName.Gran.id), "chosen people are listed; the unchecked parent is not (pending adult selectable)");
  ok((await rsvpPeopleByEvent([ev.id]))[ev.id] === 4, "capacity counts 4");

  // second household of 3 can't fit (4 + 3 > 5), then fits after the first drops to 2
  const mk = async (name: string, body2: any = {}) => {
    const p = await prisma.patient.create({ data: { role: "patient", email: null, contactProfile: { create: { firstName: name, lastName: tag + name } }, ...body2 } });
    patients.push(p.id);
    return p;
  };
  const other = await mk("Other");
  let o = await rsvpYes({ eventId: ev.id, patientId: other.id, selection: { primary: true, memberIds: [], guests: 2 }, source: "manual", sendEmail: false });
  ok(!o.ok && o.code === "AT_CAPACITY", "another household of 3 is refused while 4 of 5 are taken");
  const sel2 = { primary: true, memberIds: [byName.Kid.id], guests: 0 };
  const up = await rsvpYes({ eventId: ev.id, patientId: pid, selection: sel2, source: "public", sendEmail: false });
  const after = await prisma.rsvp.findUnique({ where: { id: rsvp.id }, include: { attendees: true } });
  ok(up.ok && after!.attendeeCount === 2 && after!.attendees.length === 2 && after!.guestCount === 0, "changing to 2 people updates rows, guests and attendeeCount");
  ok((await rsvpPeopleByEvent([ev.id]))[ev.id] === 2, "capacity now counts 2 (two spots freed)");
  o = await rsvpYes({ eventId: ev.id, patientId: other.id, selection: { primary: true, memberIds: [], guests: 2 }, source: "manual", sendEmail: false });
  ok(o.ok, "the household of 3 now fits");

  // invalid selections
  let bad = await rsvpYes({ eventId: ev.id, patientId: pid, selection: { primary: false, memberIds: [], guests: 0 }, source: "public", sendEmail: false });
  ok(!bad.ok, "a yes with nobody listed is rejected");
  bad = await rsvpYes({ eventId: ev.id, patientId: pid, selection: { primary: true, memberIds: ["not-a-member"], guests: 0 }, source: "public", sendEmail: false });
  ok(!bad.ok, "a member that isn't in the household is rejected");

  // increase re-runs the deadline check; lowering is always fine
  const ev2 = await mkEvent({ rsvpDeadline: new Date(Date.now() + 5000) });
  const dl = await mk("Dl");
  const first = await rsvpYes({ eventId: ev2.id, patientId: dl.id, selection: { primary: true, memberIds: [], guests: 2 }, source: "manual", sendEmail: false });
  await prisma.event.update({ where: { id: ev2.id }, data: { rsvpDeadline: new Date(Date.now() - 1000) } });
  const inc = await rsvpYes({ eventId: ev2.id, patientId: dl.id, selection: { primary: true, memberIds: [], guests: 4 }, source: "manual", sendEmail: false });
  const dec = await rsvpYes({ eventId: ev2.id, patientId: dl.id, selection: { primary: true, memberIds: [], guests: 0 }, source: "manual", sendEmail: false });
  ok(first.ok && !inc.ok && (inc as any).code === "DEADLINE_PASSED" && dec.ok, "after the deadline an increase is refused, a decrease is allowed");

  // --- per-person NO PHOTOS ---
  // Household N: primary declined media; child inherits that; adult1 confirmed + granted own media; adult2 pending.
  const evN = await mkEvent();
  const rN = await post(pub.POST, body({ lastName: tag + "N", email: `delivered+${tag}n@resend.dev`, consentMedia: false, eventId: evN.id, attendees: { primary: true, memberIndexes: [0, 1, 2], guests: 0 } }));
  ok(rN.status === 200, "household N RSVPs (primary declined media)");
  const pN = (await prisma.contactProfile.findFirst({ where: { lastName: tag + "N" } }))!.patientId!;
  patients.push(pN);
  const mN = await prisma.householdMember.findMany({ where: { patientId: pN } });
  const samN = mN.find((m) => m.firstName === "Sam")!;
  // adult Sam confirms by phone WITH media; adult Gran stays pending
  await phoneConfirmMember(samN.id, pN, admin.id, { consentMedia: true });
  const rowsN = await prisma.rsvp.findFirst({ where: { patientId: pN, eventId: evN.id } });
  const pplN = await people(rowsN!.id);
  const nm = Object.fromEntries(pplN.map((p) => [p.name, p]));
  ok(nm.Pat.noPhotos === true, "primary (declined media): NO PHOTOS");
  ok(nm.Kid.noPhotos === true, "minor uses the primary's media consent: NO PHOTOS");
  ok(nm.Sam.noPhotos === false, "confirmed adult who granted media: no marker");
  ok(nm.Gran.noPhotos === true, "pending adult: NO PHOTOS");
  // household Y: primary granted media
  const rY = await post(pub.POST, body({ lastName: tag + "Y", email: `delivered+${tag}y@resend.dev`, consentMedia: true, attendees: { primary: true, memberIndexes: [1], guests: 0 }, eventId: evN.id }));
  const pY = (await prisma.contactProfile.findFirst({ where: { lastName: tag + "Y" } }))!.patientId!;
  patients.push(pY);
  const rowsY = await prisma.rsvp.findFirst({ where: { patientId: pY, eventId: evN.id } });
  const pplY = await people(rowsY!.id);
  ok(rY.status === 200 && pplY.every((p) => p.noPhotos === false), "primary granted media: primary and minor show no marker");

  // --- partial check-in: 2 of 3 people + 1 guest, then undo one ---
  const evC = await mkEvent();
  const ciP = await mk("Ci");
  const memC = await prisma.householdMember.createMany({
    data: [
      { patientId: ciP.id, firstName: "C1", relationship: "child", ageGroup: "6_12", status: "not_required" },
      { patientId: ciP.id, firstName: "C2", relationship: "child", ageGroup: "0_5", status: "not_required" },
    ],
  });
  void memC;
  const ciMembers = await prisma.householdMember.findMany({ where: { patientId: ciP.id } });
  const cr = await rsvpYes({ eventId: evC.id, patientId: ciP.id, selection: { primary: true, memberIds: ciMembers.map((m) => m.id), guests: 1 }, source: "manual", sendEmail: false });
  const rs = (await prisma.rsvp.findUnique({ where: { id: (cr as any).rsvpId }, include: { attendees: true } }))!;
  ok(rs.attendeeCount === 4, "RSVP: 3 people + 1 guest = 4");
  const primaryRow = rs.attendees.find((a) => a.isPrimary)!;
  const c1Row = rs.attendees.find((a) => a.householdMemberId === ciMembers.find((m) => m.firstName === "C1")!.id)!;
  const c = await checkInRsvp({ rsvpId: rs.id, eventId: evC.id, attendeeIds: [primaryRow.id, c1Row.id], guests: 1, admin: adminCtx, manual: true });
  ok(c.ok && c.headcount === 3, "check-in of 2 of 3 people + 1 confirmed guest => headcount 3 (2 people + guests)");
  const ci1 = await prisma.checkIn.findFirst({ where: { eventId: evC.id, patientId: ciP.id } });
  const checkedNow = await prisma.rsvpAttendee.count({ where: { rsvpId: rs.id, checkedInAt: { not: null } } });
  ok(ci1!.headcount === 3 && ci1!.guestsCheckedIn === 1 && checkedNow === 2, "checkedInAt set per person; headcount = checked people + guests");
  const again = await checkInRsvp({ rsvpId: rs.id, eventId: evC.id, attendeeIds: [primaryRow.id, c1Row.id], guests: 1, admin: adminCtx });
  ok(!again.ok && (again as any).status === 409, "repeating the same check-in is a no-op (409)");
  const c2Row = rs.attendees.find((a) => !a.isPrimary && a.id !== c1Row.id)!;
  const late = await checkInRsvp({ rsvpId: rs.id, eventId: evC.id, attendeeIds: [c2Row.id], guests: 1, admin: adminCtx });
  ok(late.ok && late.headcount === 4, "a late arrival can be checked in afterwards");
  const u = await undoAttendeeCheckIn(c1Row.id, { id: admin.id });
  const ci2 = await prisma.checkIn.findFirst({ where: { eventId: evC.id, patientId: ciP.id } });
  ok(u.ok && ci2!.headcount === 3, "undo works per person (headcount back to 3)");
  // walk-in shortcut: primary + guests
  const wi = await mk("Wi");
  const wr = await rsvpYes({ eventId: evC.id, patientId: wi.id, partySize: 3, source: "manual", sendEmail: false });
  const wc = await checkInRsvp({ rsvpId: (wr as any).rsvpId, eventId: evC.id, headcount: 3, admin: adminCtx, manual: true });
  const wrow = await prisma.rsvp.findUnique({ where: { id: (wr as any).rsvpId }, include: { attendees: true } });
  ok(wc.ok && wc.headcount === 3 && wrow!.attendees.length === 1 && wrow!.guestCount === 2, "walk-in: primary plus guest count, unchanged behaviour");

  // --- removing/declining a member drops them off the RSVP ---
  const memD = await prisma.householdMember.create({ data: { patientId: ciP.id, firstName: "Dee", relationship: "spouse_partner", ageGroup: "18_plus", status: "pending", email: "delivered+d@resend.dev" } });
  await rsvpYes({ eventId: evC.id, patientId: ciP.id, selection: { primary: true, memberIds: [...ciMembers.map((m) => m.id), memD.id], guests: 1 }, source: "manual", sendEmail: false });
  const before = (await prisma.rsvp.findUnique({ where: { id: rs.id } }))!.attendeeCount;
  const tok = (await reissueMemberToken(memD.id))!.raw;
  await declineMember(tok);
  const afterD = await prisma.rsvp.findUnique({ where: { id: rs.id }, include: { attendees: true } });
  ok(before === 5 && afterD!.attendeeCount === 4 && !afterD!.attendees.some((a) => a.householdMemberId === memD.id), "a member who declines is taken off the RSVP and the total drops");

  // --- DB constraints ---
  let threw = false;
  try { await prisma.rsvpAttendee.create({ data: { rsvpId: rs.id, isPrimary: true } }); } catch { threw = true; }
  ok(threw, "at most one primary row per RSVP (partial unique index)");
  threw = false;
  try { await prisma.rsvpAttendee.create({ data: { rsvpId: rs.id, householdMemberId: ciMembers[0].id } }); } catch { threw = true; }
  ok(threw, "unique (rsvpId, householdMemberId)");

  // --- emails: totals, never names ---
  const html = (await render(RsvpEmail({ kind: "confirmation", lang: "en", firstName: "Pat", eventTitle: "E", eventDate: "d", eventTime: "t", location: "l", partySize: 3 }))) +
    (await render(RsvpEmail({ kind: "reminder", lang: "es", firstName: "Pat", eventTitle: "E", eventDate: "d", eventTime: "t", location: "l", partySize: 3 })));
  ok(html.includes("3 people attending") && html.includes("3 personas asistirán"), "emails say '3 people attending' / '3 personas asistirán'");
  ok(!/Sam|Kid|Gran|C1|C2/.test(html), "emails never list attendee names");

  // cleanup
  await prisma.event.deleteMany({ where: { id: { in: events } } });
  await prisma.patient.deleteMany({ where: { id: { in: patients } } });
  say(fails === 0 ? "\nALL PASSED" : `\n${fails} FAILED`);
  await prisma.$disconnect();
  process.exit(fails ? 1 : 0);
}
main().catch((e) => { process.stdout.write("ERR " + (e?.stack ?? e) + "\n"); process.exit(2); });
