-- CreateTable
CREATE TABLE "event_announcements" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "messageEn" TEXT NOT NULL,
    "messageEs" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_itinerary_items" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleEs" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionEs" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "sequenceOrder" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_itinerary_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "event_announcements" ADD CONSTRAINT "event_announcements_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_itinerary_items" ADD CONSTRAINT "event_itinerary_items_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
