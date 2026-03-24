import {
  LayoutDashboard,
  Calendar,
  User,
  DollarSign,
  Users,
  Heart,
} from "lucide-react";

export const portalSidebarTranslation = {
  en: {
    patientPortal: "Patient Portal",
    backToWebsite: "Back to Website",
    logout: "Logout",
    menu: "Menu",
    adminDashboard: "Admin Dashboard",
    adminBadge: "ADMIN",
  },
  es: {
    patientPortal: "Portal del Paciente",
    backToWebsite: "Volver al Sitio",
    logout: "Cerrar Sesión",
    menu: "Menú",
    adminDashboard: "Panel de Administración",
    adminBadge: "ADMIN",
  },
};

export const portalNavItemsTranslation = [
  {
    href: "/portal/dashboard",
    en: "Dashboard",
    es: "Panel",
    icon: LayoutDashboard,
  },
  {
    href: "/portal/events",
    en: "Events",
    es: "Eventos",
    icon: Calendar,
  },
  {
    href: "/portal/profile",
    en: "Profile",
    es: "Perfil",
    icon: User,
  },
  {
    href: "/portal/assistance",
    en: "Financial Assistance",
    es: "Asistencia Financiera",
    icon: DollarSign,
  },
  {
    href: "/portal/family",
    en: "My Family",
    es: "Mi Familia",
    icon: Users,
  },
  {
    href: "/portal/volunteer",
    en: "Volunteer",
    es: "Voluntariado",
    icon: Heart,
  },
];
