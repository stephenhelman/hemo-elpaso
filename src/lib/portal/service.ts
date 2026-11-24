import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { CONSENT_TEXT_VERSION } from "@/content/consent";
import { CONSENT_CHANGES_PER_MINUTE, consentChange, type PortalConsentType } from "./rules";

export type ConsentResult =
  | { ok: true; changed: boolean; granted: boolean }
  | { ok: false; status: 429; error: "rate_limited" };

/** The family page's activity log row: actorType "family", ids and codes only. */
export const auditPortalView = (patientId: string) =>
  audit({ actorType: "family", actorPatientId: patientId, action: AuditAction.PORTAL_VIEWED, resourceType: "Patient", resourceId: patientId, details: "Family page viewed" });

/**
 * Record a consent choice made on the family page: a new consent_records row (method "portal", current text version),
 * never an update. The row and its audit entry are written together. Writing the value that is already current is a
 * no-op. `patientId` is the signed-in person's own household (from the session).
 */
export async function recordPortalConsent(patientId: string, type: PortalConsentType, granted: boolean): Promise<ConsentResult> {
  const recent = await prisma.auditLog.count({
    where: { patientId, action: AuditAction.PORTAL_CONSENT_CHANGED, createdAt: { gte: new Date(Date.now() - 60_000) } },
  });
  if (recent >= CONSENT_CHANGES_PER_MINUTE) return { ok: false, status: 429, error: "rate_limited" };

  const rows = await prisma.consentRecord.findMany({ where: { patientId, type }, select: { type: true, granted: true, createdAt: true } });
  if (consentChange(rows, type, granted) === "noop") return { ok: true, changed: false, granted };

  await prisma.$transaction([
    prisma.consentRecord.create({ data: { patientId, type, granted, textVersion: CONSENT_TEXT_VERSION, method: "portal" } }),
    prisma.auditLog.create({
      data: {
        patientId, actorType: "family", action: AuditAction.PORTAL_CONSENT_CHANGED, resourceType: "ConsentRecord", resourceId: patientId,
        details: "Consent changed on the family page", changes: { type, granted, textVersion: CONSENT_TEXT_VERSION },
      },
    }),
  ]);
  return { ok: true, changed: true, granted };
}
