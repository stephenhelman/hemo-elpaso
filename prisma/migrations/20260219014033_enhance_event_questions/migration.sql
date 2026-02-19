/*
  Warnings:

  - You are about to drop the column `answer` on the `EventQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `EventQuestion` table. All the data in the column will be lost.
  - Added the required column `questionEn` to the `EventQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionEs` to the `EventQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionToken` to the `EventQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `EventQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EventQuestion" DROP COLUMN "answer",
DROP COLUMN "question",
ADD COLUMN     "answerEn" TEXT,
ADD COLUMN     "answerEs" TEXT,
ADD COLUMN     "answeredAt" TIMESTAMP(3),
ADD COLUMN     "answeredBy" TEXT,
ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalLang" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "patientId" TEXT,
ADD COLUMN     "patientName" TEXT,
ADD COLUMN     "questionEn" TEXT NOT NULL,
ADD COLUMN     "questionEs" TEXT NOT NULL,
ADD COLUMN     "sessionToken" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "upvotedBy" TEXT[] DEFAULT ARRAY[]::TEXT[];
