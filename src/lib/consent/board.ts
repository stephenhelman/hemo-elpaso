import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { CONSENT_TEXT_VERSION } from "@/content/consent";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { newest } from "@/lib/identity/merge-rules";
import { checkBoardChange, isBoardTypeFor } from "./board-rules";
import { currentSmsConsent } from "./sms";
import { normalizePhone } from "@/lib/patients/normalize";

export type BoardConsentError = "bad_reason" | "family_ask_required" | "no_change" | "not_found" | "needs_phone" | "needs_email" | "bad_type";
export type BoardConsentResult = { ok: true; recordId: string } | { ok: false; status: number; error: BoardConsentError };

/**
 * An officer records a consent change for a household (subject = the primary) or for one confirmed adult member.
 * Appends a record with the CURRENT text version, method "board", the officer's id and the reason code, and writes the
 * audit row in the same transaction. The audit row has ids, the consent type and on/off only (no reason text, no values).
 * Withdrawing data_and_contact takes effect immediately: every non-essential email reads the newest record at send time
 * (lib/email/policy.ts).
 */
export async function recordBoardConsent(
  officerId: string,
  patientId: string,
  input: { memberId?: string | null; type: unknown; granted: boolean; reason: unknown },
): Promise<BoardConsentResult> {
  const subject = input.memberId ? "member" : "patient";
  if (!isBoardTypeFor(subject, input.type)) return { ok: false, status: 400, error: "bad_type" };
  const type = input.type;

  const p = await prisma.patient.findFirst({ where: { id: patientId, ...PATIENT_ONLY }, select: { id: true, email: true, contactProfile: { select: { phone: true } } } });
  if (!p) return { ok: false, status: 404, error: "not_found" };
  if (input.memberId) {
    const m = await prisma.householdMember.findFirst({ where: { id: input.memberId, patientId, ageGroup: "18_plus", status: "confirmed" }, select: { id: true } });
    if (!m) return { ok: false, status: 404, error: "not_found" };
  }

  const rows = await prisma.consentRecord.findMany({ where: input.memberId ? { householdMemberId: input.memberId } : { patientId }, select: { type: true, granted: true, createdAt: true, phoneNumber: true } });
  // Turning texting ON compares with what covers the current number, so a stale yes can be asked for again. Turning it
  // off compares with the newest record, so a refusal can always be recorded over any yes.
  const phone = p.contactProfile?.phone ?? null;
  const current = type === "sms" && input.granted ? currentSmsConsent(rows, phone) : newest(rows, type);
  const check = checkBoardChange(current, input.granted, input.reason);
  if (!check.ok) return { ok: false, status: check.error === "no_change" ? 409 : 400, error: check.error };
  // Same prerequisites as registration: a text consent needs a number, a newsletter consent needs an email.
  if (input.granted && !input.memberId && type === "sms" && !p.contactProfile?.phone) return { ok: false, status: 409, error: "needs_phone" };
  if (input.granted && !input.memberId && type === "newsletter" && !p.email) return { ok: false, status: 409, error: "needs_email" };

  const record = await prisma.$transaction(async (tx) => {
    const r = await tx.consentRecord.create({
      data: {
        ...(input.memberId ? { householdMemberId: input.memberId } : { patientId }),
        type, granted: input.granted, textVersion: CONSENT_TEXT_VERSION, method: "board",
        recordedByBoardUserId: officerId, reasonCode: input.reason as string,
        ...(type === "sms" && input.granted ? { phoneNumber: normalizePhone(phone) } : {}),
      },
    });
    await tx.auditLog.create({
      data: auditData({
        actorType: "board", actorPatientId: officerId, action: AuditAction.CONSENT_CHANGED_BY_BOARD, resourceType: "ConsentRecord", resourceId: r.id,
        details: "Consent changed by an officer", changes: { patientId, memberId: input.memberId ?? null, type, granted: input.granted },
      }),
    });
    return r;
  });
  return { ok: true, recordId: record.id };
}
