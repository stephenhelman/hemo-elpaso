import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

/** Prefix for Patient.auth0Id on rows created by "Invite board member". */
export const PENDING_AUTH0_PREFIX = "pending:";

export function pendingAuth0Id() {
  return `${PENDING_AUTH0_PREFIX}${crypto.randomUUID()}`;
}

/**
 * First-login linking for invited board members.
 *
 * If the Auth0 session has a VERIFIED email matching an invited Patient row
 * (role board/admin, auth0Id still "pending:…"), attach the session's `sub`
 * to that row. Returns true if a row was linked.
 *
 * Safe against takeover: requires email_verified, requires the row to still be
 * unlinked, and the update is conditional on that so two logins can't both win.
 */
export async function linkPendingBoardMember(user: {
  sub: string;
  email?: string | null;
  email_verified?: boolean | null;
}): Promise<boolean> {
  if (!user.sub || !user.email || user.email_verified !== true) return false;

  const pending = await prisma.patient.findFirst({
    where: {
      email: { equals: user.email.trim(), mode: "insensitive" },
      auth0Id: { startsWith: PENDING_AUTH0_PREFIX },
      role: { in: ["board", "admin"] },
    },
    select: { id: true },
  });
  if (!pending) return false;

  const { count } = await prisma.patient.updateMany({
    where: { id: pending.id, auth0Id: { startsWith: PENDING_AUTH0_PREFIX } },
    data: { auth0Id: user.sub },
  });
  if (count !== 1) return false;

  await prisma.auditLog.create({
    data: {
      patientId: pending.id,
      action: AuditAction.BOARD_ROLE_ASSIGNED,
      resourceType: "Patient",
      resourceId: pending.id,
      details: "Invited board member linked to Auth0 login by verified email",
    },
  });
  return true;
}
