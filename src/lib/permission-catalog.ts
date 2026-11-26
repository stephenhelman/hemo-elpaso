/**
 * The permission catalog and the role list. PURE: no DB, no Next, so it is unit-testable and importable anywhere.
 *
 * category  "settings": what the settings-only `admin` account may hold. "data": everything else; `admin` can
 *           never hold one (enforced in ./permission-rules, not in the matrix).
 * phi       the permission exposes diagnoses or family contact details. The published Privacy Policy says
 *           health information is visible only to the President and Vice President, so these are capped to
 *           those two roles (changing that requires a privacy policy change).
 */
export const PERMISSION_CATALOG = [
  { key: "canViewAdminDashboard", category: "data", phi: false, label: { en: "View admin dashboard", es: "Ver el panel de administración" } },
  { key: "canManageEvents", category: "data", phi: true, label: { en: "Manage events (invitations, attendees, check-in)", es: "Administrar eventos (invitaciones, asistentes, registro)" } },
  { key: "canViewEventStats", category: "data", phi: false, label: { en: "View event statistics", es: "Ver estadísticas de eventos" } },
  { key: "canSelectForNewsletter", category: "data", phi: false, label: { en: "Select events for the newsletter", es: "Elegir eventos para el boletín" } },
  { key: "canApproveNewsletter", category: "data", phi: false, label: { en: "Approve the newsletter", es: "Aprobar el boletín" } },
  { key: "canManageMinutes", category: "data", phi: false, label: { en: "Manage meeting minutes", es: "Administrar las actas" } },
  { key: "canMarkMinutesPublic", category: "data", phi: false, label: { en: "Publish meeting minutes", es: "Publicar las actas" } },
  { key: "canViewPHI", category: "data", phi: true, label: { en: "View stated diagnoses (health information)", es: "Ver diagnósticos declarados (información de salud)" } },
  { key: "canReviewVerification", category: "data", phi: true, label: { en: "Review diagnosis verification", es: "Revisar la verificación de diagnóstico" } },
  { key: "canManageUsers", category: "data", phi: true, label: { en: "Manage patients and households", es: "Administrar pacientes y hogares" } },
  { key: "canReviewRegistrations", category: "data", phi: false, label: { en: "Review registrations (contact details and household members, never health information)", es: "Revisar registros (datos de contacto y personas del hogar, nunca información de salud)" } },
  { key: "canViewFinancials", category: "data", phi: false, label: { en: "View financials", es: "Ver finanzas" } },
  { key: "canManageFinancials", category: "data", phi: false, label: { en: "Manage financials", es: "Administrar finanzas" } },
  { key: "canApproveAssistance", category: "data", phi: true, label: { en: "Approve financial assistance", es: "Aprobar ayuda financiera" } },
  { key: "canSendBulkEmails", category: "data", phi: false, label: { en: "Send bulk emails", es: "Enviar correos masivos" } },
  { key: "canSendIndividualEmails", category: "data", phi: false, label: { en: "Send individual emails", es: "Enviar correos individuales" } },
  { key: "canManageEmailTemplates", category: "data", phi: false, label: { en: "Edit email templates", es: "Editar plantillas de correo" } },
  { key: "canViewAuditLogs", category: "data", phi: true, label: { en: "View the audit log", es: "Ver el registro de auditoría" } },
  { key: "canManageVolunteers", category: "data", phi: false, label: { en: "Manage volunteers", es: "Administrar voluntarios" } },
  { key: "canManageSettings", category: "settings", phi: false, label: { en: "Manage site settings", es: "Administrar la configuración del sitio" } },
  { key: "canManageFeatureToggles", category: "settings", phi: false, label: { en: "Manage feature toggles", es: "Administrar funciones activables" } },
  { key: "canManagePermissions", category: "settings", phi: false, label: { en: "Manage the permissions matrix", es: "Administrar la matriz de permisos" } },
  { key: "canManageEmailRouting", category: "settings", phi: false, label: { en: "Manage email routing", es: "Administrar el enrutamiento de correo" } },
  { key: "canAssignBoardRoles", category: "settings", phi: false, label: { en: "Assign board roles", es: "Asignar cargos de la junta" } },
  { key: "canSwapPhoneDuty", category: "data", phi: false, label: { en: "Change who is on phone duty", es: "Cambiar quién atiende el teléfono" } },
  { key: "canManagePhoneRouting", category: "settings", phi: false, label: { en: "Manage phone numbers and call routing", es: "Administrar números y desvío de llamadas" } },
  { key: "canEditSiteContent", category: "settings", phi: false, label: { en: "Edit site content (Sanity)", es: "Editar el contenido del sitio (Sanity)" } },
] as const;

export type Permission = (typeof PERMISSION_CATALOG)[number]["key"];
export type PermissionDef = {
  key: Permission;
  category: "data" | "settings";
  phi: boolean;
  label: { en: string; es: string };
};

export const PERMISSION_KEYS: Permission[] = PERMISSION_CATALOG.map((p) => p.key);
export const isPermission = (k: unknown): k is Permission => typeof k === "string" && (PERMISSION_KEYS as string[]).includes(k);
export const permissionDef = (k: Permission): PermissionDef => PERMISSION_CATALOG.find((p) => p.key === k)!;

/** Board roles (BoardRoleType) plus the settings-only admin account. */
export const BOARD_ROLE_KEYS = [
  "PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER", "EVENTS_COORDINATOR", "SPONSOR_LIAISON",
  "COMMUNICATIONS_LEAD", "YOUTH_COORDINATOR", "VOLUNTEER_COORDINATOR", "FUNDRAISING_COORDINATOR", "BOARD_MEMBER_AT_LARGE",
] as const;
export type BoardRoleKey = (typeof BOARD_ROLE_KEYS)[number];
export const ROLE_KEYS = [...BOARD_ROLE_KEYS, "ADMIN"] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];
export const isRoleKey = (k: unknown): k is RoleKey => typeof k === "string" && (ROLE_KEYS as readonly string[]).includes(k);

/** Only these two roles may hold a phi permission (what the published policy says). */
export const PHI_ROLES: readonly RoleKey[] = ["PRESIDENT", "VICE_PRESIDENT"];

/** Settings permissions held by `admin` only. canEditSiteContent is the one settings permission officers keep. */
export const ADMIN_ONLY_PERMISSIONS: readonly Permission[] = [
  "canManageSettings", "canManageFeatureToggles", "canManagePermissions", "canManageEmailRouting", "canAssignBoardRoles",
  "canManagePhoneRouting",
];

/** Held by the President and Vice President, and by nobody else; not editable in the matrix. */
export const OFFICERS_ONLY_PERMISSIONS: readonly Permission[] = ["canSwapPhoneDuty"];

/**
 * Code defaults. The role_permissions table is seeded from these, and they are the fallback whenever the table is
 * empty or unreadable. Both President and VP hold every phi permission.
 */
export const ROLE_PERMISSIONS: Record<BoardRoleKey, Permission[]> = {
  PRESIDENT: [
    "canReviewVerification", "canEditSiteContent", "canViewAdminDashboard", "canManageEvents", "canViewEventStats",
    "canSelectForNewsletter", "canApproveNewsletter", "canViewPHI", "canManageUsers", "canViewFinancials",
    "canApproveAssistance", "canSendBulkEmails", "canSendIndividualEmails", "canManageEmailTemplates",
    "canViewAuditLogs", "canManageVolunteers", "canSwapPhoneDuty",
  ],
  VICE_PRESIDENT: [
    "canReviewVerification", "canEditSiteContent", "canViewAdminDashboard", "canManageEvents", "canViewEventStats",
    "canSelectForNewsletter", "canViewPHI", "canManageUsers", "canViewFinancials", "canApproveAssistance",
    "canSendBulkEmails", "canSendIndividualEmails", "canManageEmailTemplates", "canViewAuditLogs", "canManageVolunteers",
    "canSwapPhoneDuty",
  ],
  SECRETARY: [
    "canEditSiteContent", "canViewAdminDashboard", "canViewEventStats", "canManageMinutes", "canMarkMinutesPublic",
    "canSendIndividualEmails", "canManageVolunteers", "canReviewRegistrations",
  ],
  TREASURER: [
    "canEditSiteContent", "canViewAdminDashboard", "canViewEventStats", "canViewFinancials", "canManageFinancials",
    "canReviewRegistrations",
  ],
  // Community at Large: populate when the roles are staffed.
  EVENTS_COORDINATOR: ["canViewAdminDashboard", "canViewEventStats", "canSelectForNewsletter", "canManageVolunteers"],
  SPONSOR_LIAISON: ["canViewAdminDashboard", "canViewEventStats"],
  COMMUNICATIONS_LEAD: ["canViewAdminDashboard", "canSendBulkEmails", "canSendIndividualEmails"],
  YOUTH_COORDINATOR: ["canViewAdminDashboard"],
  VOLUNTEER_COORDINATOR: ["canViewAdminDashboard", "canManageVolunteers"],
  FUNDRAISING_COORDINATOR: ["canViewAdminDashboard"],
  BOARD_MEMBER_AT_LARGE: ["canViewAdminDashboard"],
};

/** The settings-only admin account. Never a data permission. */
export const ADMIN_PERMISSIONS: Permission[] = [
  "canManageSettings", "canManageFeatureToggles", "canManagePermissions", "canManageEmailRouting", "canAssignBoardRoles",
  "canEditSiteContent", "canManagePhoneRouting",
];

export type Matrix = Record<RoleKey, Permission[]>;

const inCatalogOrder = (list: Permission[]) => PERMISSION_KEYS.filter((p) => list.includes(p));
/** Canonical order (catalog order) so comparisons and round-trips are stable. */
export const DEFAULT_MATRIX: Matrix = Object.fromEntries(
  Object.entries({ ...ROLE_PERMISSIONS, ADMIN: ADMIN_PERMISSIONS }).map(([r, l]) => [r, inCatalogOrder(l)]),
) as Matrix;
