/*
  Warnings:

  - You are about to drop the column `conversionJobId` on the `event_presentations` table. All the data in the column will be lost.
  - You are about to drop the column `conversionStatus` on the `event_presentations` table. All the data in the column will be lost.
  - You are about to drop the column `originalFileKey` on the `event_presentations` table. All the data in the column will be lost.
  - You are about to drop the column `originalFileName` on the `event_presentations` table. All the data in the column will be lost.
  - You are about to drop the column `originalFileUrl` on the `event_presentations` table. All the data in the column will be lost.
  - You are about to drop the column `slideUrls` on the `event_presentations` table. All the data in the column will be lost.
  - You are about to drop the column `totalSlides` on the `event_presentations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "event_presentations" DROP COLUMN "conversionJobId",
DROP COLUMN "conversionStatus",
DROP COLUMN "originalFileKey",
DROP COLUMN "originalFileName",
DROP COLUMN "originalFileUrl",
DROP COLUMN "slideUrls",
DROP COLUMN "totalSlides",
ADD COLUMN     "conversionJobIdEn" TEXT,
ADD COLUMN     "conversionJobIdEs" TEXT,
ADD COLUMN     "conversionStatusEn" TEXT NOT NULL DEFAULT 'done',
ADD COLUMN     "conversionStatusEs" TEXT NOT NULL DEFAULT 'done',
ADD COLUMN     "originalFileKeyEn" TEXT,
ADD COLUMN     "originalFileKeyEs" TEXT,
ADD COLUMN     "originalFileNameEn" TEXT,
ADD COLUMN     "originalFileNameEs" TEXT,
ADD COLUMN     "originalFileUrlEn" TEXT,
ADD COLUMN     "originalFileUrlEs" TEXT,
ADD COLUMN     "slideUrlsEn" TEXT[],
ADD COLUMN     "slideUrlsEs" TEXT[],
ADD COLUMN     "totalSlidesEn" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSlidesEs" INTEGER NOT NULL DEFAULT 0;
