-- Migration: add_original_file_to_event_presentation
-- Adds original file storage fields to EventPresentation

ALTER TABLE "event_presentations"
  ADD COLUMN IF NOT EXISTS "originalFileUrl"  TEXT,
  ADD COLUMN IF NOT EXISTS "originalFileKey"  TEXT,
  ADD COLUMN IF NOT EXISTS "originalFileName" TEXT;