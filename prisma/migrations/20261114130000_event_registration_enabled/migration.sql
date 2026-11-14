-- Public RSVP on the event page is opt-in per event. Additive only.
ALTER TABLE "events" ADD COLUMN "registrationEnabled" BOOLEAN NOT NULL DEFAULT false;
