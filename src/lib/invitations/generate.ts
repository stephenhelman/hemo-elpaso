import { prisma } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/tokens";
import { matchPatientsForEvent } from "./match";

/**
 * Create PENDING invitations for new matches. Idempotent and additive:
 * existing rows (pending, sent, answered, or manually kept) are never touched,
 * so re-running after edits adds only new matches and can never cause a re-send.
 * The token stored here is a throwaway: the real token is minted at send time
 * (raw tokens exist only in email links).
 */
export async function generateInvitations(eventId: string): Promise<number> {
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

  const res = await prisma.invitation.createMany({
    data: fresh.map((p) => ({
      eventId,
      patientId: p.id,
      tokenHash: hashToken(generateToken()),
      status: "pending",
    })),
    skipDuplicates: true,
  });
  return res.count;
}
