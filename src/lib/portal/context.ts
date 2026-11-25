import { AuditAction, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit, auditData, type AuditValue } from "@/lib/audit";
import { actorMemberId, EDITS_PER_MINUTE, type Actor } from "./permissions";

/** Who is acting on which household. BOTH come from the session, never from the request. */
export interface PortalCtx { householdId: string; actor: Actor }

export type EditResult<T extends object = object> = ({ ok: true } & T) | { ok: false; status: number; error: string; field?: string };
export const bad = (field: string): EditResult<never> => ({ ok: false, status: 400, error: "invalid", field });
export const forbidden = (): EditResult<never> => ({ ok: false, status: 403, error: "forbidden" });
export const notFound = (): EditResult<never> => ({ ok: false, status: 404, error: "not_found" });

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * One family-page audit row: actorType "family", the household as patientId, the ACTING adult's member id (null = the
 * primary), the action, the ids involved and FIELD NAMES. Never values: no names, emails, phones or diagnoses.
 */
export function auditFamily(
  ctx: PortalCtx, action: AuditAction, resourceType: string, resourceId: string, details: string, changes: Record<string, AuditValue> = {}, db: Db = prisma,
) {
  return db.auditLog.create({
    data: auditData({
      actorType: "family", actorPatientId: ctx.householdId, actorMemberId: actorMemberId(ctx.actor),
      action, resourceType, resourceId, details,
      changes: { ...changes, actor: actorMemberId(ctx.actor) ?? ctx.householdId },
    }),
  });
}

export const auditFamilyOnly = audit;

const EDIT_ACTIONS: AuditAction[] = [
  AuditAction.PORTAL_PROFILE_CHANGED, AuditAction.PORTAL_MEMBER_CHANGED, AuditAction.PORTAL_DIAGNOSES_CHANGED, AuditAction.PORTAL_GUARDIAN_CHANGED,
  AuditAction.PORTAL_EMAIL_CHANGE_REQUESTED, AuditAction.PORTAL_EMAIL_CHANGED, AuditAction.PORTAL_MEMBER_LEFT, AuditAction.PORTAL_DELETION_REQUESTED, AuditAction.PORTAL_CONSENT_CHANGED, AuditAction.FLYER_DELIVERY_CHANGED,
];

/** Changes are rate-limited per person, counted from the audit log (so it holds across serverless instances). */
export async function overEditLimit(ctx: PortalCtx, now = new Date()): Promise<boolean> {
  const n = await prisma.auditLog.count({
    where: { patientId: ctx.householdId, actorType: "family", actorMemberId: actorMemberId(ctx.actor), action: { in: EDIT_ACTIONS }, createdAt: { gte: new Date(now.getTime() - 60_000) } },
  });
  return n >= EDITS_PER_MINUTE;
}
