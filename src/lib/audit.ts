import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Who acted. Every NEW audit write sets this; old rows are NULL ("unclassified", deliberately not backfilled to
 * "board": public-form entries share the table).
 *   board   a signed-in board member
 *   family  a signed-in household (Phase 2+)
 *   system  code acting on its own (matching, crons)
 *   public  an unauthenticated visitor using a token or a public form
 */
export type ActorType = "board" | "family" | "system" | "public";

export interface AuditInput {
  actorType: ActorType;
  /** The acting Patient row (board member or family). Null for system/public. NOT the subject of the action. */
  actorPatientId?: string | null;
  /** Family page: the confirmed adult member who acted (null/absent = the primary, a board member or the system). */
  actorMemberId?: string | null;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string | null;
  /** Ids, codes and field NAMES only. */
  details?: string;
  /** Structured ids and codes, e.g. { eventId, patientId, reasonCode }. */
  changes?: Record<string, AuditValue>;
}

/** Audit values: ids, codes, counts and lists/maps of those. Never names, emails, phone numbers or diagnoses. */
export type AuditValue = string | number | boolean | null | AuditValue[] | { [key: string]: AuditValue };

/**
 * The audit log holds ids only: no names, emails, phone numbers or diagnoses (Privacy Policy, CLAUDE.md rule 4).
 * Throws on anything that looks like an email address so a careless caller fails in development, not in production data.
 */
export function assertIdsOnly(input: Pick<AuditInput, "details" | "changes">) {
  const text = `${input.details ?? ""} ${JSON.stringify(input.changes ?? {})}`;
  if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(text)) throw new Error("audit: details/changes must not contain an email address");
}

export function auditData(input: AuditInput): Prisma.AuditLogUncheckedCreateInput {
  assertIdsOnly(input);
  return {
    patientId: input.actorPatientId ?? null,
    actorType: input.actorType,
    actorMemberId: input.actorMemberId ?? null,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    details: input.details,
    changes: input.changes as Prisma.InputJsonValue | undefined,
  };
}

export async function audit(input: AuditInput) {
  await prisma.auditLog.create({ data: auditData(input) });
}

export async function auditMany(inputs: AuditInput[]) {
  if (inputs.length === 0) return;
  await prisma.auditLog.createMany({ data: inputs.map(auditData) });
}
