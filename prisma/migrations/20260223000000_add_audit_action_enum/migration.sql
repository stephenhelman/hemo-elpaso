-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM (
  'REGISTRATION_COMPLETED',
  'PROFILE_UPDATED',
  'PATIENT_VIEWED',
  'RSVP_CREATED',
  'RSVP_CANCELLED',
  'EVENT_CREATED',
  'EVENT_UPDATED',
  'EVENT_DELETED',
  'EVENT_PHOTOS_UPLOADED',
  'EVENT_PHOTO_DELETED',
  'EVENT_FLYERS_UPDATED',
  'ANNOUNCEMENT_CREATED',
  'ANNOUNCEMENT_DELETED',
  'ITINERARY_ITEM_CREATED',
  'ITINERARY_ITEM_UPDATED',
  'ITINERARY_ITEM_DELETED',
  'ASSISTANCE_APPLICATION_CREATED',
  'ASSISTANCE_APPLICATION_UPDATED',
  'ASSISTANCE_APPLICATION_VIEWED',
  'ASSISTANCE_APPLICATION_APPROVED',
  'ASSISTANCE_APPLICATION_DENIED',
  'ASSISTANCE_DISBURSEMENT_CREATED',
  'ASSISTANCE_DOCUMENT_UPLOADED',
  'ASSISTANCE_DOCUMENT_DELETED',
  'DISBURSEMENT_PROOF_UPLOADED',
  'CHECKIN_CREATED',
  'MANUAL_CHECKIN',
  'CHECKIN_REMOVED',
  'FAMILY_MEMBER_ADDED',
  'FAMILY_MEMBER_UPDATED',
  'FAMILY_MEMBER_DELETED',
  'DIAGNOSIS_APPROVED',
  'DIAGNOSIS_REJECTED',
  'DIAGNOSIS_APPROVED_FAMILY',
  'DIAGNOSIS_REJECTED_FAMILY',
  'USER_UPDATED',
  'USER_DELETED',
  'USERS_EXPORTED',
  'POLL_CREATED',
  'POLL_DELETED',
  'POLL_APPROVED',
  'POLL_ACTIVATED',
  'POLL_DEACTIVATED',
  'POLL_INVITE_SENT',
  'QUESTION_DELETED',
  'QUESTION_ANSWERED',
  'EMAIL_TEMPLATE_UPDATED',
  'TEST_EMAIL_SENT',
  'SPONSOR_INVITE_SENT'
);

-- AlterColumn: convert existing string action values to the new enum type.
--
-- Most stored values are lowercase versions of the enum names (e.g. 'rsvp_created' → 'RSVP_CREATED'),
-- so UPPER() handles them. A few stored values have different names due to dynamic string
-- concatenation in the original code; those are mapped explicitly.
ALTER TABLE "audit_logs"
  ALTER COLUMN "action" TYPE "AuditAction"
  USING CASE "action"
    -- Dynamic approval/denial actions stored without the past-tense suffix
    WHEN 'assistance_application_approve' THEN 'ASSISTANCE_APPLICATION_APPROVED'::"AuditAction"
    WHEN 'assistance_application_deny'    THEN 'ASSISTANCE_APPLICATION_DENIED'::"AuditAction"

    -- Diagnosis rejection was stored as 'rejectd' (missing the 'e') due to string concat
    WHEN 'diagnosis_rejectd'        THEN 'DIAGNOSIS_REJECTED'::"AuditAction"
    WHEN 'diagnosis_rejectd_family' THEN 'DIAGNOSIS_REJECTED_FAMILY'::"AuditAction"

    -- All remaining values are UPPERCASE versions of the stored lowercase strings
    ELSE UPPER("action")::"AuditAction"
  END;
