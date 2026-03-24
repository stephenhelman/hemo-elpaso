import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { BoardRoleType } from "@prisma/client";

// -------------------------------------------------------
// Permission types
// -------------------------------------------------------
export type Permission =
  | "canViewAdminDashboard"
  | "canManageEvents"
  | "canViewEventStats"
  | "canSelectForNewsletter"
  | "canApproveNewsletter"
  | "canManageMinutes"
  | "canMarkMinutesPublic"
  | "canViewPHI"
  | "canManageUsers"
  | "canAssignBoardRoles"
  | "canViewFinancials"
  | "canManageFinancials"
  | "canApproveAssistance"
  | "canSendBulkEmails"
  | "canSendIndividualEmails"
  | "canManageEmailTemplates"
  | "canViewAuditLogs"
  | "canManageVolunteers";

// -------------------------------------------------------
// Role → Permission mapping
// -------------------------------------------------------
export const ROLE_PERMISSIONS: Record<BoardRoleType, Permission[]> = {
  PRESIDENT: [
    "canViewAdminDashboard",
    "canManageEvents",
    "canViewEventStats",
    "canSelectForNewsletter",
    "canApproveNewsletter",
    "canViewPHI",
    "canManageUsers",
    "canAssignBoardRoles",
    "canViewFinancials",
    "canApproveAssistance",
    "canSendBulkEmails",
    "canSendIndividualEmails",
    "canManageEmailTemplates",
    "canViewAuditLogs",
    "canManageVolunteers",
  ],
  VICE_PRESIDENT: [
    "canViewAdminDashboard",
    "canManageEvents",
    "canViewEventStats",
    "canSelectForNewsletter",
    "canViewPHI",
    "canManageUsers",
    "canAssignBoardRoles",
    "canViewFinancials",
    "canApproveAssistance",
    "canSendBulkEmails",
    "canSendIndividualEmails",
    "canManageEmailTemplates",
    "canViewAuditLogs",
    "canManageVolunteers",
  ],
  SECRETARY: [
    "canViewAdminDashboard",
    "canViewEventStats",
    "canManageMinutes",
    "canMarkMinutesPublic",
    "canViewPHI",
    "canSendIndividualEmails",
    "canManageVolunteers",
  ],
  TREASURER: [
    "canViewAdminDashboard",
    "canViewEventStats",
    "canViewPHI",
    "canViewFinancials",
    "canManageFinancials",
    "canApproveAssistance",
    "canViewAuditLogs",
  ],
  // Community at Large — to be populated when roles are staffed
  EVENTS_COORDINATOR: [
    "canViewAdminDashboard",
    "canViewEventStats",
    "canSelectForNewsletter",
    "canManageVolunteers",
  ],
  SPONSOR_LIAISON: ["canViewAdminDashboard", "canViewEventStats"],
  COMMUNICATIONS_LEAD: [
    "canViewAdminDashboard",
    "canSendBulkEmails",
    "canSendIndividualEmails",
  ],
  YOUTH_COORDINATOR: ["canViewAdminDashboard"],
  VOLUNTEER_COORDINATOR: ["canViewAdminDashboard", "canManageVolunteers"],
  FUNDRAISING_COORDINATOR: ["canViewAdminDashboard"],
  BOARD_MEMBER_AT_LARGE: ["canViewAdminDashboard"],
};

// -------------------------------------------------------
// Aggregate permissions across all active roles
// -------------------------------------------------------
export function getPermissions(roles: BoardRoleType[]): Set<Permission> {
  const permissions = new Set<Permission>();
  for (const role of roles) {
    for (const perm of ROLE_PERMISSIONS[role] ?? []) {
      permissions.add(perm);
    }
  }
  return permissions;
}

export function hasPermission(
  roles: BoardRoleType[],
  permission: Permission,
): boolean {
  return getPermissions(roles).has(permission);
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
  // Convenience — true for role === "admin" (super admin bypasses all checks)
  isSuperAdmin: boolean;
  can: (permission: Permission) => boolean;
}

export async function getAdminWithPermissions(): Promise<AdminWithPermissions | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: {
      boardRoles: {
        where: { active: true },
        select: { role: true, active: true },
      },
    },
  });

  if (!patient || !["board", "admin"].includes(patient.role)) return null;

  const isSuperAdmin = patient.role === "admin";
  const activeRoles = patient.boardRoles.map((r) => r.role);
  const permissions = isSuperAdmin
    ? // Super admin gets every permission
      new Set<Permission>(
        Object.values(ROLE_PERMISSIONS).flat() as Permission[],
      )
    : getPermissions(activeRoles);

  return {
    id: patient.id,
    email: patient.email,
    role: patient.role,
    boardRoles: patient.boardRoles,
    permissions,
    isSuperAdmin,
    can: (permission: Permission) =>
      isSuperAdmin || permissions.has(permission),
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
