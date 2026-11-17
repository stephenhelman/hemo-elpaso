-- Household members, age guard, adult confirmation, age-group targeting values.
-- Additive except for the targetAgeGroups value conversion (data only, loud on unknowns).

-- 1. HouseholdMember
CREATE TABLE "household_members" (
  "id"                    TEXT NOT NULL,
  "patientId"             TEXT NOT NULL,
  "firstName"             TEXT,            -- NULL only after a decline/expiry purge
  "lastName"              TEXT,
  "relationship"          TEXT NOT NULL,   -- child | spouse_partner | parent | sibling | other
  "ageGroup"              TEXT NOT NULL,   -- 0_5 | 6_12 | 13_17 | 18_plus
  "statedDiagnoses"       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- PHI
  "email"                 TEXT,            -- lowercased by the app
  "confirmByPhone"        BOOLEAN NOT NULL DEFAULT false,
  "status"                TEXT NOT NULL DEFAULT 'not_required',
  "confirmTokenHash"      TEXT,
  "confirmTokenExpiresAt" TIMESTAMP(3),
  "confirmedAt"           TIMESTAMP(3),
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,
  CONSTRAINT "household_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "household_members_relationship_check"
    CHECK ("relationship" IN ('child','spouse_partner','parent','sibling','other')),
  CONSTRAINT "household_members_ageGroup_check"
    CHECK ("ageGroup" IN ('0_5','6_12','13_17','18_plus')),
  CONSTRAINT "household_members_status_check"
    CHECK ("status" IN ('not_required','pending','confirmed','declined','expired')),
  CONSTRAINT "household_members_firstName_check"
    CHECK ("firstName" IS NOT NULL OR "status" IN ('declined','expired'))
);
CREATE UNIQUE INDEX "household_members_confirmTokenHash_key" ON "household_members"("confirmTokenHash");
CREATE INDEX "household_members_patientId_idx" ON "household_members"("patientId");
CREATE INDEX "household_members_status_createdAt_idx" ON "household_members"("status", "createdAt");
ALTER TABLE "household_members"
  ADD CONSTRAINT "household_members_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Patient: the primary person's own diagnoses (statedDiagnoses stays the household union).
ALTER TABLE "patients" ADD COLUMN "primaryDiagnoses" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "patients" SET "primaryDiagnoses" = "statedDiagnoses" WHERE cardinality("statedDiagnoses") > 0;

-- 3. ConsentRecord: subject is a patient XOR a household member.
ALTER TABLE "consent_records" ADD COLUMN "householdMemberId" TEXT;
ALTER TABLE "consent_records" ALTER COLUMN "patientId" DROP NOT NULL;
ALTER TABLE "consent_records"
  ADD CONSTRAINT "consent_records_householdMemberId_fkey"
  FOREIGN KEY ("householdMemberId") REFERENCES "household_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consent_records"
  ADD CONSTRAINT "consent_records_one_subject_check"
  CHECK (("patientId" IS NOT NULL)::int + ("householdMemberId" IS NOT NULL)::int = 1);
CREATE INDEX "consent_records_householdMemberId_type_createdAt_idx"
  ON "consent_records"("householdMemberId", "type", "createdAt");

CREATE OR REPLACE FUNCTION "consent_records_reject_update"() RETURNS trigger AS $$
BEGIN
  IF NEW."recordedByBoardUserId" IS NULL
     AND (NEW."id", NEW."patientId", NEW."householdMemberId", NEW."type", NEW."granted",
          NEW."textVersion", NEW."method", NEW."createdAt")
         IS NOT DISTINCT FROM
         (OLD."id", OLD."patientId", OLD."householdMemberId", OLD."type", OLD."granted",
          OLD."textVersion", OLD."method", OLD."createdAt") THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'consent_records is append-only: UPDATE is not allowed';
END;
$$ LANGUAGE plpgsql;

-- 4. EventTargeting.targetAgeGroups: old labels -> new age groups, loud on anything else.
--    children -> 0_5, 6_12 | teens -> 13_17 | adults, seniors -> 18_plus (deduplicated).
UPDATE "event_targeting" et
SET "targetAgeGroups" = COALESCE((
  SELECT array_agg(DISTINCT v ORDER BY v)
  FROM (
    SELECT unnest(
      CASE g
        WHEN 'children' THEN ARRAY['0_5','6_12']
        WHEN 'teens'    THEN ARRAY['13_17']
        WHEN 'adults'   THEN ARRAY['18_plus']
        WHEN 'seniors'  THEN ARRAY['18_plus']
        WHEN '0_5'      THEN ARRAY['0_5']
        WHEN '6_12'     THEN ARRAY['6_12']
        WHEN '13_17'    THEN ARRAY['13_17']
        WHEN '18_plus'  THEN ARRAY['18_plus']
        ELSE ARRAY['__UNKNOWN__:' || g]
      END
    ) AS v
    FROM unnest(COALESCE(et."targetAgeGroups", ARRAY[]::TEXT[])) AS g
  ) s
), ARRAY[]::TEXT[]);

DO $$
DECLARE bad TEXT;
BEGIN
  SELECT string_agg(DISTINCT g, ', ') INTO bad
  FROM "event_targeting", unnest("targetAgeGroups") AS g
  WHERE g NOT IN ('0_5','6_12','13_17','18_plus');
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'event_targeting.targetAgeGroups has unknown values after conversion: %', bad;
  END IF;
END $$;

-- 5. Audit actions
ALTER TYPE "AuditAction" ADD VALUE 'HOUSEHOLD_MEMBER_CONFIRMED';
ALTER TYPE "AuditAction" ADD VALUE 'HOUSEHOLD_MEMBER_DECLINED';
ALTER TYPE "AuditAction" ADD VALUE 'HOUSEHOLD_MEMBER_EXPIRED';
ALTER TYPE "AuditAction" ADD VALUE 'HOUSEHOLD_MEMBER_PHONE_CONFIRMED';
ALTER TYPE "AuditAction" ADD VALUE 'HOUSEHOLD_MEMBER_CONFIRMATION_RESENT';
