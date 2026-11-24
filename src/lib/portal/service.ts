import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { CONSENT_TEXT_VERSION } from "@/content/consent";
import { CONSENT_CHANGES_PER_MINUTE, consentChange, type PortalConsentType } from "./rules";

export type ConsentResult =
  | { ok: true; changed: boolean; granted: boolean }
  | { ok: false; status: 429; error: "rate_limited" }
  | { ok: false; status: 403; error: "forbidden" };

/** The family page's activity log row: actorType "family", ids and codes only. `actorMemberId` = the adult who looked (null = the primary). */
export const auditPortalView = (patientId: string, actorMemberId: string | null = null) =>
  audit({ actorType: "family", actorPatientId: patientId, actorMemberId, action: AuditAction.PORTAL_VIEWED, resourceType: "Patient", resourceId: patientId, details: "Family page viewed", changes: { actor: actorMemberId ?? patientId } });

/**
 * Record a consent choice made on the family page: a new consent_records row (method "portal", current text version),
 * never an update. The row and its audit entry are written together. Writing the value that is already current is a
 * no-op. `patientId` is the signed-in household (from the session). With `actorMemberId` the choice is that confirmed
 * adult's OWN (their member row); without it, the household's (the primary's and the minors').
 */
export async function recordPortalConsent(patientId: string, type: PortalConsentType, granted: boolean, actorMemberId: string | null = null): Promise<ConsentResult> {
  const recent = await prisma.auditLog.count({
    where: { patientId, actorMemberId, action: AuditAction.PORTAL_CONSENT_CHANGED, createdAt: { gte: new Date(Date.now() - 60_000) } },
  });
  if (recent >= CONSENT_CHANGES_PER_MINUTE) return { ok: false, status: 429, error: "rate_limited" };

  if (actorMemberId) {
    // only a CONFIRMED adult of this household may record on their own row
    const m = await prisma.householdMember.findFirst({ where: { id: actorMemberId, patientId, status: "confirmed", ageGroup: "18_plus" }, select: { id: true } });
    if (!m) return { ok: false, status: 403, error: "forbidden" };
  }
  const subject = actorMemberId ? { householdMemberId: actorMemberId } : { patientId };
  const rows = await prisma.consentRecord.findMany({ where: { ...subject, type }, select: { type: true, granted: true, createdAt: true } });
  if (consentChange(rows, type, granted) === "noop") return { ok: true, changed: false, granted };

  await prisma.$transaction([
    prisma.consentRecord.create({ data: { ...subject, type, granted, textVersion: CONSENT_TEXT_VERSION, method: "portal" } }),
    prisma.auditLog.create({
      data: {
        patientId, actorType: "family", actorMemberId, action: AuditAction.PORTAL_CONSENT_CHANGED, resourceType: "ConsentRecord", resourceId: actorMemberId ?? patientId,
        details: "Consent changed on the family page", changes: { type, granted, textVersion: CONSENT_TEXT_VERSION, actor: actorMemberId ?? patientId },
      },
    }),
  ]);
  return { ok: true, changed: true, granted };
}
