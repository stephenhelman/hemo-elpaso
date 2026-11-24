import {
  Hourglass,
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  BarChart3,
  CheckCircle,
  DollarSign,
  FileCheck,
  Newspaper,
  FileText,
  Archive,
  Building2,
  Shield,
  PenSquare,
} from "lucide-react";

export const adminSidebarTranslation = {
  en: {
    adminPortal: "Admin Portal",
    backToWebsite: "Back to Website",
    logout: "Logout",
    menu: "Admin Menu",
    adminBadge: "ADMIN",
    patientPortal: "Patient Portal",
  },
  es: {
    adminPortal: "Portal de Administración",
    backToWebsite: "Volver al Sitio",
    logout: "Cerrar Sesión",
    menu: "Menú Admin",
    adminBadge: "ADMIN",
    patientPortal: "Portal del Paciente",
  },
};

export const adminNavItemsTranslation = [
  {
    href: "/admin/dashboard",
    en: "Dashboard",
    es: "Panel",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/events",
    en: "Events",
    es: "Eventos",
    icon: Calendar,
  },
  {
    href: "/admin/attendance",
    en: "Attendance",
    es: "Asistencia",
    icon: CheckCircle,
  },
  {
    href: "/admin/patients",
    en: "Patients",
    es: "Pacientes",
    icon: Users,
  },
  {
    href: "/admin/inactive-households",
    en: "Inactive households",
    es: "Hogares inactivos",
    icon: Hourglass,
  },
  {
    href: "/admin/audit-logs",
    en: "Audit Log",
    es: "Registro de Auditoría",
    icon: Shield,
  },
  {
    href: "/admin/studio",
    en: "Site content",
    es: "Contenido del sitio",
    icon: PenSquare,
  },
  {
    href: "/admin/settings",
    en: "Settings",
    es: "Configuración",
    icon: Settings,
  },
];

/** Permission needed to see a nav item. No entry = always visible. */
export const ADMIN_NAV_PERMISSIONS: Record<string, string | string[]> = {
  "/admin/dashboard": "canViewAdminDashboard",
  "/admin/events": "canViewAdminDashboard",
  // Settings holds the admin pages (settings, toggles, permissions, routing, board) and the officers' email templates.
  "/admin/settings": ["canManageSettings", "canManageEmailTemplates", "canManageEmailRouting", "canAssignBoardRoles"],
  "/admin/attendance": "canViewEventStats",
  "/admin/patients": "canManageUsers",
  "/admin/inactive-households": "canManageUsers",
  "/admin/audit-logs": "canViewAuditLogs",
  "/admin/studio": "canEditSiteContent",
};

/** The one filter used by BOTH the desktop sidebar and the mobile drawer, so they can never drift apart. */
export function visibleAdminNavItems(can: (permission: string) => boolean) {
  return adminNavItemsTranslation.filter((item) => {
    const required = ADMIN_NAV_PERMISSIONS[item.href];
    if (!required) return true;
    return Array.isArray(required) ? required.some(can) : can(required);
  });
}
