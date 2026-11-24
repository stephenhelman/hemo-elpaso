-- Permissions matrix. Additive only: one new table and new enum values.
ALTER TYPE "EmailTemplateType" ADD VALUE 'ADMIN_CHANGE_NOTICE';
ALTER TYPE "AuditAction" ADD VALUE 'PERMISSIONS_CHANGED';

CREATE TABLE "role_permissions" (
    "role" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role","permission")
);
