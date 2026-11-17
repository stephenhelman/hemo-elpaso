-- Gallery: localized captions, thumbnails, dimensions, ordering, and an event cover photo. Additive only.
ALTER TABLE "event_photos" ADD COLUMN "captionEs" TEXT;
ALTER TABLE "event_photos" ADD COLUMN "thumbUrl" TEXT;
ALTER TABLE "event_photos" ADD COLUMN "thumbKey" TEXT;
ALTER TABLE "event_photos" ADD COLUMN "width" INTEGER;
ALTER TABLE "event_photos" ADD COLUMN "height" INTEGER;
ALTER TABLE "event_photos" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "events" ADD COLUMN "coverPhotoId" TEXT;

-- Existing photos keep their upload order.
UPDATE "event_photos" p
SET "sortOrder" = r.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "eventId" ORDER BY "uploadedAt", id) AS rn
  FROM "event_photos"
) r
WHERE p.id = r.id;

CREATE INDEX "event_photos_eventId_approved_sortOrder_idx" ON "event_photos"("eventId", "approved", "sortOrder");
