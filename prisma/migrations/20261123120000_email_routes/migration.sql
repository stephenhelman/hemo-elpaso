-- Email routing settings. Additive only: one new table and new enum values.
ALTER TYPE "EmailTemplateType" ADD VALUE 'CONTACT_NOTIFICATION';
ALTER TYPE "EmailTemplateType" ADD VALUE 'CONTACT_AUTO_REPLY';
ALTER TYPE "EmailTemplateType" ADD VALUE 'EMAIL_ROUTING_NOTICE';
ALTER TYPE "EmailTemplateType" ADD VALUE 'EMAIL_ROUTING_TEST';
ALTER TYPE "AuditAction" ADD VALUE 'EMAIL_ROUTE_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'EMAIL_ROUTE_TEST_SENT';

CREATE TABLE "email_routes" (
    "route" TEXT NOT NULL,
    "recipients" TEXT[],
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_routes_pkey" PRIMARY KEY ("route")
);
