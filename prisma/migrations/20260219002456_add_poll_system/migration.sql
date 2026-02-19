/*
  Warnings:

  - You are about to drop the `EventInteraction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventInteraction" DROP CONSTRAINT "EventInteraction_eventId_fkey";

-- DropForeignKey
ALTER TABLE "InteractionResponse" DROP CONSTRAINT "InteractionResponse_interactionId_fkey";

-- DropTable
DROP TABLE "EventInteraction";

-- CreateTable
CREATE TABLE "event_interactions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleEs" TEXT NOT NULL,
    "options" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "sequenceOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poll_creation_tokens" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "repEmail" TEXT NOT NULL,
    "repName" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poll_creation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "poll_creation_tokens_token_key" ON "poll_creation_tokens"("token");

-- AddForeignKey
ALTER TABLE "event_interactions" ADD CONSTRAINT "event_interactions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poll_creation_tokens" ADD CONSTRAINT "poll_creation_tokens_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionResponse" ADD CONSTRAINT "InteractionResponse_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "event_interactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
