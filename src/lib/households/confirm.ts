import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashToken, looksLikeToken } from "@/lib/tokens";
import { CONSENT_TEXT_VERSION, type MemberConsentType } from "@/content/consent";
import { cleanText, isValidEmail, normalizeEmail } from "@/lib/patients/normalize";
import { sanitizeDiagnoses } from "@/lib/patients/diagnoses";
import { CONFIRM_TOKEN_DAYS } from "./constants";
import { purgedMemberData, recomputeHousehold } from "./sync";
import { generateToken } from "@/lib/tokens";

/** The member behind a still-valid link (pending, token not expired), or null. */
export async function resolveConfirmToken(raw: unknown) {
  if (!looksLikeToken(raw)) return null;
  const m = await prisma.householdMember.findUnique({
    where: { confirmTokenHash: hashToken(raw) },
    include: { patient: { select: { preferredLanguage: true } } },
  });
  if (!m || m.status !== "pending") return null;
  if (!m.confirmTokenExpiresAt || m.confirmTokenExpiresAt.getTime() < Date.now()) return null;
  return m;
}

const audit = (action: AuditAction, memberId: string, details: string, actorId: string | null = null) =>
  prisma.auditLog.create({
    data: { patientId: actorId, action, resourceType: "HouseholdMember", resourceId: memberId, details },
  });

export type ConfirmInput = {
  firstName: unknown;
  lastName: unknown;
  email: unknown;
  diagnoses: unknown;
  consentData: unknown;
  consentMedia: unknown;
  adult: unknown;
};

/** Self-confirmation via link. Single use: the guarded updateMany makes a double submit a no-op. */
export async function confirmMember(raw: string, i: ConfirmInput): Promise<{ ok: true } | { ok: false; field: string }> {
  const m = await resolveConfirmToken(raw);
  if (!m) return { ok: false, field: "token" };

  const firstName = cleanText(i.firstName, 100);
  if (!firstName) return { ok: false, field: "firstName" };
  const email = normalizeEmail(i.email);
  if (email && !isValidEmail(email)) return { ok: false, field: "email" };
  if (i.consentData !== true) return { ok: false, field: "consentData" };
  if (i.adult !== true) return { ok: false, field: "adult" };

  const consents: { type: MemberConsentType; granted: boolean }[] = [
    { type: "data_and_contact", granted: true },
    { type: "media", granted: i.consentMedia === true },
    { type: "adult_attestation", granted: true },
  ];

  const done = await prisma.$transaction(async (tx) => {
    const res = await tx.householdMember.updateMany({
      where: { id: m.id, status: "pending", confirmTokenHash: m.confirmTokenHash },
      data: {
        status: "confirmed",
        confirmedAt: new Date(),
        firstName,
        lastName: cleanText(i.lastName, 100) || null,
        email,
        statedDiagnoses: sanitizeDiagnoses(i.diagnoses), // the adult's OWN answer
        confirmTokenHash: null,
        confirmTokenExpiresAt: null,
      },
    });
    if (res.count !== 1) return false;
    await tx.consentRecord.createMany({
      data: consents.map((c) => ({
        householdMemberId: m.id,
        type: c.type,
        granted: c.granted,
        textVersion: CONSENT_TEXT_VERSION,
        method: "web",
      })),
    });
    await recomputeHousehold(tx, m.patientId);
    return true;
  });
  if (!done) return { ok: false, field: "token" };
  await audit(AuditAction.HOUSEHOLD_MEMBER_CONFIRMED, m.id, `Member confirmed (patient ${m.patientId})`);
  return { ok: true };
}

/** "Remove me from this registration": purge details, keep a counted placeholder. */
export async function declineMember(raw: string): Promise<boolean> {
  const m = await resolveConfirmToken(raw);
  if (!m) return false;
  const done = await prisma.$transaction(async (tx) => {
    const res = await tx.householdMember.updateMany({
      where: { id: m.id, status: "pending", confirmTokenHash: m.confirmTokenHash },
      data: purgedMemberData("declined"),
    });
    if (res.count !== 1) return false;
    await recomputeHousehold(tx, m.patientId);
    return true;
  });
  if (done) await audit(AuditAction.HOUSEHOLD_MEMBER_DECLINED, m.id, `Member declined (patient ${m.patientId})`);
  return done;
}

/** Daily cron: purge pending members past their deadline (token expiry, or created 30+ days ago when there's no token). */
export async function expirePendingMembers(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - CONFIRM_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  const due = await prisma.householdMember.findMany({
    where: {
      status: "pending",
      OR: [
        { confirmTokenExpiresAt: { lt: now } },
        { confirmTokenExpiresAt: null, createdAt: { lt: cutoff } },
      ],
    },
    select: { id: true, patientId: true },
  });
  let n = 0;
  for (const m of due) {
    const done = await prisma.$transaction(async (tx) => {
      const res = await tx.householdMember.updateMany({
        where: { id: m.id, status: "pending" },
        data: purgedMemberData("expired"),
      });
      if (res.count !== 1) return false;
      await recomputeHousehold(tx, m.patientId);
      return true;
    });
    if (done) {
      n++;
      await audit(AuditAction.HOUSEHOLD_MEMBER_EXPIRED, m.id, `Pending member expired (patient ${m.patientId})`);
    }
  }
  return n;
}

/** New token (old one is replaced = invalidated). Returns the raw token for the email, or null if not resendable. */
export async function reissueMemberToken(memberId: string): Promise<{ raw: string } | null> {
  const raw = generateToken();
  const res = await prisma.householdMember.updateMany({
    where: { id: memberId, status: "pending", email: { not: null } },
    data: {
      confirmTokenHash: hashToken(raw),
      confirmTokenExpiresAt: new Date(Date.now() + CONFIRM_TOKEN_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return res.count === 1 ? { raw } : null;
}

/**
 * Board-recorded confirmation by phone: the member's consents are recorded with
 * method "phone" and the board user's id. The board never enters health
 * information for an adult, so no diagnoses are set here.
 */
export async function phoneConfirmMember(
  memberId: string,
  patientId: string,
  boardUserId: string,
  opts: { consentMedia: boolean },
): Promise<boolean> {
  const consents: { type: MemberConsentType; granted: boolean }[] = [
    { type: "data_and_contact", granted: true },
    { type: "media", granted: opts.consentMedia },
    { type: "adult_attestation", granted: true },
  ];
  const done = await prisma.$transaction(async (tx) => {
    const res = await tx.householdMember.updateMany({
      where: { id: memberId, patientId, status: "pending" },
      data: { status: "confirmed", confirmedAt: new Date(), confirmTokenHash: null, confirmTokenExpiresAt: null },
    });
    if (res.count !== 1) return false;
    await tx.consentRecord.createMany({
      data: consents.map((c) => ({
        householdMemberId: memberId,
        type: c.type,
        granted: c.granted,
        textVersion: CONSENT_TEXT_VERSION,
        method: "phone",
        recordedByBoardUserId: boardUserId,
      })),
    });
    await recomputeHousehold(tx, patientId);
    return true;
  });
  if (done) await audit(AuditAction.HOUSEHOLD_MEMBER_PHONE_CONFIRMED, memberId, `Member confirmed by phone (patient ${patientId})`, boardUserId);
  return done;
}
