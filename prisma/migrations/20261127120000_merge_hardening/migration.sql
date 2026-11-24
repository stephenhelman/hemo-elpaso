-- Merge hardening. Additive only: nothing is dropped or renamed.
--  * patients: merge tombstone columns (mergedIntoId, mergedAt)
--  * patient_aliases: the email of a merged-away record, used only to match a first sign-in
--  * duplicate_dismissals: "not a duplicate" pairs
--  * consent_records.reasonCode: why a board member changed a consent
--  * consent_records stays append-only; the ONLY exception beyond the FK SET NULL is a transaction-local merge window
--    (set_config('hoep.merge','on', true)) in which patientId / recordedByBoardUserId / householdMemberId may be
--    re-pointed and nothing else may change. merge_consent_records / merge_member_consents are the only callers.

-- 1. Audit actions and email kind
ALTER TYPE "AuditAction" ADD VALUE 'PATIENT_MERGE_PREVIEWED';
ALTER TYPE "AuditAction" ADD VALUE 'PATIENT_DUPLICATE_DISMISSED';
ALTER TYPE "AuditAction" ADD VALUE 'CONSENT_CHANGED_BY_BOARD';
ALTER TYPE "AuditAction" ADD VALUE 'MERGED_RECORDS_PURGED';
ALTER TYPE "EmailTemplateType" ADD VALUE 'RECORDS_MERGED_NOTICE';

-- 2. Tombstone
ALTER TABLE "patients" ADD COLUMN "mergedIntoId" TEXT;
ALTER TABLE "patients" ADD COLUMN "mergedAt" TIMESTAMP(3);
ALTER TABLE "patients"
  ADD CONSTRAINT "patients_mergedIntoId_fkey"
  FOREIGN KEY ("mergedIntoId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "patients_mergedIntoId_idx" ON "patients"("mergedIntoId");

-- 3. Aliases
CREATE TABLE "patient_aliases" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'merge',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "patient_aliases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "patient_aliases_patientId_email_key" ON "patient_aliases"("patientId", "email");
CREATE INDEX "patient_aliases_email_idx" ON "patient_aliases"("email");
ALTER TABLE "patient_aliases"
  ADD CONSTRAINT "patient_aliases_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Dismissed duplicate pairs (ids stored sorted)
CREATE TABLE "duplicate_dismissals" (
  "id" TEXT NOT NULL,
  "patientAId" TEXT NOT NULL,
  "patientBId" TEXT NOT NULL,
  "dismissedByPatientId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "duplicate_dismissals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "duplicate_dismissals_sorted_check" CHECK ("patientAId" < "patientBId")
);
CREATE UNIQUE INDEX "duplicate_dismissals_patientAId_patientBId_key" ON "duplicate_dismissals"("patientAId", "patientBId");
CREATE INDEX "duplicate_dismissals_patientBId_idx" ON "duplicate_dismissals"("patientBId");
ALTER TABLE "duplicate_dismissals"
  ADD CONSTRAINT "duplicate_dismissals_patientAId_fkey"
  FOREIGN KEY ("patientAId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "duplicate_dismissals_patientBId_fkey"
  FOREIGN KEY ("patientBId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Consent reason code (set at INSERT; the row is never updated)
ALTER TABLE "consent_records" ADD COLUMN "reasonCode" TEXT;

-- 6. Append-only trigger with the narrow, transaction-local merge window
CREATE OR REPLACE FUNCTION "consent_records_reject_update"() RETURNS trigger AS $$
BEGIN
  -- (a) the FK's ON DELETE SET NULL on recordedByBoardUserId: that column becomes NULL and nothing else changes
  IF NEW."recordedByBoardUserId" IS NULL
     AND (NEW."id", NEW."patientId", NEW."householdMemberId", NEW."type", NEW."granted",
          NEW."textVersion", NEW."method", NEW."reasonCode", NEW."createdAt")
         IS NOT DISTINCT FROM
         (OLD."id", OLD."patientId", OLD."householdMemberId", OLD."type", OLD."granted",
          OLD."textVersion", OLD."method", OLD."reasonCode", OLD."createdAt") THEN
    RETURN NEW;
  END IF;
  -- (b) a merge, inside a transaction that opened the window: ONLY who the record belongs to / who recorded it
  --     may be re-pointed. The value, type, text version, method, reason and timestamp can never change.
  IF current_setting('hoep.merge', true) = 'on'
     AND (NEW."id", NEW."type", NEW."granted", NEW."textVersion", NEW."method", NEW."reasonCode", NEW."createdAt")
         IS NOT DISTINCT FROM
         (OLD."id", OLD."type", OLD."granted", OLD."textVersion", OLD."method", OLD."reasonCode", OLD."createdAt") THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'consent_records is append-only: UPDATE is not allowed';
END;
$$ LANGUAGE plpgsql;

-- Move a merged-away person's consents (their own, and the ones they recorded for others) to the survivor.
-- The window is transaction-local (set_config(..., true)) and is closed before the function returns.
CREATE OR REPLACE FUNCTION "merge_consent_records"(from_id TEXT, to_id TEXT) RETURNS jsonb AS $$
DECLARE
  own_n INTEGER;
  rec_n INTEGER;
BEGIN
  IF from_id IS NULL OR to_id IS NULL OR from_id = to_id THEN
    RAISE EXCEPTION 'merge_consent_records: two different ids are required';
  END IF;
  PERFORM set_config('hoep.merge', 'on', true);
  UPDATE "consent_records" SET "patientId" = to_id WHERE "patientId" = from_id;
  GET DIAGNOSTICS own_n = ROW_COUNT;
  UPDATE "consent_records" SET "recordedByBoardUserId" = to_id WHERE "recordedByBoardUserId" = from_id;
  GET DIAGNOSTICS rec_n = ROW_COUNT;
  PERFORM set_config('hoep.merge', 'off', true);
  RETURN jsonb_build_object('own', own_n, 'recorded', rec_n);
END;
$$ LANGUAGE plpgsql;

-- Same window for two household-member rows that are the same person (a duplicate member folded into the kept one).
CREATE OR REPLACE FUNCTION "merge_member_consents"(from_member TEXT, to_member TEXT) RETURNS integer AS $$
DECLARE
  n INTEGER;
BEGIN
  IF from_member IS NULL OR to_member IS NULL OR from_member = to_member THEN
    RAISE EXCEPTION 'merge_member_consents: two different ids are required';
  END IF;
  PERFORM set_config('hoep.merge', 'on', true);
  UPDATE "consent_records" SET "householdMemberId" = to_member WHERE "householdMemberId" = from_member;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM set_config('hoep.merge', 'off', true);
  RETURN n;
END;
$$ LANGUAGE plpgsql;
