-- Linked sign-in identities + app settings. Additive only: two new tables, new enum values. Nothing dropped or renamed.
-- patients.auth0_id stays (deprecated, read-only). It is copied into user_identities below.
ALTER TYPE "AuditAction" ADD VALUE 'IDENTITY_LINKED';
ALTER TYPE "AuditAction" ADD VALUE 'IDENTITY_UNLINKED';
ALTER TYPE "AuditAction" ADD VALUE 'IDENTITY_LINK_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'BOARD_SIGNIN_POLICY_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'BOARD_RECORD_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'BOARD_ORG_EMAIL_CHANGED';

CREATE TABLE "user_identities" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "auth0Sub" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "linkedAt" TIMESTAMP(3),
    "linkedVia" TEXT,
    "linkedByPatientId" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "user_identities_auth0Sub_key" ON "user_identities"("auth0Sub");
CREATE INDEX "user_identities_patientId_idx" ON "user_identities"("patientId");
CREATE INDEX "user_identities_email_idx" ON "user_identities"("email");
CREATE INDEX "user_identities_patientId_lastLoginAt_idx" ON "user_identities"("patientId", "lastLoginAt");

ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_linkedByPatientId_fkey" FOREIGN KEY ("linkedByPatientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: every existing Auth0 link becomes an identity. The old link required a verified email.
-- (md5-based ids keep this plain SQL; they are opaque strings like any other id.)
INSERT INTO "user_identities" ("id", "patientId", "auth0Sub", "provider", "email", "emailVerified", "linkedAt", "linkedVia")
SELECT md5(random()::text || p."id"), p."id", p."auth0Id",
       CASE WHEN position('|' in p."auth0Id") > 0 THEN split_part(p."auth0Id", '|', 1) ELSE 'unknown' END,
       lower(COALESCE(p."email", '')), true, CURRENT_TIMESTAMP, 'backfill'
FROM "patients" p
WHERE p."auth0Id" IS NOT NULL;
