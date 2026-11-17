-- Per-person RSVP and check-in. Additive only.

-- 1. RsvpAttendee: one row per person attending on an RSVP.
--    isPrimary rows are the Patient themself (no householdMemberId).
--    A member row's householdMemberId goes NULL if the member is removed (safety net: the app deletes the row first).
CREATE TABLE "rsvp_attendees" (
  "id"                TEXT NOT NULL,
  "rsvpId"            TEXT NOT NULL,
  "householdMemberId" TEXT,
  "isPrimary"         BOOLEAN NOT NULL DEFAULT false,
  "checkedInAt"       TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rsvp_attendees_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rsvp_attendees_primary_no_member_check"
    CHECK (NOT "isPrimary" OR "householdMemberId" IS NULL)
);
CREATE UNIQUE INDEX "rsvp_attendees_rsvpId_householdMemberId_key" ON "rsvp_attendees"("rsvpId", "householdMemberId");
-- at most one primary row per RSVP
CREATE UNIQUE INDEX "rsvp_attendees_one_primary_per_rsvp" ON "rsvp_attendees"("rsvpId") WHERE "isPrimary";
CREATE INDEX "rsvp_attendees_householdMemberId_idx" ON "rsvp_attendees"("householdMemberId");
ALTER TABLE "rsvp_attendees"
  ADD CONSTRAINT "rsvp_attendees_rsvpId_fkey"
  FOREIGN KEY ("rsvpId") REFERENCES "Rsvp"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "rsvp_attendees_householdMemberId_fkey"
  FOREIGN KEY ("householdMemberId") REFERENCES "household_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Rsvp.guestCount; attendeeCount becomes derived (attendee rows + guestCount), kept in sync by the app.
ALTER TABLE "Rsvp" ADD COLUMN "guestCount" INTEGER NOT NULL DEFAULT 0;

-- 3. CheckIn.guestsCheckedIn: guests confirmed at the door. CheckIn.headcount = checked attendees + guestsCheckedIn.
ALTER TABLE "check_ins" ADD COLUMN "guestsCheckedIn" INTEGER NOT NULL DEFAULT 0;

-- 4. Backfill existing RSVPs: one primary attendee, the rest become guests.
INSERT INTO "rsvp_attendees" ("id", "rsvpId", "isPrimary", "checkedInAt")
SELECT gen_random_uuid()::text, r."id", true, ci."checkInTime"
FROM "Rsvp" r
LEFT JOIN "check_ins" ci ON ci."eventId" = r."eventId" AND ci."patientId" = r."patientId";

UPDATE "Rsvp" SET "guestCount" = GREATEST("attendeeCount" - 1, 0);

-- Existing check-ins: the primary is checked in; remaining headcount = guests confirmed.
UPDATE "check_ins" ci
SET "guestsCheckedIn" = GREATEST(COALESCE(ci."headcount", r."attendeeCount", 1) - 1, 0)
FROM "Rsvp" r
WHERE r."eventId" = ci."eventId" AND r."patientId" = ci."patientId";
