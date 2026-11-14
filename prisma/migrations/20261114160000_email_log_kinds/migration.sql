-- EmailLog kinds for emails sent from code (not DB templates). Additive.
ALTER TYPE "EmailTemplateType" ADD VALUE 'REGISTRATION_INFO_CONFIRMATION';
ALTER TYPE "EmailTemplateType" ADD VALUE 'EVENT_INVITATION';
