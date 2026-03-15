-- Migration: add_conversion_tracking_to_event_presentation
-- Adds async conversion job tracking fields

ALTER TABLE "event_presentations"
  ADD COLUMN IF NOT EXISTS "conversionJobId"  TEXT,
  ADD COLUMN IF NOT EXISTS "conversionStatus" TEXT NOT NULL DEFAULT 'done';

-- Existing presentations are already done
UPDATE "event_presentations"
  SET "conversionStatus" = 'done'
  WHERE "conversionStatus" = 'done' OR "conversionStatus" IS NULL;