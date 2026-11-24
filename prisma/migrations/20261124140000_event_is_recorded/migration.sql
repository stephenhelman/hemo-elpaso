-- Events: flag for "recorded or streamed" (drives the recording notice on the RSVP page). Additive only.
ALTER TABLE "events" ADD COLUMN "isRecorded" BOOLEAN NOT NULL DEFAULT false;
