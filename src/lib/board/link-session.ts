import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

/**
 * First-login linking for invited board members.
 *
 * If the Auth0 session has a VERIFIED email matching an invited Patient row that
 * is role board/admin AND has no Auth0 link yet (auth0Id IS NULL), attach the
 * session's `sub` to that row. Returns true if a row was linked.
 *
 * Patient rows (role "patient") are never linkable, even with a matching
 * verified email: the role filter is part of both the lookup and the update.
 * The update is conditional on auth0Id still being NULL, so two concurrent
 * logins can't both win.
 */
export async function linkPendingBoardMember(user: {
  sub: string;
  email?: string | null;
  email_verified?: boolean | null;
}): Promise<boolean> {
  if (!user.sub || !user.email || user.email_verified !== true) return false;
  const email = user.email.trim().toLowerCase();

  const pending = await prisma.patient.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      auth0Id: null,
      role: { in: ["board", "admin"] },
    },
    select: { id: true },
  });
  if (!pending) return false;

  const { count } = await prisma.patient.updateMany({
    where: {
      id: pending.id,
      auth0Id: null,
      role: { in: ["board", "admin"] },
    },
    data: { auth0Id: user.sub },
  });
  if (count !== 1) return false;

  await prisma.auditLog.create({
    data: {
      patientId: pending.id,
      action: AuditAction.BOARD_SESSION_LINKED,
      resourceType: "Patient",
      resourceId: pending.id,
      details: "Invited board member linked to Auth0 login by verified email",
    },
  });
  return true;
}
