import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { BoardRoleType } from "@prisma/client";
import { linkPendingBoardMember } from "@/lib/board/link-session";
import { DEFAULT_MATRIX, permissionDef, type Matrix, type Permission } from "@/lib/permission-catalog";
import { getMatrix } from "@/lib/permission-matrix";

// -------------------------------------------------------
// Permission catalog, defaults and locked rules
// -------------------------------------------------------
// The catalog and the code defaults live in ./permission-catalog (pure). The role x permission grid is stored in
// role_permissions and read through ./permission-matrix (tag-cached; code defaults are the fallback). The locked
// rules (./permission-rules) are applied on every read, so a stored row can never breach them.
export type { Permission } from "@/lib/permission-catalog";
export { ROLE_PERMISSIONS } from "@/lib/permission-catalog";

// -------------------------------------------------------
// Aggregate permissions across a set of roles
// -------------------------------------------------------
export function getPermissions(roles: BoardRoleType[], matrix: Matrix = DEFAULT_MATRIX): Set<Permission> {
  const permissions = new Set<Permission>();
  for (const role of roles) {
    for (const perm of matrix[role] ?? []) permissions.add(perm);
  }
  return permissions;
}

export function hasPermission(roles: BoardRoleType[], permission: Permission, matrix: Matrix = DEFAULT_MATRIX): boolean {
  return getPermissions(roles, matrix).has(permission);
}

/**
 * Permissions for an account. The settings-only `admin` account resolves from the ADMIN row ONLY (board roles are
 * ignored, so an admin that somehow also holds an officer role still gets no data access), and data permissions are
 * stripped again here as a second line of defence.
 */
export function resolvePermissions(patientRole: string, activeRoles: BoardRoleType[], matrix: Matrix): Set<Permission> {
  if (patientRole === "admin") {
    return new Set(matrix.ADMIN.filter((p) => permissionDef(p).category === "settings"));
  }
  return getPermissions(activeRoles, matrix);
}

// -------------------------------------------------------
// Admin with permissions — single DB call
// Returns null if not authenticated or not a board/admin user
// -------------------------------------------------------
export interface AdminWithPermissions {
  id: string;
  email: string;
  role: string;
  boardRoles: { role: BoardRoleType; active: boolean }[];
  permissions: Set<Permission>;
  // true for the settings-only organizational account (role "admin"). It is NOT a super admin: it passes no check
  // it does not hold.
  isSettingsAdmin: boolean;
  can: (permission: Permission) => boolean;
}

export async function getAdminWithPermissions(): Promise<AdminWithPermissions | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const findPatient = () =>
    prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
      include: {
        boardRoles: {
          where: { active: true },
          select: { role: true, active: true },
        },
      },
    });

  let patient = await findPatient();
  // First login of an invited board member: link by verified email.
  if (!patient && (await linkPendingBoardMember(session.user as any))) {
    patient = await findPatient();
  }

  if (!patient || !["board", "admin"].includes(patient.role)) return null;

  const isSettingsAdmin = patient.role === "admin";
  const activeRoles = patient.boardRoles.map((r) => r.role);
  const permissions = resolvePermissions(patient.role, activeRoles, await getMatrix());

  return {
    id: patient.id,
    email: patient.email ?? "",
    role: patient.role,
    boardRoles: patient.boardRoles,
    permissions,
    isSettingsAdmin,
    can: (permission: Permission) => permissions.has(permission),
  };
}

// -------------------------------------------------------
// requirePermission — drop-in for API routes
// Returns { admin } on success or { error: NextResponse } on failure
// -------------------------------------------------------
export async function requirePermission(
  permission: Permission,
): Promise<
  | { admin: AdminWithPermissions; error: null }
  | { admin: null; error: NextResponse }
> {
  const admin = await getAdminWithPermissions();

  if (!admin) {
    return {
      admin: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!admin.can(permission)) {
    return {
      admin: null,
      error: NextResponse.json(
        { error: `Forbidden: requires ${permission}` },
        { status: 403 },
      ),
    };
  }

  return { admin, error: null };
}

// -------------------------------------------------------
// requireAnyPermission — for routes that accept multiple permissions
// -------------------------------------------------------
export async function requireAnyPermission(
  permissions: Permission[],
): Promise<
  | { admin: AdminWithPermissions; error: null }
  | { admin: null; error: NextResponse }
> {
  const admin = await getAdminWithPermissions();

  if (!admin) {
    return {
      admin: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const hasAny = permissions.some((p) => admin.can(p));

  if (!hasAny) {
    return {
      admin: null,
      error: NextResponse.json(
        {
          error: `Forbidden: requires one of [${permissions.join(", ")}]`,
        },
        { status: 403 },
      ),
    };
  }

  return { admin, error: null };
}
