import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import type { RemovalReason } from "./removal";

/**
 * Remove a PENDING invitation: the row is KEPT with status "removed" (so matching never re-adds the household),
 * and one INVITATION_REMOVED audit row records who, which invitation and the reason CODE (ids only).
 * Returns false if it wasn't pending (sent invitations stay: their link is already out).
 */
export async function removeInvitation(eventId: string, invId: string, reason: RemovalReason, boardUserId: string): Promise<boolean> {
  const inv = await prisma.invitation.findFirst({
    where: { id: invId, eventId, status: "pending" },
    select: { id: true, patientId: true },
  });
  if (!inv) return false;

  // Conditional on still being pending, so two board members clicking at once log one removal.
  const res = await prisma.invitation.updateMany({
    where: { id: inv.id, status: "pending" },
    data: { status: "removed", removedAt: new Date(), removedByBoardUserId: boardUserId, removalReason: reason },
  });
  if (res.count === 0) return false;

  await audit({
    actorType: "board",
    actorPatientId: boardUserId,
    action: AuditAction.INVITATION_REMOVED,
    resourceType: "Invitation",
    resourceId: inv.id,
    changes: { eventId, patientId: inv.patientId, reasonCode: reason },
  });
  return true;
}
