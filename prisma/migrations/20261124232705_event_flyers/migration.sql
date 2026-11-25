-- Event flyers in each family's language + flyer delivery preference. Additive only.
--  * events.flyerEnAlt / flyerEsAlt: short description of each flyer (alt text in the invitation email).
--  * patients.flyerDelivery: email | mail | none.
--    Backfill (existing households): email if there is one, else mail if the address is complete and structured, else none.
--  * two audit actions.

ALTER TYPE "AuditAction" ADD VALUE 'FLYER_DELIVERY_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'FLYER_MAILING_EXPORTED';

ALTER TABLE "events" ADD COLUMN "flyerEnAlt" TEXT;
ALTER TABLE "events" ADD COLUMN "flyerEsAlt" TEXT;

ALTER TABLE "patients" ADD COLUMN "flyerDelivery" TEXT NOT NULL DEFAULT 'email';
ALTER TABLE "patients" ADD CONSTRAINT "patients_flyerDelivery_check" CHECK ("flyerDelivery" IN ('email', 'mail', 'none'));

UPDATE "patients" p SET "flyerDelivery" = CASE
  WHEN p."email" IS NOT NULL AND btrim(p."email") <> '' THEN 'email'
  WHEN EXISTS (
    SELECT 1 FROM "contact_profiles" c
    WHERE c."patientId" = p."id"
      AND btrim(coalesce(c."addressLine1", '')) <> ''
      AND btrim(coalesce(c."city", '')) <> ''
      AND btrim(coalesce(c."state", '')) <> ''
      AND coalesce(c."zipCode", '') ~ '^[0-9]{5}$'
  ) THEN 'mail'
  ELSE 'none'
END;
