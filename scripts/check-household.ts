/**
 * End-to-end check of household registration, adult confirmation, expiry,
 * phone confirmation, age-aware matching and PHI hygiene.
 * Runs the real route handlers against the DEV database and deletes the patients it creates.
 * Usage: npm run check:household   (db-guard refuses production)
 * Emails are CAPTURED (EMAIL_MODE=capture, forced here): the assertions read the in-memory outbox and the EmailLog status "captured".
 */
import * as ReactNS from "react"; (globalThis as any).React = ReactNS; // tsx uses the classic JSX runtime; Next uses automatic
import { config } from "dotenv";
config({ path: ".env.local" });
process.env.EMAIL_MODE = "capture"; // check scripts never send email (lib/email/mode.ts)
process.env.EMAIL_OUTBOX_FILES = "0";
delete process.env.VERCEL_ENV;
process.env.REGISTRATION_OPEN = "true";
process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA"; // Cloudflare always-pass test secret

const logs: string[] = [];
for (const k of ["log", "error", "warn", "info"] as const) {
  const orig = console[k].bind(console);
  console[k] = (...a: unknown[]) => { logs.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ")); orig(...a); };
}

let fails = 0;
const ok = (c: boolean, m: string) => { console.info((c ? "PASS " : "FAIL ") + m); if (!c) fails++; };
const say = (m: string) => process.stdout.write(m + "\n");
(console as any).info = (m: string) => say(m);

async function main() {
  const { NextRequest } = await import("next/server");
  const { prisma } = await import("@/lib/db");
  const reg = await import("@/app/api/register-info/route");
  const conf = await import("@/app/api/confirm/[token]/route");
  const { reissueMemberToken, expirePendingMembers, phoneConfirmMember } = await import("@/lib/households/confirm");
  const { matchPatientsForEvent } = await import("@/lib/invitations/match");
  const { render } = await import("@react-email/render");
  const tag = `vfy${Date.now()}`;
  const created: string[] = [];

  const post = (handler: any, body: unknown, params?: any) =>
    handler(new NextRequest("http://localhost/x", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } }), params);

  const base = (over: any = {}) => ({
    firstName: "Pat", lastName: tag, email: `delivered+${tag}a@resend.dev`, phone: "", address: "", language: "es",
    familySize: 4, diagnoses: [], consentDataAndContact: true, consentMedia: true, attestation: true,
    website: "", turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
    members: [
      { firstName: "Sam", lastName: "", relationship: "spouse_partner", ageGroup: "18_plus", email: `delivered+${tag}s@resend.dev`, confirmByPhone: false, diagnoses: ["hemophilia_b"] },
      { firstName: "Kid", lastName: "", relationship: "child", ageGroup: "6_12", email: "", confirmByPhone: false, diagnoses: ["hemophilia_a"] },
      { firstName: "Grandma", lastName: "", relationship: "parent", ageGroup: "18_plus", email: "", confirmByPhone: true, diagnoses: [] },
    ],
    ...over,
  });

  // --- submit blocks until complete (server side) ---
  const m0 = base().members;
  let r = await post(reg.POST, base({ members: m0.slice(0, 2) }));
  ok(r.status === 400 && (await r.json()).field === "members", "rejects when fewer member slots than household size");
  r = await post(reg.POST, base({ members: [{ ...m0[0], email: "", confirmByPhone: false }, m0[1], m0[2]] }));
  ok(r.status === 400, "rejects adult with no email and no confirmByPhone");
  r = await post(reg.POST, base({ members: [{ ...m0[0], firstName: "" }, m0[1], m0[2]] }));
  ok(r.status === 400, "rejects member with no first name");
  r = await post(reg.POST, base({ attestation: false }));
  ok(r.status === 400 && (await r.json()).field === "attestation", "rejects without attestation");
  r = await post(reg.POST, base({ website: "bot" }));
  ok(r.status === 200 && (await prisma.contactProfile.count({ where: { lastName: tag } })) === 0, "honeypot: ok response, nothing stored");

  // --- household of 4 ---
  r = await post(reg.POST, base());
  ok(r.status === 200 && (await r.json()).ok === true, "valid household of 4 accepted");
  const cp = await prisma.contactProfile.findFirst({ where: { lastName: tag } });
  const patient = await prisma.patient.findUnique({
    where: { id: cp!.patientId! },
    include: { householdMembers: { orderBy: { createdAt: "asc" } }, consentRecords: true },
  });
  created.push(patient!.id);
  ok(patient!.familySize === 4, "familySize = 1 + 3 members");
  ok(JSON.stringify(patient!.statedDiagnoses) === JSON.stringify(["hemophilia_a"]), "household diagnoses = child's only (adult spouse's submitted dx dropped, pending adults excluded)");
  const [sam, kid, gran] = patient!.householdMembers;
  ok(sam.status === "pending" && sam.statedDiagnoses.length === 0 && !!sam.confirmTokenHash, "spouse: pending, no diagnoses, token hash stored");
  ok(kid.status === "not_required" && kid.statedDiagnoses[0] === "hemophilia_a", "child: not_required with Hemophilia A");
  ok(gran.status === "pending" && gran.confirmByPhone && !gran.confirmTokenHash, "parent: pending, confirmByPhone, no token");
  const types = patient!.consentRecords.map((c) => c.type).sort().join(",");
  ok(types === "age_guardian_attestation,data_and_contact,media,newsletter,sms", "primary consents + attestation recorded (v3 adds sms and newsletter rows)");
  const mail = await prisma.emailLog.findMany({ where: { patientId: patient!.id, templateType: "MEMBER_CONFIRMATION" } });
  const { emailOutbox } = await import("@/lib/email/send");
  ok(mail.length === 1 && mail[0].status === "captured", `spouse confirmation email captured, not sent (log rows: ${mail.map((m) => m.status + ":" + m.error)})`);
  ok(emailOutbox().some((m) => m.kind === "MEMBER_CONFIRMATION" && [m.to].flat().includes(`delivered+${tag}s@resend.dev`)), "the outbox holds the spouse's confirmation email");

  // --- spouse confirms ---
  const tok = (await reissueMemberToken(sam.id))!.raw;
  const old = await reissueMemberToken(sam.id); // second reissue invalidates the first
  ok(!!old, "resend issues a fresh token");
  r = await post(conf.POST, { action: "confirm", firstName: "Sam", consentData: true, consentMedia: false, adult: true, diagnoses: ["hemophilia_b"] }, { params: { token: tok } });
  ok(r.status === 404, "old (replaced) token is rejected");
  r = await post(conf.POST, { action: "confirm", firstName: "Sam", consentData: false, adult: true }, { params: { token: old!.raw } });
  ok(r.status === 400, "confirm requires data-and-contact consent");
  r = await post(conf.POST, { action: "confirm", firstName: "Sam", consentData: true, consentMedia: false, adult: true, diagnoses: ["hemophilia_b"] }, { params: { token: old!.raw } });
  ok(r.status === 200, "spouse confirms");
  const p2 = await prisma.patient.findUnique({ where: { id: patient!.id } });
  ok([...p2!.statedDiagnoses].sort().join() === "hemophilia_a,hemophilia_b", "household diagnoses now include confirmed spouse's");
  const sc = await prisma.consentRecord.findMany({ where: { householdMemberId: sam.id } });
  ok(sc.length === 3 && sc.every((c) => c.patientId === null && c.method === "web"), "spouse consents recorded with householdMemberId");
  r = await post(conf.POST, { action: "confirm", firstName: "Sam", consentData: true, adult: true }, { params: { token: old!.raw } });
  ok(r.status === 404, "token invalid after use");
  let threw = false;
  try { await prisma.$executeRawUnsafe(`UPDATE consent_records SET granted = NOT granted WHERE "householdMemberId" = '${sam.id}'`); } catch { threw = true; }
  ok(threw, "append-only trigger still blocks UPDATE on member consents");
  threw = false;
  try { await prisma.$executeRawUnsafe(`INSERT INTO consent_records (id,"patientId","householdMemberId",type,granted,"textVersion",method) VALUES ('x1','${patient!.id}','${sam.id}','media',true,'v','web')`); } catch { threw = true; }
  ok(threw, "CHECK blocks a consent with both subjects");

  // --- decline purges ---
  r = await post(reg.POST, base({ lastName: tag + "d", email: `delivered+${tag}b@resend.dev`, familySize: 2, members: [{ ...m0[0], diagnoses: [] }] }));
  const cpd = await prisma.contactProfile.findFirst({ where: { lastName: tag + "d" } });
  created.push(cpd!.patientId!);
  const dm = await prisma.householdMember.findFirst({ where: { patientId: cpd!.patientId! } });
  const dtok = (await reissueMemberToken(dm!.id))!.raw;
  r = await post(conf.POST, { action: "decline" }, { params: { token: dtok } });
  const dm2 = await prisma.householdMember.findUnique({ where: { id: dm!.id } });
  const dp = await prisma.patient.findUnique({ where: { id: cpd!.patientId! } });
  ok(r.status === 200 && dm2!.status === "declined" && dm2!.firstName === null && dm2!.email === null && dm2!.confirmTokenHash === null && dm2!.statedDiagnoses.length === 0, "decline purges name/email/diagnoses/token");
  ok(dp!.familySize === 2, "declined placeholder still counted in familySize");

  // --- expiry cron on back-dated pending members ---
  const day = 86400000;
  await prisma.householdMember.update({ where: { id: gran.id }, data: { createdAt: new Date(Date.now() - 31 * day) } });
  const n = await expirePendingMembers();
  const g2 = await prisma.householdMember.findUnique({ where: { id: gran.id } });
  ok(n >= 1 && g2!.status === "expired" && g2!.firstName === null, "expiry cron purges back-dated pending member");
  const aud = await prisma.auditLog.findFirst({ where: { action: "HOUSEHOLD_MEMBER_EXPIRED", resourceId: gran.id } });
  ok(!!aud && !/hemophilia/i.test(aud.details ?? ""), "expiry audit-logged with ids only");

  // --- phone confirmation (board) ---
  r = await post(reg.POST, base({ lastName: tag + "p", email: `delivered+${tag}c@resend.dev`, familySize: 2, members: [m0[2]] }));
  const cpp = await prisma.contactProfile.findFirst({ where: { lastName: tag + "p" } });
  created.push(cpp!.patientId!);
  const pm = await prisma.householdMember.findFirst({ where: { patientId: cpp!.patientId! } });
  const board = await prisma.patient.findFirst({ where: { role: "board", boardRoles: { some: { active: true, role: { in: ["PRESIDENT", "VICE_PRESIDENT"] } } } } });
  const pc = await phoneConfirmMember(pm!.id, cpp!.patientId!, board!.id, { consentMedia: true });
  const pcr = await prisma.consentRecord.findMany({ where: { householdMemberId: pm!.id } });
  ok(pc && pcr.length === 3 && pcr.every((c) => c.method === "phone" && c.recordedByBoardUserId === board!.id), "phone confirmation records consents with method phone + board user id");
  ok((await prisma.householdMember.findUnique({ where: { id: pm!.id } }))!.status === "confirmed", "phone-confirmed member is confirmed");

  // --- matching ---
  const ev = await prisma.event.create({
    data: { slug: tag, titleEn: "t", titleEs: "t", eventDate: new Date(Date.now() + 10 * day), location: "x", status: "published", language: "both",
      targeting: { create: { targetConditions: ["hemophilia_a"], targetAgeGroups: ["6_12"], targetSeverity: [], targetInterests: [] } } },
  });
  // household B: only Hemophilia A case is a PENDING adult (seeded directly, bypassing app rules)
  r = await post(reg.POST, base({ lastName: tag + "b", email: `delivered+${tag}e@resend.dev`, familySize: 2, members: [{ ...m0[0], diagnoses: [] }] }));
  const cpb = await prisma.contactProfile.findFirst({ where: { lastName: tag + "b" } });
  created.push(cpb!.patientId!);
  await prisma.householdMember.updateMany({ where: { patientId: cpb!.patientId! }, data: { statedDiagnoses: ["hemophilia_a"] } });
  // New registrations start pending_review; only approved households are matched, so approve both for this check.
  await prisma.patient.updateMany({ where: { id: { in: created } }, data: { reviewStatus: "approved" } });
  const match = await matchPatientsForEvent(ev.id);
  const ids = new Set(match!.emailMatches.map((p) => p.id));
  ok(ids.has(patient!.id), "event (Hemophilia A, ages 6-12) matches household with the 8-year-old with Hemophilia A");
  ok(!ids.has(cpb!.patientId!), "does not match household whose only Hemophilia A is a pending adult");
  await prisma.event.delete({ where: { id: ev.id } });

  // --- PHI hygiene ---
  const MemberConfirmation = (await import("@/messages/MemberConfirmation")).default;
  const RegConf = (await import("@/messages/RegistrationInfoConfirmation")).default;
  const html = (await render(MemberConfirmation({ firstName: "Sam", primaryFirstName: "Pat", confirmUrl: "https://x/confirm/abc?lang=es", lang: "es" }))) +
    (await render(MemberConfirmation({ firstName: "Sam", primaryFirstName: "Pat", confirmUrl: "https://x/confirm/abc", lang: "en" }))) +
    (await render(RegConf({ firstName: "Pat", lang: "en" })));
  const hit = html.match(/hemophilia [ab]\b|hemofilia [ab]\b|hemophilia_|willebrand|carrier|portador|caregiver|cuidador|bleeding disorder|trastorno/i); if (hit) say("  matched: " + hit[0]);
  ok(!hit, "email HTML contains no diagnosis values or labels");
  const dump = logs.join("\n");
  ok(!/hemophilia_|von_willebrand|family_caregiver/i.test(dump), "captured logs contain no diagnosis values");
  const emailRows = await prisma.emailLog.findMany({ where: { patientId: { in: created } } });
  ok(emailRows.every((e) => e.subject === "" && e.recipient === ""), "EmailLog rows carry no subject/recipient/content");

  // cleanup (members + consents cascade)
  await prisma.patient.deleteMany({ where: { id: { in: created } } });
  console.info(fails === 0 ? "\nALL PASSED" : `\n${fails} FAILED`);
  await prisma.$disconnect();
  process.exit(fails ? 1 : 0);
}
main().catch((e) => { process.stdout.write("ERR " + (e?.stack ?? e) + "\n"); process.exit(2); });
