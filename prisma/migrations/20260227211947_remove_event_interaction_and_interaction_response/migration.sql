/*
  Warnings:

  - You are about to drop the `event_interactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `interaction_responses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "event_interactions" DROP CONSTRAINT "event_interactions_eventId_fkey";

-- DropForeignKey
ALTER TABLE "interaction_responses" DROP CONSTRAINT "interaction_responses_interactionId_fkey";

-- DropTable
DROP TABLE "event_interactions";

-- DropTable
DROP TABLE "interaction_responses";
