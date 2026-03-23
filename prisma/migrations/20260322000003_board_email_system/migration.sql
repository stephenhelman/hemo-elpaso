-- SCHEMA-003: Board email system
-- Adds Gmail OAuth fields to BoardRole, creates BoardOnboarding and CommunicationLog models
-- Adds new AuditAction and EmailTemplateType enum values

-- Add Gmail OAuth fields to board_roles
ALTER TABLE "board_roles"
  ADD COLUMN "gmailSendAsConfigured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "gmailConnectedAt" TIMESTAMP(3),
  ADD COLUMN "gmailConnectedBy" TEXT,
  ADD COLUMN "gmailAccessToken" TEXT,
  ADD COLUMN "gmailRefreshToken" TEXT,
  ADD COLUMN "gmailTokenExpiry" TIMESTAMP(3);

-- Create board_onboardings table
CREATE TABLE "board_onboardings" (
  "id"               TEXT NOT NULL,
  "boardRoleId"      TEXT NOT NULL,
  "emailSentAt"      TIMESTAMP(3),
  "gmailConnected"   BOOLEAN NOT NULL DEFAULT false,
  "gmailConnectedAt" TIMESTAMP(3),
  "sendAsSetUp"      BOOLEAN NOT NULL DEFAULT false,
  "sendAsConfirmedAt" TIMESTAMP(3),
  "completedAt"      TIMESTAMP(3),
  CONSTRAINT "board_onboardings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "board_onboardings_boardRoleId_key" ON "board_onboardings"("boardRoleId");

ALTER TABLE "board_onboardings"
  ADD CONSTRAINT "board_onboardings_boardRoleId_fkey"
  FOREIGN KEY ("boardRoleId") REFERENCES "board_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create communication_logs table
CREATE TABLE "communication_logs" (
  "id"             TEXT NOT NULL,
  "boardRoleId"    TEXT NOT NULL,
  "patientId"      TEXT,
  "sponsorId"      TEXT,
  "direction"      TEXT NOT NULL DEFAULT 'outbound',
  "subject"        TEXT NOT NULL,
  "bodyPreview"    TEXT NOT NULL,
  "sentAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "gmailMessageId" TEXT,
  "fromEmail"      TEXT NOT NULL,
  "toEmail"        TEXT NOT NULL,
  CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "communication_logs_boardRoleId_idx" ON "communication_logs"("boardRoleId");
CREATE INDEX "communication_logs_patientId_idx" ON "communication_logs"("patientId");

ALTER TABLE "communication_logs"
  ADD CONSTRAINT "communication_logs_boardRoleId_fkey"
  FOREIGN KEY ("boardRoleId") REFERENCES "board_roles"("id") ON UPDATE CASCADE;

-- Add new AuditAction enum values
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BOARD_ROLE_ONBOARDING_SENT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'GMAIL_CONNECTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'GMAIL_DISCONNECTED';

-- Add new EmailTemplateType enum value
ALTER TYPE "EmailTemplateType" ADD VALUE IF NOT EXISTS 'BOARD_ROLE_ASSIGNED';
