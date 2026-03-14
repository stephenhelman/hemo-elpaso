import { BoardRoleType } from "@prisma/client";
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
  | "canViewAuditLogs";
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
  ],
  SECRETARY: [
    "canViewAdminDashboard",
    "canViewEventStats",
    "canManageMinutes",
    "canMarkMinutesPublic",
    "canViewPHI",
    "canSendIndividualEmails",
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

  EVENTS_COORDINATOR: [],
  SPONSOR_LIAISON: [],
  COMMUNICATIONS_LEAD: [],
  YOUTH_COORDINATOR: [],
  VOLUNTEER_COORDINATOR: [],
  FUNDRAISING_COORDINATOR: [],
  BOARD_MEMBER_AT_LARGE: [],
};

export function getPermissions(roles: BoardRoleType[]): Set<Permission> {
  const permissions = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role]) {
      permissions.add(permission);
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
