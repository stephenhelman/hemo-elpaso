-- CreateTable: sponsors
CREATE TABLE "sponsors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoKey" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'PARTNER',
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateTable: event_sponsors
CREATE TABLE "event_sponsors" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,

    CONSTRAINT "event_sponsors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_sponsors_eventId_sponsorId_key" ON "event_sponsors"("eventId", "sponsorId");
CREATE INDEX "event_sponsors_eventId_idx" ON "event_sponsors"("eventId");
CREATE INDEX "event_sponsors_sponsorId_idx" ON "event_sponsors"("sponsorId");

-- AddForeignKey
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_sponsorId_fkey"
    FOREIGN KEY ("sponsorId") REFERENCES "sponsors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
