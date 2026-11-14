-- Phase 4: invitations, RSVP tokens, check-in headcount. Additive only.

-- 1. Patients can opt out of invitation emails (transactional emails still go out)
ALTER TABLE "patients" ADD COLUMN "emailOptOut" BOOLEAN NOT NULL DEFAULT false;

-- 2. RSVP: where it came from, hashed check-in token, soft-cancel.
--    (Party size stays in the existing "attendeeCount" column; no duplicate column.)
ALTER TABLE "Rsvp"
  ADD COLUMN "source"           TEXT NOT NULL DEFAULT 'manual',   -- invite | public | manual
  ADD COLUMN "checkInTokenHash" TEXT,
  ADD COLUMN "cancelledAt"      TIMESTAMP(3);
CREATE UNIQUE INDEX "Rsvp_checkInTokenHash_key" ON "Rsvp"("checkInTokenHash");

-- 3. Headcount actually checked in (may differ from RSVP party size)
ALTER TABLE "check_ins" ADD COLUMN "headcount" INTEGER;

-- 4. Invitations. Only the SHA-256 hash of the token is stored.
CREATE TABLE "invitations" (
  "id"                 TEXT NOT NULL,
  "eventId"            TEXT NOT NULL,
  "patientId"          TEXT NOT NULL,
  "tokenHash"          TEXT NOT NULL,
  "status"             TEXT NOT NULL DEFAULT 'pending',  -- pending | sent | rsvp_yes | rsvp_no
  "sentAt"             TIMESTAMP(3),
  "sentByBoardUserId"  TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "invitations_tokenHash_key" ON "invitations"("tokenHash");
CREATE UNIQUE INDEX "invitations_eventId_patientId_key" ON "invitations"("eventId", "patientId");
CREATE INDEX "invitations_patientId_idx" ON "invitations"("patientId");
ALTER TABLE "invitations"
  ADD CONSTRAINT "invitations_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "invitations_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "invitations_sentByBoardUserId_fkey"
  FOREIGN KEY ("sentByBoardUserId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Audit action
ALTER TYPE "AuditAction" ADD VALUE 'INVITATIONS_SENT';
