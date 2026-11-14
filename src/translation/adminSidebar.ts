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
