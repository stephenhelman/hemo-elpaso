-- RSVP requests, in-person / virtual attendance, call logs, contact preferences. Additive only: nothing dropped or renamed.
--  * events.rsvpAccess is now dormant (nothing reads it). allowUninvitedRequests is backfilled from it, so no event changes behaviour
--    (invited_only -> false, any_approved -> true). Diagnosis-targeted events now accept requests on purpose.
--  * Existing invitations are backfilled origin 'matched', attendanceType 'in_person' (the column defaults).

ALTER TYPE "AuditAction" ADD VALUE 'RSVP_REQUEST_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'RSVP_REQUEST_PROMOTED';
ALTER TYPE "AuditAction" ADD VALUE 'RSVP_REQUEST_CONFIRMED';
ALTER TYPE "AuditAction" ADD VALUE 'RSVP_REQUEST_WAITLISTED';
ALTER TYPE "AuditAction" ADD VALUE 'RSVP_REQUEST_DECLINED';
ALTER TYPE "AuditAction" ADD VALUE 'RSVP_REQUEST_WITHDRAWN';
ALTER TYPE "AuditAction" ADD VALUE 'INVITATION_ATTENDANCE_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'INVITATION_CALL_LOGGED';
ALTER TYPE "AuditAction" ADD VALUE 'ALSO_SEND_TO_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'PHONE_TEXT_PREF_CHANGED';
ALTER TYPE "EmailTemplateType" ADD VALUE 'RSVP_REQUEST_RECEIVED';
ALTER TYPE "EmailTemplateType" ADD VALUE 'RSVP_CONFIRMED_VIRTUAL';
ALTER TYPE "EmailTemplateType" ADD VALUE 'RSVP_REQUEST_DECLINED';
ALTER TYPE "EmailTemplateType" ADD VALUE 'RSVP_WAITLISTED';
ALTER TYPE "EmailTemplateType" ADD VALUE 'RSVP_REMINDER_VIRTUAL';

-- events
ALTER TABLE "events" ADD COLUMN "allowUninvitedRequests" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "events" ADD COLUMN "virtualEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN "meetUrl" TEXT;
ALTER TABLE "events" ADD COLUMN "youtubeUrl" TEXT;
UPDATE "events" SET "allowUninvitedRequests" = ("rsvpAccess" <> 'invited_only');

-- invitations / rsvps
ALTER TABLE "invitations" ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'matched';
ALTER TABLE "invitations" ADD COLUMN "attendanceType" TEXT NOT NULL DEFAULT 'in_person';
ALTER TABLE "invitations"
  ADD CONSTRAINT "invitations_origin_check" CHECK ("origin" IN ('matched', 'request', 'manual')),
  ADD CONSTRAINT "invitations_attendance_type_check" CHECK ("attendanceType" IN ('in_person', 'virtual'));
ALTER TABLE "Rsvp" ADD COLUMN "attendanceType" TEXT NOT NULL DEFAULT 'in_person';
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_attendance_type_check" CHECK ("attendanceType" IN ('in_person', 'virtual'));

-- contact preferences
ALTER TABLE "patients" ADD COLUMN "alsoSendToMemberIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "patients" ADD COLUMN "phoneCanText" BOOLEAN;
ALTER TABLE "household_members" ADD COLUMN "phoneCanText" BOOLEAN;

-- rsvp_requests
CREATE TABLE "rsvp_requests" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "selPrimary" BOOLEAN NOT NULL DEFAULT true,
  "selMemberIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "selGuests" INTEGER NOT NULL DEFAULT 0,
  "partySize" INTEGER NOT NULL,
  "declineReason" TEXT,
  "decidedByPatientId" TEXT,
  "decidedAt" TIMESTAMP(3),
  "invitationId" TEXT,
  "rsvpId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rsvp_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "rsvp_requests_source_check" CHECK ("source" IN ('modal', 'emailed_link', 'portal', 'registration', 'board')),
  CONSTRAINT "rsvp_requests_status_check" CHECK ("status" IN ('waiting_household_review', 'pending', 'waitlisted', 'confirmed_in_person', 'confirmed_virtual', 'declined', 'withdrawn')),
  CONSTRAINT "rsvp_requests_decline_reason_check" CHECK ("declineReason" IS NULL OR "declineReason" IN ('EVENT_FULL', 'NOT_ELIGIBLE_FOR_EVENT', 'DUPLICATE_REQUEST', 'FAMILY_WITHDREW', 'OTHER')),
  CONSTRAINT "rsvp_requests_decline_has_reason_check" CHECK ("status" <> 'declined' OR "declineReason" IS NOT NULL),
  CONSTRAINT "rsvp_requests_party_check" CHECK ("partySize" >= 1 AND "selGuests" >= 0)
);
CREATE UNIQUE INDEX "rsvp_requests_invitationId_key" ON "rsvp_requests"("invitationId");
CREATE INDEX "rsvp_requests_eventId_status_createdAt_idx" ON "rsvp_requests"("eventId", "status", "createdAt");
CREATE INDEX "rsvp_requests_patientId_idx" ON "rsvp_requests"("patientId");
CREATE UNIQUE INDEX "rsvp_requests_one_open" ON "rsvp_requests"("eventId", "patientId") WHERE "status" IN ('waiting_household_review', 'pending', 'waitlisted');
ALTER TABLE "rsvp_requests" ADD CONSTRAINT "rsvp_requests_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rsvp_requests" ADD CONSTRAINT "rsvp_requests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rsvp_requests" ADD CONSTRAINT "rsvp_requests_decidedByPatientId_fkey" FOREIGN KEY ("decidedByPatientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "rsvp_requests" ADD CONSTRAINT "rsvp_requests_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "invitations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- invitation_call_logs (also written by the future dialer: source 'dialer')
CREATE TABLE "invitation_call_logs" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "invitationId" TEXT,
  "purpose" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "providerCallId" TEXT,
  "calledByPatientId" TEXT,
  "calledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invitation_call_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invitation_call_logs_purpose_check" CHECK ("purpose" IN ('invitation', 'confirmation')),
  CONSTRAINT "invitation_call_logs_outcome_check" CHECK ("outcome" IN ('REACHED', 'VOICEMAIL', 'NO_ANSWER', 'WRONG_NUMBER', 'CALLBACK_NEEDED')),
  CONSTRAINT "invitation_call_logs_source_check" CHECK ("source" IN ('manual', 'dialer'))
);
CREATE INDEX "invitation_call_logs_eventId_patientId_calledAt_idx" ON "invitation_call_logs"("eventId", "patientId", "calledAt");
CREATE INDEX "invitation_call_logs_invitationId_idx" ON "invitation_call_logs"("invitationId");
ALTER TABLE "invitation_call_logs" ADD CONSTRAINT "invitation_call_logs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invitation_call_logs" ADD CONSTRAINT "invitation_call_logs_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "invitations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invitation_call_logs" ADD CONSTRAINT "invitation_call_logs_calledByPatientId_fkey" FOREIGN KEY ("calledByPatientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
