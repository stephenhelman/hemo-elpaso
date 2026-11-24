import { getSession } from "@/lib/auth0";
import type { BoardRoleType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { emailDomain } from "@/lib/site";
import { HOUSEHOLD_EVIDENCE } from "@/lib/patients/query";
import { syncIdentity, type AuthUser } from "./link";
import { getRequireOrgAccount } from "./settings";
import { resolveMode, type Mode } from "./rules";
import type { Actor } from "@/lib/portal/permissions";

export interface ResolvedSession {
  mode: Mode;
  identityId: string | null;
  /** Who is acting on the family page: the primary, or one confirmed adult member of the household in `patient`. Null when not linked. */
  actor: Actor | null;
  patient: { id: string; email: string | null; role: string; preferredLanguage: string; activeRoles: BoardRoleType[] } | null;
  /** The linked person has household data (a family, or a board member whose record was linked/merged to theirs). */
  hasHousehold: boolean;
}

/** Pure-ish core, exported for tests: everything but the Auth0 cookie read. */
export async function resolveForUser(user: AuthUser): Promise<ResolvedSession> {
  const identity = await syncIdentity(user);
  if (!identity?.patientId) return { mode: "none", identityId: identity?.id ?? null, actor: null, patient: null, hasHousehold: false };

  const patient = await prisma.patient.findUnique({
    where: { id: identity.patientId },
    select: { id: true, email: true, role: true, preferredLanguage: true, boardRoles: { where: { active: true }, select: { role: true } } },
  });
  if (!patient) return { mode: "none", identityId: identity.id, actor: null, patient: null, hasHousehold: false };

  // A member sign-in: the household is `patient`, the actor is the adult. Re-checked on every request: the member must
  // still be a confirmed adult of THIS household. Always family mode (board access is only ever a board person's own
  // org identity), and the household record's board roles are not theirs.
  if (identity.householdMemberId) {
    const m = await prisma.householdMember.findUnique({ where: { id: identity.householdMemberId }, select: { id: true, patientId: true, status: true, ageGroup: true } });
    if (!m || m.patientId !== patient.id || m.status !== "confirmed" || m.ageGroup !== "18_plus") return { mode: "none", identityId: identity.id, actor: null, patient: null, hasHousehold: false };
    return {
      mode: "family", identityId: identity.id, hasHousehold: true, actor: { kind: "member", memberId: m.id },
      patient: { id: patient.id, email: patient.email, role: "patient", preferredLanguage: patient.preferredLanguage, activeRoles: [] },
    };
  }

  const mode = resolveMode({
    identity, patientRole: patient.role, activeBoardRoles: patient.boardRoles.length,
    requireOrgAccount: await getRequireOrgAccount(), domain: emailDomain(),
  });
  const hasHousehold = patient.role === "admin" ? false : (await prisma.patient.count({ where: { id: patient.id, ...HOUSEHOLD_EVIDENCE } })) > 0;
  return {
    mode, identityId: identity.id, hasHousehold, actor: { kind: "primary" },
    patient: { id: patient.id, email: patient.email, role: patient.role, preferredLanguage: patient.preferredLanguage, activeRoles: patient.boardRoles.map((r) => r.role) },
  };
}

/** The signed-in person for THIS request, or null when there is no Auth0 session. Never cached, never stored. */
export async function resolveSession(): Promise<ResolvedSession | null> {
  const session = await getSession();
  if (!session?.user?.sub) return null;
  return resolveForUser(session.user as AuthUser);
}
