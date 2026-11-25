-- Registration review queue, "who can RSVP", emailed RSVP links. Additive only.
--  * patients.reviewStatus: every EXISTING household becomes pending_review (the column default). Known families are
--    approved right after this migration with scripts/approve-households.ts.
--  * app_settings 'review_gate_cutoff': the moment this migration ran. Invitations created BEFORE it keep working for
--    households that are not approved (grandfathered); the approval gate applies to invitations created after it.
--  * events.rsvpAccess: existing events get any_approved.

ALTER TYPE "AuditAction" ADD VALUE 'REVIEW_STATUS_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'RSVP_LINK_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'RSVP_APPROVAL_OVERRIDDEN';
ALTER TYPE "EmailTemplateType" ADD VALUE 'RSVP_ACCESS_LINK';

ALTER TABLE "patients" ADD COLUMN "reviewStatus" TEXT NOT NULL DEFAULT 'pending_review';
ALTER TABLE "patients" ADD COLUMN "reviewHoldReason" TEXT;
ALTER TABLE "patients" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "patients" ADD COLUMN "reviewedByPatientId" TEXT;
ALTER TABLE "patients"
  ADD CONSTRAINT "patients_review_status_check" CHECK ("reviewStatus" IN ('pending_review', 'approved', 'on_hold')),
  ADD CONSTRAINT "patients_review_hold_reason_check" CHECK (
    ("reviewStatus" = 'on_hold' AND "reviewHoldReason" IS NOT NULL AND "reviewHoldReason" IN ('NEEDS_CALL', 'POSSIBLE_DUPLICATE', 'NO_AFFECTED_MEMBER_STATED', 'OTHER'))
    OR ("reviewStatus" <> 'on_hold' AND "reviewHoldReason" IS NULL)
  );
CREATE INDEX "patients_reviewStatus_createdAt_idx" ON "patients"("reviewStatus", "createdAt");

ALTER TABLE "events" ADD COLUMN "rsvpAccess" TEXT NOT NULL DEFAULT 'any_approved';
ALTER TABLE "events" ADD CONSTRAINT "events_rsvp_access_check" CHECK ("rsvpAccess" IN ('invited_only', 'any_approved'));

CREATE TABLE "rsvp_access_links" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rsvp_access_links_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "rsvp_access_links_tokenHash_key" ON "rsvp_access_links"("tokenHash");
CREATE INDEX "rsvp_access_links_eventId_patientId_idx" ON "rsvp_access_links"("eventId", "patientId");
ALTER TABLE "rsvp_access_links" ADD CONSTRAINT "rsvp_access_links_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rsvp_access_links" ADD CONSTRAINT "rsvp_access_links_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "app_settings" ("key", "value", "updatedAt")
VALUES ('review_gate_cutoff', to_jsonb(to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')), now())
ON CONFLICT ("key") DO NOTHING;
