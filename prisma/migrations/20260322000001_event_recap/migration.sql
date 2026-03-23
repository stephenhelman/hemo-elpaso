-- AlterTable: add recap fields to events
ALTER TABLE "events" ADD COLUMN "recapTitleEn" TEXT;
ALTER TABLE "events" ADD COLUMN "recapTitleEs" TEXT;
ALTER TABLE "events" ADD COLUMN "recapBodyEn" TEXT;
ALTER TABLE "events" ADD COLUMN "recapBodyEs" TEXT;
ALTER TABLE "events" ADD COLUMN "recapGalleryEmbedUrl" TEXT;
ALTER TABLE "events" ADD COLUMN "recapPublishedAt" TIMESTAMP(3);
