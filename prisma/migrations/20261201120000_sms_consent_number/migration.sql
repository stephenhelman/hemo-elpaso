-- A texting consent is tied to the phone number it was given for. Additive only: nothing dropped or renamed.
--  * consent_records.phoneNumber: set on new "sms" grants. Rows written before this stay NULL, so they cover no number:
--    texting is not allowed until the family agrees again. No backfill (consent rows are evidence and are never edited).
--  * The append-only trigger is replaced so the new column is protected like every other one (the merge window and the
--    FK's SET NULL still may not change it).

ALTER TABLE "consent_records" ADD COLUMN "phoneNumber" TEXT;

CREATE OR REPLACE FUNCTION "consent_records_reject_update"() RETURNS trigger AS $$
BEGIN
  -- (a) the FK's ON DELETE SET NULL on recordedByBoardUserId: that column becomes NULL and nothing else changes
  IF NEW."recordedByBoardUserId" IS NULL
     AND (NEW."id", NEW."patientId", NEW."householdMemberId", NEW."type", NEW."granted",
          NEW."textVersion", NEW."method", NEW."reasonCode", NEW."createdAt", NEW."phoneNumber")
         IS NOT DISTINCT FROM
         (OLD."id", OLD."patientId", OLD."householdMemberId", OLD."type", OLD."granted",
          OLD."textVersion", OLD."method", OLD."reasonCode", OLD."createdAt", OLD."phoneNumber") THEN
    RETURN NEW;
  END IF;
  -- (b) a merge, inside a transaction that opened the window: ONLY who the record belongs to / who recorded it
  --     may be re-pointed. The value, type, text version, method, reason and timestamp can never change.
  IF current_setting('hoep.merge', true) = 'on'
     AND (NEW."id", NEW."type", NEW."granted", NEW."textVersion", NEW."method", NEW."reasonCode", NEW."createdAt", NEW."phoneNumber")
         IS NOT DISTINCT FROM
         (OLD."id", OLD."type", OLD."granted", OLD."textVersion", OLD."method", OLD."reasonCode", OLD."createdAt", OLD."phoneNumber") THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'consent_records is append-only: UPDATE is not allowed';
END;
$$ LANGUAGE plpgsql;
