import type { Prisma } from "@prisma/client";
import { CONSENT_TEXT_VERSION } from "@/content/consent";
import { newestSms, smsConsentCovers } from "./sms";

export type SmsSubject = { patientId: string } | { householdMemberId: string };

/**
 * Call inside the transaction that changes a phone number (family page, admin patient page, merge). If the newest "sms"
 * record is a yes that does not cover the new number, a refusal is appended (method "system", reason PHONE_CHANGED).
 * Consent rows are never edited. Returns whether a row was added. `newPhone` null = the number was removed.
 */
export async function lapseSmsConsent(tx: Prisma.TransactionClient, subject: SmsSubject, newPhone: string | null, boardUserId: string | null = null): Promise<boolean> {
  const rows = await tx.consentRecord.findMany({ where: { ...subject, type: "sms" }, select: { type: true, granted: true, createdAt: true, phoneNumber: true } });
  if (!newestSms(rows)?.granted || smsConsentCovers(rows, newPhone)) return false;
  await tx.consentRecord.create({
    data: { ...subject, type: "sms", granted: false, textVersion: CONSENT_TEXT_VERSION, method: "system", reasonCode: "PHONE_CHANGED", recordedByBoardUserId: boardUserId },
  });
  return true;
}
