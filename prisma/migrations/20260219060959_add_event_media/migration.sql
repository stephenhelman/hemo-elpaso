/*
  Warnings:

  - You are about to drop the `EventPhoto` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventPhoto" DROP CONSTRAINT "EventPhoto_eventId_fkey";

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "flyerEnUrl" TEXT,
ADD COLUMN     "flyerEsUrl" TEXT;

-- DropTable
DROP TABLE "EventPhoto";

-- CreateTable
CREATE TABLE "event_photos" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "caption" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event_photos" ADD CONSTRAINT "event_photos_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
