/*
  Warnings:

  - You are about to drop the column `adultsAttending` on the `Rsvp` table. All the data in the column will be lost.
  - You are about to drop the column `childrenAttending` on the `Rsvp` table. All the data in the column will be lost.
  - Added the required column `attendeeCount` to the `Rsvp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Rsvp" DROP COLUMN "adultsAttending",
DROP COLUMN "childrenAttending",
ADD COLUMN     "attendeeCount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "createdBy" TEXT;

-- CreateTable
CREATE TABLE "polls" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "questionEn" TEXT NOT NULL,
    "questionEs" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_options" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "textEs" TEXT NOT NULL,

    CONSTRAINT "poll_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_responses" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "selectedOptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "poll_responses_pollId_sessionToken_key" ON "poll_responses"("pollId", "sessionToken");

-- AddForeignKey
ALTER TABLE "polls" ADD CONSTRAINT "polls_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_responses" ADD CONSTRAINT "poll_responses_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
