-- Phase 3: thin patient record, append-only consent log, board-invite cleanup.
-- Additive only: no tables/columns dropped or renamed. Two constraints relaxed
-- (patients.auth0Id and patients.email become nullable; email loses UNIQUE).

-- 1. Auth0 id nullable; board invites no longer use "pending:" placeholders
ALTER TABLE "patients" ALTER COLUMN "auth0Id" DROP NOT NULL;
UPDATE "patients" SET "auth0Id" = NULL WHERE "auth0Id" LIKE 'pending:%';

-- 2. Email nullable, unique -> plain index (duplicates are flagged, not blocked).
--    Normalize existing values (lowercase + trim) to match the app's storage rule.
ALTER TABLE "patients" ALTER COLUMN "email" DROP NOT NULL;
DROP INDEX "patients_email_key";
UPDATE "patients" SET "email" = lower(btrim("email")) WHERE "email" IS NOT NULL;
UPDATE "patients" SET "email" = NULL WHERE "email" = '';
CREATE INDEX "patients_email_idx" ON "patients"("email");

-- 3. Thin-patient fields
ALTER TABLE "patients"
  ADD COLUMN "familySize"            INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "statedDiagnoses"       TEXT[]  NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "source"                TEXT    NOT NULL DEFAULT 'web',
  ADD COLUMN "possibleDuplicateOfId" TEXT;

ALTER TABLE "patients"
  ADD CONSTRAINT "patients_possibleDuplicateOfId_fkey"
  FOREIGN KEY ("possibleDuplicateOfId") REFERENCES "patients"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "patients_possibleDuplicateOfId_idx" ON "patients"("possibleDuplicateOfId");

-- 4. Consent log
CREATE TABLE "consent_records" (
  "id"                    TEXT NOT NULL,
  "patientId"             TEXT NOT NULL,
  "type"                  TEXT NOT NULL,
  "granted"               BOOLEAN NOT NULL,
  "textVersion"           TEXT NOT NULL,
  "method"                TEXT NOT NULL,
  "recordedByBoardUserId" TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "consent_records_patientId_type_createdAt_idx"
  ON "consent_records"("patientId", "type", "createdAt");
ALTER TABLE "consent_records"
  ADD CONSTRAINT "consent_records_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "consent_records_recordedByBoardUserId_fkey"
  FOREIGN KEY ("recordedByBoardUserId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Append-only: reject UPDATE. DELETE stays allowed (patient hard-delete cascades).
--    One exception: the FK's ON DELETE SET NULL on recordedByBoardUserId (deleting a
--    board user) is itself an UPDATE; allow exactly that change and nothing else.
CREATE FUNCTION "consent_records_reject_update"() RETURNS trigger AS $$
BEGIN
  IF NEW."recordedByBoardUserId" IS NULL
     AND (NEW."id", NEW."patientId", NEW."type", NEW."granted",
          NEW."textVersion", NEW."method", NEW."createdAt")
         IS NOT DISTINCT FROM
         (OLD."id", OLD."patientId", OLD."type", OLD."granted",
          OLD."textVersion", OLD."method", OLD."createdAt") THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'consent_records is append-only: UPDATE is not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "consent_records_block_update"
  BEFORE UPDATE ON "consent_records"
  FOR EACH ROW EXECUTE FUNCTION "consent_records_reject_update"();

-- 6. Audit actions
ALTER TYPE "AuditAction" ADD VALUE 'BOARD_MEMBER_INVITED';
ALTER TYPE "AuditAction" ADD VALUE 'BOARD_SESSION_LINKED';
ALTER TYPE "AuditAction" ADD VALUE 'PATIENT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'PATIENT_MERGED';
