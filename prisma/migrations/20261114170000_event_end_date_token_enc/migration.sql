-- Event end time (RSVP window / "past event"), and an encrypted copy of each
-- RSVP's check-in token so reminders/"resend my QR" can reuse the same QR.
-- Lookup still uses the SHA-256 hash. Additive only.
ALTER TABLE "events" ADD COLUMN "endDate" TIMESTAMP(3);
ALTER TABLE "Rsvp"   ADD COLUMN "checkInTokenEnc" TEXT;
