export const eventTopicEnum = {
  EDUCATION: {
    en: "Education",
    es: "Educación",
  },
  SOCIAL: {
    en: "Social",
    es: "Social",
  },
  FUNDRAISING: {
    en: "Fundraising",
    es: "Recaudación de Fondos",
  },
  ADVOCACY: {
    en: "Advocacy",
    es: "Defensa",
  },
  YOUTH: { en: "Youth", es: "Juventud" },
  FAMILY_SUPPORT: { en: "Family Support", es: "Apoyo Familiar" },
  MEDICAL_UPDATE: { en: "Medical Update", es: "Actualización Medica" },
  FINANCIAL_ASSISTANCE: {
    en: "Financial Assistance",
    es: "Asistencia Financiera",
  },
};

export const eventStatusEnum = {
  draft: { en: "Draft", es: "Borrador" },
  published: { en: "Published", es: "Publicado" },
  cancelled: { en: "Cancelled", es: "Cancelado" },
  completed: { en: "Completed", es: "Completado" },
};

export const dietaryRestrictionEnum = {
  NONE: {
    en: "none",
    es: "nada",
  },
  VEGETARIAN: { en: "vegetarian", es: "vegetariano" },
  VEGAN: { en: "vegan", es: "vegano" },
  GLUTEN_FREE: { en: "gluten free", es: "sin gluten" },
  DAIRY_FREE: { en: "dairy free", es: "sin lácteos" },
  NUT_ALLERGY: { en: "nut allergy", es: "alergia a las nueces" },
  HALAL: { en: "halal", es: "halal" },
  KOSHER: { en: "kosher", es: "kosher" },
  OTHER: { en: "other", es: "otro" },
};

export const assistanceTypeEnum = {
  EVENT_FEES: { en: "event fees", es: "tarifas de eventos" },
  TRANSPORTATION: { en: "transportation", es: "transporte" },
  MEDICATION: { en: "medication", es: "medicamento" },
  MEDICAL_EQUIPMENT: { en: "medical equipment", es: "equipo medico" },
  EMERGENCY_SUPPORT: { en: "emergency support", es: "apoyo de emergencia" },
  OTHER: { en: "other", es: "otro" },
};

export const assistanceStatusEnum = {
  DRAFT: { en: "draft", es: "borrador" },
  SUBMITTED: { en: "submitted", es: "enviado" },
  UNDER_REVIEW: { en: "under review", es: "bajo revisión" },
  APPROVED: { en: "approved", es: "aprobado" },
  DENIED: { en: "denied", es: "denegado" },
  DISBURSED: { en: "disbursed", es: "desembolsado" },
  CLOSED: { en: "closed", es: "cerrado" },
};

export const disbursementStatusEnum = {
  PENDING: { en: "pending", es: "pendiente" },
  ISSUED: { en: "issued", es: "emitido" },
  CASHED: { en: "cashed", es: "cobrado" },
  VOID: { en: "void", es: "vacío" },
};

export const PaymentMethodEnum = {
  CHECK: { en: "check", es: "el cheque" },
  CASH: { en: "cash", es: "dinero" },
  REIMBURSEMENT: { en: "reimbursement", es: "reembolso" },
};

export const auditActionEnum = {
  // Patient & Profile
  REGISTRATION_COMPLETED: { en: "Joined HOEP", es: "Se unió a HOEP" },
  PROFILE_UPDATED: { en: "Profile Updated", es: "Perfil Actualizado" },
  PATIENT_VIEWED: { en: "Patient Viewed", es: "Paciente Consultado" },

  // RSVP
  RSVP_CREATED: { en: "RSVP Created", es: "RSVP Creado" },
  RSVP_CANCELLED: { en: "RSVP Cancelled", es: "RSVP Cancelado" },

  // Events
  EVENT_CREATED: { en: "Event Created", es: "Evento Creado" },
  EVENT_UPDATED: { en: "Event Updated", es: "Evento Actualizado" },
  EVENT_DELETED: { en: "Event Deleted", es: "Evento Eliminado" },
  EVENT_PHOTOS_UPLOADED: { en: "Photos Uploaded", es: "Fotos Subidas" },
  EVENT_PHOTO_DELETED: { en: "Photo Deleted", es: "Foto Eliminada" },
  EVENT_FLYERS_UPDATED: { en: "Flyer Updated", es: "Volante Actualizado" },

  // Announcements & Itinerary
  ANNOUNCEMENT_CREATED: { en: "Announcement Posted", es: "Anuncio Publicado" },
  ANNOUNCEMENT_DELETED: { en: "Announcement Deleted", es: "Anuncio Eliminado" },
  ITINERARY_ITEM_CREATED: {
    en: "Itinerary Item Added",
    es: "Elemento de Itinerario Añadido",
  },
  ITINERARY_ITEM_UPDATED: {
    en: "Itinerary Item Updated",
    es: "Elemento de Itinerario Actualizado",
  },
  ITINERARY_ITEM_DELETED: {
    en: "Itinerary Item Deleted",
    es: "Elemento de Itinerario Eliminado",
  },

  // Financial Assistance
  ASSISTANCE_APPLICATION_CREATED: {
    en: "Application Submitted",
    es: "Solicitud Enviada",
  },
  ASSISTANCE_APPLICATION_UPDATED: {
    en: "Application Updated",
    es: "Solicitud Actualizada",
  },
  ASSISTANCE_APPLICATION_VIEWED: {
    en: "Application Viewed",
    es: "Solicitud Consultada",
  },
  ASSISTANCE_APPLICATION_APPROVED: {
    en: "Application Approved",
    es: "Solicitud Aprobada",
  },
  ASSISTANCE_APPLICATION_DENIED: {
    en: "Application Denied",
    es: "Solicitud Denegada",
  },
  ASSISTANCE_DISBURSEMENT_CREATED: {
    en: "Disbursement Created",
    es: "Desembolso Creado",
  },
  ASSISTANCE_DOCUMENT_UPLOADED: {
    en: "Document Uploaded",
    es: "Documento Subido",
  },
  ASSISTANCE_DOCUMENT_DELETED: {
    en: "Document Deleted",
    es: "Documento Eliminado",
  },
  DISBURSEMENT_PROOF_UPLOADED: {
    en: "Payment Proof Uploaded",
    es: "Comprobante de Pago Subido",
  },

  // Check-in
  CHECKIN_CREATED: { en: "Checked In", es: "Registro de Asistencia" },
  MANUAL_CHECKIN: { en: "Manual Check-In", es: "Registro Manual" },
  CHECKIN_REMOVED: { en: "Check-In Removed", es: "Registro Eliminado" },

  // Family Members
  FAMILY_MEMBER_ADDED: { en: "Family Member Added", es: "Familiar Añadido" },
  FAMILY_MEMBER_UPDATED: {
    en: "Family Member Updated",
    es: "Familiar Actualizado",
  },
  FAMILY_MEMBER_DELETED: {
    en: "Family Member Removed",
    es: "Familiar Eliminado",
  },

  // Diagnosis Verification
  DIAGNOSIS_APPROVED: {
    en: "Diagnosis Verified",
    es: "Diagnóstico Verificado",
  },
  DIAGNOSIS_REJECTED: { en: "Diagnosis Rejected", es: "Diagnóstico Rechazado" },
  DIAGNOSIS_APPROVED_FAMILY: {
    en: "Family Diagnosis Verified",
    es: "Diagnóstico Familiar Verificado",
  },
  DIAGNOSIS_REJECTED_FAMILY: {
    en: "Family Diagnosis Rejected",
    es: "Diagnóstico Familiar Rechazado",
  },

  // User Management
  USER_UPDATED: { en: "User Updated", es: "Usuario Actualizado" },
  USER_DELETED: { en: "User Deleted", es: "Usuario Eliminado" },
  USERS_EXPORTED: { en: "Users Exported", es: "Usuarios Exportados" },

  // Polls & Questions
  POLL_CREATED: { en: "Poll Created", es: "Encuesta Creada" },
  POLL_DELETED: { en: "Poll Deleted", es: "Encuesta Eliminada" },
  POLL_APPROVED: { en: "Poll Approved", es: "Encuesta Aprobada" },
  POLL_ACTIVATED: { en: "Poll Activated", es: "Encuesta Activada" },
  POLL_DEACTIVATED: { en: "Poll Deactivated", es: "Encuesta Desactivada" },
  POLL_INVITE_SENT: {
    en: "Poll Invite Sent",
    es: "Invitación de Encuesta Enviada",
  },
  QUESTION_DELETED: { en: "Question Deleted", es: "Pregunta Eliminada" },
  QUESTION_ANSWERED: { en: "Question Answered", es: "Pregunta Respondida" },

  // Settings
  EMAIL_TEMPLATE_UPDATED: {
    en: "Email Template Updated",
    es: "Plantilla de Correo Actualizada",
  },
  TEST_EMAIL_SENT: { en: "Test Email Sent", es: "Correo de Prueba Enviado" },

  // Sponsorship
  SPONSOR_INVITE_SENT: {
    en: "Sponsor Invite Sent",
    es: "Invitación de Patrocinador Enviada",
  },
};
