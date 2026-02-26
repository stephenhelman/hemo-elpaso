export const diagnosisLetterTranslation = (daysRemaining: number) => {
  return {
    en: {
      pending: {
        title: "Diagnosis Letter Pending Verification",
        description:
          "Your diagnosis letter has been uploaded and is awaiting admin review.",
        action: "Pending Verification",
      },
      upload: {
        title: `Upload Diagnosis Letter - ${daysRemaining} Days Remaining`,
        description:
          "Please upload your diagnosis letter to maintain access to financial assistance and event RSVPs.",
        action: "Upload Now",
      },
      expired: {
        title: "Diagnosis Letter Required",
        description:
          "Your grace period has expired. Please upload your diagnosis letter immediately to regain access.",
        action: "Upload Now",
      },
    },
    es: {
      pending: {
        title: "Carta de Diagnóstico Pendiente de Verificación",
        description:
          "Su carta de diagnóstico ha sido cargada y está esperando revisión del administrador.",
        action: "Pendiente de Verificación",
      },
      upload: {
        title: `Cargar Carta de Diagnóstico - ${daysRemaining} Días Restantes`,
        description:
          "Por favor cargue su carta de diagnóstico para mantener acceso a asistencia financiera y eventos.",
        action: "Cargar Ahora",
      },
      expired: {
        title: "Carta de Diagnóstico Requerida",
        description:
          "Su período de gracia ha expirado. Por favor cargue su carta de diagnóstico inmediatamente.",
        action: "Cargar Ahora",
      },
    },
  };
};

export const portalDashboardTranslation = {
  en: {
    welcome: "Welcome back,",
    header:
      "Manage your events, profile, and stay connected with the HOEP community.",
    recommendedTitle: "Recommended For You",
    recommendedSubtitle: "Based on your preferences and family profile",
    viewEventsCTA: "View All Events",
    yourUpcoming: "Your Upcoming Events",
    emptyUpcoming:
      "No upcoming RSVPs yet. Check out our recommendations above!",
    browseEvents: "Browse Events",
    quickActions: "Quick Actions",
    quickOneTitle: "Browse Events",
    quickOneSub: "Find upcoming activities",
    quickTwoTitle: "Edit Profile",
    quickTwoSub: "Update your information",
    quickThreeTitle: "Resources",
    quickThreeSub: "Educational materials",
    recentActivity: "Recent Activity",
    noRecent: "No recent activity",
    notificationCTA: "Stay Updated",
    notificationSub:
      "Get notifications about upcoming events, RSVP reminders, and community updates.",
    emailEnabled: "✓ Email notifications enabled",
    emailDisabled: "○ Email notifications disabled",
    upcomingRsvps: "Upcoming RSVPs",
    eventsAttended: "Events Attended",
    profileStatus: "Profile Status",
    profileComplete: "Complete",
    profileIncomplete: "Incomplete",
  },
  es: {
    welcome: "Bienvenido de nuevo,",
    header:
      "Administra tus eventos, tu perfil y mantente conectado con la comunidad HOEP.",
    recommendedTitle: "Recomendado Para Ti",
    recommendedSubtitle: "Basado en tus preferencias y perfil familiar",
    viewEventsCTA: "Ver todos los eventos",
    yourUpcoming: "Tus próximos eventos",
    emptyUpcoming:
      "Aún no hay confirmaciones de asistencia. ¡Consulta nuestras recomendaciones arriba!",
    browseEvents: "Explorar eventos",
    quickActions: "Acciones rápidas",
    quickOneTitle: "Explorar eventos",
    quickOneSub: "Encuentra las próximas actividades",
    quickTwoTitle: "Editar perfil",
    quickTwoSub: "Actualiza tu información",
    quickThreeTitle: "Recursos",
    quickThreeSub: "Materiales educativos",
    recentActivity: "Actividad Reciente",
    noRecent: "Sin actividad reciente",
    notificationCTA: "Manténgase Actualizado",
    notificationSub:
      "Reciba notificaciones sobre próximos eventos, recordatorios de RSVP y actualizaciones de la comunidad.",
    emailEnabled: "✓ Notificaciones por correo habilitadas",
    emailDisabled: "○ Notificaciones por correo deshabilitadas",
    upcomingRsvps: "Próximos RSVP",
    eventsAttended: "Eventos Asistidos",
    profileStatus: "Estado del Perfil",
    profileComplete: "Completo",
    profileIncomplete: "Incompleto",
  },
};

export const activityItemTranslation = {
  en: {
    joined: "Joined HOEP",
    rsvpCreated: "RSVP Created",
    rsvpCancelled: "RSVP Cancelled",
    profileUpdated: "Profile Updated",
    justNow: "just now",
    minutesAgo: (n: number) => `${n}m ago`,
    hoursAgo: (n: number) => `${n}h ago`,
    daysAgo: (n: number) => `${n}d ago`,
  },
  es: {
    joined: "Se unió a HOEP",
    rsvpCreated: "RSVP Creado",
    rsvpCancelled: "RSVP Cancelado",
    profileUpdated: "Perfil Actualizado",
    justNow: "ahora mismo",
    minutesAgo: (n: number) => `hace ${n}m`,
    hoursAgo: (n: number) => `hace ${n}h`,
    daysAgo: (n: number) => `hace ${n}d`,
  },
};

export const liveEventBannerTranslation = {
  en: {
    liveNow: "Live Now",
    joinLive: "Join Live Event",
  },
  es: {
    liveNow: "En Vivo",
    joinLive: "Unirse al Evento en Vivo",
  },
};
