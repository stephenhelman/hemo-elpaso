export const adminEditTemplateTranslation = {
  en: {
    templateInfo: "Template Information",
    templateType: "Template Type",
    status: "Status",
    enabled: "Enabled",
    disabled: "Disabled",
    subjectLineSection: "Email Subject Line",
    subjectLabel: "Subject *",
    subjectPlaceholder: "Enter subject line...",
    subjectHint: "Use variables like",
    subjectHintSuffix: "to personalize emails",
    previewLabel: "PREVIEW",
    previewPlaceholder: "Subject line will appear here...",
    availableVariables: "Available Variables (click to insert)",
    bodyNoteTitle: "Email Body Template",
    bodyNoteText:
      "The email body design is managed through React Email components in the codebase. Only the subject line can be customized here. To modify the email body layout, contact your developer.",
    cancel: "Cancel",
    preview: "Preview",
    saving: "Saving...",
    saveChanges: "Save Changes",
    errorEmpty: "Subject line cannot be empty",
    successUpdated: "Template updated successfully!",
    errorUpdate: "Failed to update template",
  },
  es: {
    templateInfo: "Información de Plantilla",
    templateType: "Tipo de Plantilla",
    status: "Estado",
    enabled: "Habilitada",
    disabled: "Deshabilitada",
    subjectLineSection: "Línea de Asunto del Correo",
    subjectLabel: "Asunto *",
    subjectPlaceholder: "Ingresa la línea de asunto...",
    subjectHint: "Usa variables como",
    subjectHintSuffix: "para personalizar correos",
    previewLabel: "VISTA PREVIA",
    previewPlaceholder: "La línea de asunto aparecerá aquí...",
    availableVariables: "Variables Disponibles (clic para insertar)",
    bodyNoteTitle: "Plantilla del Cuerpo del Correo",
    bodyNoteText:
      "El diseño del cuerpo del correo se gestiona a través de componentes React Email en el código. Solo la línea de asunto puede personalizarse aquí. Para modificar el diseño del cuerpo del correo, contacta a tu desarrollador.",
    cancel: "Cancelar",
    preview: "Vista Previa",
    saving: "Guardando...",
    saveChanges: "Guardar Cambios",
    errorEmpty: "La línea de asunto no puede estar vacía",
    successUpdated: "¡Plantilla actualizada exitosamente!",
    errorUpdate: "Error al actualizar la plantilla",
  },
};

export const adminEmailTemplatesListTranslation = {
  en: {
    categories: {
      event: {
        title: "Event Notifications",
        description: "Emails related to event RSVPs and attendance",
      },
      assistance: {
        title: "Financial Assistance",
        description:
          "Emails for financial assistance applications and disbursements",
      },
      other: {
        title: "Other Notifications",
        description: "General system emails",
      },
    },
    enabled: "Enabled",
    disabled: "Disabled",
    subject: "Subject:",
    more: (n: number) => `+${n} more`,
    templateEnabled: "Template enabled",
    templateDisabled: "Template disabled",
    errorUpdate: "Failed to update template",
  },
  es: {
    categories: {
      event: {
        title: "Notificaciones de Eventos",
        description: "Correos relacionados con RSVPs y asistencia a eventos",
      },
      assistance: {
        title: "Asistencia Financiera",
        description:
          "Correos para solicitudes de asistencia financiera y desembolsos",
      },
      other: {
        title: "Otras Notificaciones",
        description: "Correos generales del sistema",
      },
    },
    enabled: "Habilitada",
    disabled: "Deshabilitada",
    subject: "Asunto:",
    more: (n: number) => `+${n} más`,
    templateEnabled: "Plantilla habilitada",
    templateDisabled: "Plantilla deshabilitada",
    errorUpdate: "Error al actualizar la plantilla",
  },
};
