import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isRemovalReason, REMOVAL_REASON_LABELS } from "./removal";

/**
 * Per-event "who matched / who was sent / who was removed and by whom".
 * Source of truth: the Invitation rows plus the INVITATION_* audit rows (ids only). Names are looked up HERE, at
 * read time, for President/VP only (canManageUsers); nothing is stored in the log. Diagnoses are never read.
 */
export interface ReportPerson { id: string; name: string }
export interface MatchedRow { invitationId: string; household: ReportPerson; at: Date; trigger: string; by: ReportPerson | null; status: string }
export interface SentRow { invitationId: string; household: ReportPerson; at: Date; by: ReportPerson | null; status: string }
export interface RemovedRow { invitationId: string; household: ReportPerson; at: Date; by: ReportPerson | null; reason: string; backOnList: boolean }
export interface InvitationReport {
  counts: { matched: number; sent: number; removed: number; removedStillOff: number };
  matched: MatchedRow[];
  sent: SentRow[];
  removed: RemovedRow[];
}

const TRIGGER_LABELS: Record<string, string> = {
  publish: "Automatic (event published)",
  edit: "Automatic (event edited)",
  manual_regenerate: "Automatic (re-run matching)",
  manual_add: "Added by hand",
  manual_restore: "Put back by hand",
  before_logging: "Before logging began",
};
export const triggerLabel = (t: string) => TRIGGER_LABELS[t] ?? t;
export const reasonLabel = (r: string) => (isRemovalReason(r) ? REMOVAL_REASON_LABELS[r] : r);

const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

export async function buildInvitationReport(eventId: string): Promise<InvitationReport> {
  const invitations = await prisma.invitation.findMany({
    where: { eventId },
    select: { id: true, patientId: true, status: true, sentAt: true, sentByBoardUserId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const ids = invitations.map((i) => i.id);
  const logs = ids.length
    ? await prisma.auditLog.findMany({
        where: { resourceType: "Invitation", resourceId: { in: ids }, action: { in: [AuditAction.INVITATION_MATCHED, AuditAction.INVITATION_REMOVED] } },
        select: { action: true, resourceId: true, patientId: true, changes: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  // Everyone we need a display name for: households and board users.
  const personIds = new Set<string>();
  invitations.forEach((i) => { personIds.add(i.patientId); if (i.sentByBoardUserId) personIds.add(i.sentByBoardUserId); });
  logs.forEach((l) => {
    if (l.patientId) personIds.add(l.patientId);
    const c = (l.changes ?? {}) as Record<string, unknown>;
    const t = str(c.triggeredByBoardUserId);
    if (t) personIds.add(t);
  });
  const people = await prisma.patient.findMany({
    where: { id: { in: Array.from(personIds) } },
    select: { id: true, contactProfile: { select: { firstName: true, lastName: true } } },
  });
  const nameOf = new Map(people.map((p) => [p.id, `${p.contactProfile?.firstName ?? ""} ${p.contactProfile?.lastName ?? ""}`.trim() || "(no name on file)"]));
  const person = (id: string | null | undefined): ReportPerson | null => (id ? { id, name: nameOf.get(id) ?? "(deleted)" } : null);

  const inv = new Map(invitations.map((i) => [i.id, i]));
  const matchedLogs = new Map<string, (typeof logs)[number]>(); // latest match per invitation
  const removedLogs: (typeof logs) = [];
  for (const l of logs) {
    if (!l.resourceId) continue;
    if (l.action === AuditAction.INVITATION_MATCHED) matchedLogs.set(l.resourceId, l);
    else removedLogs.push(l);
  }

  const matched: MatchedRow[] = invitations.map((i) => {
    const l = matchedLogs.get(i.id);
    const c = (l?.changes ?? {}) as Record<string, unknown>;
    return {
      invitationId: i.id,
      household: person(i.patientId)!,
      at: l?.createdAt ?? i.createdAt,
      trigger: l ? (str(c.trigger) ?? "unknown") : "before_logging",
      by: person(str(c.triggeredByBoardUserId)),
      status: i.status,
    };
  });

  const sent: SentRow[] = invitations
    .filter((i) => i.sentAt)
    .map((i) => ({ invitationId: i.id, household: person(i.patientId)!, at: i.sentAt!, by: person(i.sentByBoardUserId), status: i.status }));

  const removed: RemovedRow[] = removedLogs.map((l) => {
    const i = inv.get(l.resourceId!)!;
    const c = (l.changes ?? {}) as Record<string, unknown>;
    return {
      invitationId: i.id,
      household: person(i.patientId)!,
      at: l.createdAt,
      by: person(l.patientId),
      reason: str(c.reasonCode) ?? "unknown",
      backOnList: i.status !== "removed",
    };
  });

  return {
    counts: {
      matched: matched.length,
      sent: sent.length,
      removed: removed.length,
      removedStillOff: invitations.filter((i) => i.status === "removed").length,
    },
    matched,
    sent,
    removed,
  };
}
