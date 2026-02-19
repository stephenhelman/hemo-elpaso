/*
  Warnings:

  - You are about to drop the column `usedAt` on the `poll_creation_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "poll_creation_tokens" DROP COLUMN "usedAt";
