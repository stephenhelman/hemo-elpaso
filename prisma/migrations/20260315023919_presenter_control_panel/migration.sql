-- Migration: presenter_control_panel
-- Adds: PresenterAccessToken, EventPresentation models
-- Adds: new AuditAction values

-- -------------------------------------------------------
-- 1. NEW AUDIT ACTIONS
-- -------------------------------------------------------

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PRESENTER_TOKEN_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PRESENTATION_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ITINERARY_ITEM_STATUS_CHANGED';

-- -------------------------------------------------------
-- 2. PRESENTER ACCESS TOKENS TABLE
-- -------------------------------------------------------

CREATE TABLE "presenter_access_tokens" (
  "id"            TEXT NOT NULL,
  "eventId"       TEXT NOT NULL,
  "token"         TEXT NOT NULL,
  "presenterName" TEXT,
  "expiresAt"     TIMESTAMP(3) NOT NULL,
  "createdBy"     TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "presenter_access_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "presenter_access_tokens_token_key" UNIQUE ("token"),
  CONSTRAINT "presenter_access_tokens_eventId_fkey"
    FOREIGN KEY ("eventId")
    REFERENCES "events"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX "presenter_access_tokens_eventId_idx"
  ON "presenter_access_tokens"("eventId");

-- -------------------------------------------------------
-- 3. EVENT PRESENTATION TABLE
-- -------------------------------------------------------

CREATE TABLE "event_presentations" (
  "id"           TEXT NOT NULL,
  "eventId"      TEXT NOT NULL,
  "currentSlide" INTEGER NOT NULL DEFAULT 0,
  "totalSlides"  INTEGER NOT NULL DEFAULT 0,
  "slideUrls"    TEXT[] NOT NULL DEFAULT '{}',
  "isLive"       BOOLEAN NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "event_presentations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "event_presentations_eventId_key" UNIQUE ("eventId"),
  CONSTRAINT "event_presentations_eventId_fkey"
    FOREIGN KEY ("eventId")
    REFERENCES "events"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);