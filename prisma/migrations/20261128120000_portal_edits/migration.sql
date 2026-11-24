-- Family page edits and sign-in for every confirmed adult. Additive only.
--  * user_identities.householdMemberId: the acting adult. patientId stays the HOUSEHOLD.
--  * audit_logs.actorMemberId: who acted on the family page.
--  * household_members.phone / preferredLanguage: an adult's own.
--  * member_guardianships: designated co-guardians (permission applies once attestedAt is set).
--  * email_change_requests: an email change takes effect only when the link sent to the new address is used.

ALTER TYPE "AuditAction" ADD VALUE 'PORTAL_PROFILE_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'PORTAL_MEMBER_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'PORTAL_DIAGNOSES_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'PORTAL_GUARDIAN_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'PORTAL_EMAIL_CHANGE_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'PORTAL_EMAIL_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'PORTAL_MEMBER_LEFT';
ALTER TYPE "AuditAction" ADD VALUE 'PORTAL_DELETION_REQUESTED';
ALTER TYPE "EmailTemplateType" ADD VALUE 'EMAIL_CHANGE_CONFIRMATION';
ALTER TYPE "EmailTemplateType" ADD VALUE 'MEMBER_LEFT_NOTICE';
ALTER TYPE "EmailTemplateType" ADD VALUE 'DELETION_REQUEST_NOTICE';

ALTER TABLE "household_members" ADD COLUMN "phone" TEXT;
ALTER TABLE "household_members" ADD COLUMN "preferredLanguage" TEXT;

ALTER TABLE "audit_logs" ADD COLUMN "actorMemberId" TEXT;
CREATE INDEX "audit_logs_actorMemberId_idx" ON "audit_logs"("actorMemberId");

ALTER TABLE "user_identities" ADD COLUMN "householdMemberId" TEXT;
ALTER TABLE "user_identities"
  ADD CONSTRAINT "user_identities_householdMemberId_fkey"
  FOREIGN KEY ("householdMemberId") REFERENCES "household_members"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "user_identities_member_needs_household_check"
  CHECK ("householdMemberId" IS NULL OR "patientId" IS NOT NULL);
CREATE INDEX "user_identities_householdMemberId_idx" ON "user_identities"("householdMemberId");

CREATE TABLE "member_guardianships" (
  "id" TEXT NOT NULL,
  "childMemberId" TEXT NOT NULL,
  "guardianMemberId" TEXT NOT NULL,
  "designatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "attestedAt" TIMESTAMP(3),
  CONSTRAINT "member_guardianships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "member_guardianships_distinct_check" CHECK ("childMemberId" <> "guardianMemberId")
);
CREATE UNIQUE INDEX "member_guardianships_childMemberId_guardianMemberId_key" ON "member_guardianships"("childMemberId", "guardianMemberId");
CREATE INDEX "member_guardianships_guardianMemberId_idx" ON "member_guardianships"("guardianMemberId");
ALTER TABLE "member_guardianships"
  ADD CONSTRAINT "member_guardianships_childMemberId_fkey" FOREIGN KEY ("childMemberId") REFERENCES "household_members"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "member_guardianships_guardianMemberId_fkey" FOREIGN KEY ("guardianMemberId") REFERENCES "household_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "email_change_requests" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "householdMemberId" TEXT,
  "newEmail" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_change_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "email_change_requests_tokenHash_key" ON "email_change_requests"("tokenHash");
CREATE INDEX "email_change_requests_patientId_idx" ON "email_change_requests"("patientId");
ALTER TABLE "email_change_requests"
  ADD CONSTRAINT "email_change_requests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "email_change_requests_householdMemberId_fkey" FOREIGN KEY ("householdMemberId") REFERENCES "household_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
