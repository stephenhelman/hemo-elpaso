/*
  Warnings:

  - You are about to drop the `InteractionResponse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InteractionResponse" DROP CONSTRAINT "InteractionResponse_interactionId_fkey";

-- DropTable
DROP TABLE "InteractionResponse";

-- CreateTable
CREATE TABLE "interaction_responses" (
    "id" TEXT NOT NULL,
    "interactionId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "responseData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interaction_responses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "interaction_responses" ADD CONSTRAINT "interaction_responses_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "event_interactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
