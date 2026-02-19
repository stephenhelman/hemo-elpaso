/*
  Warnings:

  - You are about to drop the `CheckIn` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CheckIn" DROP CONSTRAINT "CheckIn_eventId_fkey";

-- DropForeignKey
ALTER TABLE "CheckIn" DROP CONSTRAINT "CheckIn_patientId_fkey";

-- DropTable
DROP TABLE "CheckIn";

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInBy" TEXT,
    "sessionToken" TEXT NOT NULL,
    "sessionExpiresAt" TIMESTAMP(3) NOT NULL,
    "attendeeRole" TEXT NOT NULL DEFAULT 'patient',

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsor_access_tokens" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "sponsorEmail" TEXT NOT NULL,
    "sponsorName" TEXT,
    "companyName" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsor_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_sessionToken_key" ON "check_ins"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_eventId_patientId_key" ON "check_ins"("eventId", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "sponsor_access_tokens_token_key" ON "sponsor_access_tokens"("token");

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_access_tokens" ADD CONSTRAINT "sponsor_access_tokens_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
