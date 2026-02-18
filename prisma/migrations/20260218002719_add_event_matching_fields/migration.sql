/*
  Warnings:

  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventTargeting` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CheckIn" DROP CONSTRAINT "CheckIn_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventInteraction" DROP CONSTRAINT "EventInteraction_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventPhoto" DROP CONSTRAINT "EventPhoto_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventQuestion" DROP CONSTRAINT "EventQuestion_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventTargeting" DROP CONSTRAINT "EventTargeting_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Rsvp" DROP CONSTRAINT "Rsvp_eventId_fkey";

-- DropTable
DROP TABLE "Event";

-- DropTable
DROP TABLE "EventTargeting";

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleEs" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionEs" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "maxCapacity" INTEGER,
    "rsvpDeadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "category" TEXT NOT NULL DEFAULT 'FAMILY_SUPPORT',
    "targetAudience" TEXT NOT NULL DEFAULT 'all',
    "language" TEXT NOT NULL DEFAULT 'both',
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_targeting" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "targetConditions" TEXT[],
    "targetSeverity" TEXT[],
    "targetAgeGroups" TEXT[],
    "targetInterests" TEXT[],
    "requireInhibitors" BOOLEAN,

    CONSTRAINT "event_targeting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "event_targeting_eventId_key" ON "event_targeting"("eventId");

-- AddForeignKey
ALTER TABLE "event_targeting" ADD CONSTRAINT "event_targeting_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInteraction" ADD CONSTRAINT "EventInteraction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventQuestion" ADD CONSTRAINT "EventQuestion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPhoto" ADD CONSTRAINT "EventPhoto_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
