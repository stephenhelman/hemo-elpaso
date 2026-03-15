-- Migration: archive_system
-- Adds: Scholarship, AnnualReport, TaxFiling models
-- Adds: eventCost to Event
-- Adds: new AuditAction values

-- -------------------------------------------------------
-- 1. NEW AUDIT ACTIONS
-- -------------------------------------------------------

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SCHOLARSHIP_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SCHOLARSHIP_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SCHOLARSHIP_DELETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TAX_FILING_UPLOADED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TAX_FILING_DELETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ANNUAL_REPORT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ANNUAL_REPORT_UPDATED';

-- -------------------------------------------------------
-- 2. ADD eventCost TO events
-- -------------------------------------------------------

ALTER TABLE "events"
  ADD COLUMN "eventCost" DECIMAL(10, 2);

-- -------------------------------------------------------
-- 3. SCHOLARSHIPS TABLE
-- -------------------------------------------------------

CREATE TABLE "scholarships" (
  "id"            TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "amount"        DECIMAL(10, 2) NOT NULL,
  "academicYear"  TEXT NOT NULL,
  "description"   TEXT,
  "awardedAt"     TIMESTAMP(3) NOT NULL,
  "createdBy"     TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "scholarships_academicYear_idx" ON "scholarships"("academicYear");
CREATE INDEX "scholarships_awardedAt_idx" ON "scholarships"("awardedAt");

-- -------------------------------------------------------
-- 4. ANNUAL REPORTS TABLE
-- -------------------------------------------------------

CREATE TABLE "annual_reports" (
  "id"                    TEXT NOT NULL,
  "year"                  INTEGER NOT NULL,
  "totalEventsHeld"       INTEGER NOT NULL DEFAULT 0,
  "totalAttendance"       INTEGER NOT NULL DEFAULT 0,
  "totalAssistancePaid"   DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "totalScholarshipsPaid" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "totalSponsorIncome"    DECIMAL(10, 2),
  "notes"                 TEXT,
  "createdBy"             TEXT NOT NULL,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "annual_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "annual_reports_year_key" UNIQUE ("year")
);

CREATE INDEX "annual_reports_year_idx" ON "annual_reports"("year");

-- -------------------------------------------------------
-- 5. TAX FILINGS TABLE
-- -------------------------------------------------------

CREATE TABLE "tax_filings" (
  "id"          TEXT NOT NULL,
  "year"        INTEGER NOT NULL,
  "fileUrl"     TEXT NOT NULL,
  "fileKey"     TEXT NOT NULL,
  "uploadedBy"  TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tax_filings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tax_filings_year_key" UNIQUE ("year")
);