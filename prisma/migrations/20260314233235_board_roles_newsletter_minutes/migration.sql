-- Migration: board_roles_newsletter_minutes
-- Adds: BoardRole, Newsletter, BoardMinutes models
-- Adds: selectedForNewsletter to Poll, EventQuestion, EventPhoto
-- Adds: approved to EventPhoto
-- Adds: new AuditAction values
-- Adds: BoardRoleType and NewsletterStatus enums

-- -------------------------------------------------------
-- 1. ENUMS
-- -------------------------------------------------------

CREATE TYPE "BoardRoleType" AS ENUM (
  'PRESIDENT',
  'VICE_PRESIDENT',
  'TREASURER',
  'SECRETARY',
  'EVENTS_COORDINATOR',
  'SPONSOR_LIAISON',
  'COMMUNICATIONS_LEAD',
  'YOUTH_COORDINATOR',
  'VOLUNTEER_COORDINATOR',
  'FUNDRAISING_COORDINATOR',
  'BOARD_MEMBER_AT_LARGE'
);

CREATE TYPE "NewsletterStatus" AS ENUM (
  'DRAFT',
  'PENDING_APPROVAL',
  'CHANGES_REQUESTED',
  'APPROVED',
  'SENT'
);

-- -------------------------------------------------------
-- 2. NEW AUDIT ACTIONS
-- -------------------------------------------------------

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'NEWSLETTER_GENERATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'NEWSLETTER_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'NEWSLETTER_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'NEWSLETTER_SENT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BOARD_MINUTES_UPLOADED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BOARD_MINUTES_VISIBILITY_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BOARD_ROLE_ASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BOARD_ROLE_REMOVED';

-- -------------------------------------------------------
-- 3. BOARD ROLES TABLE
-- -------------------------------------------------------

CREATE TABLE "board_roles" (
  "id"          TEXT NOT NULL,
  "patientId"   TEXT NOT NULL,
  "role"        "BoardRoleType" NOT NULL,
  "fromEmail"   TEXT,
  "assignedBy"  TEXT NOT NULL,
  "assignedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "active"      BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "board_roles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "board_roles_patientId_role_key" UNIQUE ("patientId", "role"),
  CONSTRAINT "board_roles_patientId_fkey"
    FOREIGN KEY ("patientId")
    REFERENCES "patients"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX "board_roles_patientId_idx" ON "board_roles"("patientId");
CREATE INDEX "board_roles_role_idx" ON "board_roles"("role");
CREATE INDEX "board_roles_active_idx" ON "board_roles"("active");

-- -------------------------------------------------------
-- 4. NEWSLETTERS TABLE
-- -------------------------------------------------------

CREATE TABLE "newsletters" (
  "id"                    TEXT NOT NULL,
  "month"                 INTEGER NOT NULL,
  "year"                  INTEGER NOT NULL,
  "status"                "NewsletterStatus" NOT NULL DEFAULT 'DRAFT',
  "presidentMessageEn"    TEXT,
  "presidentMessageEs"    TEXT,
  "generatedContentJson"  JSONB NOT NULL,
  "revisionNotes"         TEXT,
  "sentAt"                TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "newsletters_month_year_key" UNIQUE ("month", "year")
);

CREATE INDEX "newsletters_status_idx" ON "newsletters"("status");
CREATE INDEX "newsletters_year_month_idx" ON "newsletters"("year", "month");

-- -------------------------------------------------------
-- 5. BOARD MINUTES TABLE
-- -------------------------------------------------------

CREATE TABLE "board_minutes" (
  "id"              TEXT NOT NULL,
  "meetingDate"     TIMESTAMP(3) NOT NULL,
  "title"           TEXT NOT NULL,
  "content"         JSONB NOT NULL,
  "isPublic"        BOOLEAN NOT NULL DEFAULT false,
  "markedPublicBy"  TEXT,
  "markedPublicAt"  TIMESTAMP(3),
  "uploadedBy"      TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "board_minutes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "board_minutes_isPublic_idx" ON "board_minutes"("isPublic");
CREATE INDEX "board_minutes_meetingDate_idx" ON "board_minutes"("meetingDate");

-- -------------------------------------------------------
-- 6. ADD selectedForNewsletter TO EXISTING MODELS
-- -------------------------------------------------------

ALTER TABLE "polls"
  ADD COLUMN "selectedForNewsletter" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "EventQuestion"
  ADD COLUMN "selectedForNewsletter" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "event_photos"
  ADD COLUMN "selectedForNewsletter" BOOLEAN NOT NULL DEFAULT false;

-- -------------------------------------------------------
-- 7. ADD approved TO EventPhoto (missing from schema)
-- -------------------------------------------------------

ALTER TABLE "event_photos"
  ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT false;

-- -------------------------------------------------------
-- 8. INDEXES FOR selectedForNewsletter
-- -------------------------------------------------------

CREATE INDEX "polls_selectedForNewsletter_idx"
  ON "polls"("selectedForNewsletter");

CREATE INDEX "EventQuestion_selectedForNewsletter_idx"
  ON "EventQuestion"("selectedForNewsletter");

CREATE INDEX "event_photos_selectedForNewsletter_idx"
  ON "event_photos"("selectedForNewsletter");

CREATE INDEX "event_photos_approved_idx"
  ON "event_photos"("approved");