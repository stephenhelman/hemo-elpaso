import { randomUUID } from "crypto";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auditMany } from "@/lib/audit";
import { generateToken, hashToken } from "@/lib/tokens";
import { matchPatientsForEvent } from "./match";
import type { MatchTrigger } from "./removal";

export interface GenerateContext {
  /** Why matching ran (stored in the audit row). */
  trigger: MatchTrigger;
  /** The board member whose action ran it. Ids only; the match itself is done by the system. */
  byBoardUserId: string | null;
}

/**
 * Create PENDING invitations for new matches. Idempotent and additive:
 * existing rows (pending, sent, answered, REMOVED, or manually kept) are never touched,
 * so re-running after edits adds only new matches and can never cause a re-send
 * or bring back a household a board member removed.
 * The token stored here is a throwaway: the real token is minted at send time
 * (raw tokens exist only in email links).
 *
 * Every invitation created here writes one INVITATION_MATCHED audit row (actorType "system", ids only).
 */
export async function generateInvitations(
  eventId: string,
  ctx: GenerateContext = { trigger: "manual_regenerate", byBoardUserId: null },
): Promise<number> {
  const m = await matchPatientsForEvent(eventId);
  if (!m) return 0;
  if (m.emailMatches.length === 0) return 0;

  const existing = new Set(
    (
      await prisma.invitation.findMany({
        where: { eventId },
        select: { patientId: true },
      })
    ).map((i) => i.patientId),
  );
  const fresh = m.emailMatches.filter((p) => !existing.has(p.id));
  if (fresh.length === 0) return 0;

  // Ids are assigned here so the audit rows can point at the invitation they describe.
  const rows = fresh.map((p) => ({ id: randomUUID(), patientId: p.id }));
  await prisma.invitation.createMany({
    data: rows.map((r) => ({
      id: r.id,
      eventId,
      patientId: r.patientId,
      tokenHash: hashToken(generateToken()),
      status: "pending",
    })),
    skipDuplicates: true,
  });

  // Log only what was actually created (a concurrent run may have inserted some first).
  const created = await prisma.invitation.findMany({
    where: { id: { in: rows.map((r) => r.id) } },
    select: { id: true, patientId: true },
  });
  await auditMany(
    created.map((i) => ({
      actorType: "system" as const,
      actorPatientId: null,
      action: AuditAction.INVITATION_MATCHED,
      resourceType: "Invitation",
      resourceId: i.id,
      changes: { eventId, patientId: i.patientId, trigger: ctx.trigger, triggeredByBoardUserId: ctx.byBoardUserId },
    })),
  );
  return created.length;
}
