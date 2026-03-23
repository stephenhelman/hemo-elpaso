import {
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
    href: "/admin/sponsors",
    en: "Sponsors",
    es: "Patrocinadores",
    icon: Building2,
  },
  {
    href: "/admin/newsletter",
    en: "Newsletter",
    es: "Boletín",
    icon: Newspaper,
  },
  {
    href: "/admin/minutes",
    en: "Board Minutes",
    es: "Actas",
    icon: FileText,
  },
  {
    href: "/admin/archive",
    en: "Archive",
    es: "Archivo",
    icon: Archive,
  },
  {
    href: "/admin/reports",
    en: "Reports",
    es: "Reportes",
    icon: BarChart3,
  },
  {
    href: "/admin/attendance",
    en: "Attendance",
    es: "Asistencia",
    icon: CheckCircle,
  },
  {
    href: "/admin/assistance",
    en: "Financial Assistance",
    es: "Asistencia Financiera",
    icon: DollarSign,
  },
  {
    href: "/admin/users",
    en: "Users",
    es: "Usuarios",
    icon: Users,
  },
  {
    href: "/admin/verification",
    en: "Verification",
    es: "Verificación",
    icon: FileCheck,
  },
  {
    href: "/admin/settings",
    en: "Settings",
    es: "Configuración",
    icon: Settings,
  },
];
