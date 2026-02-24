/*
  Warnings:

  - You are about to drop the column `condition` on the `family_members` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `family_members` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisLetterKey` on the `family_members` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisLetterUploadedAt` on the `family_members` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisLetterUrl` on the `family_members` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisRejectedReason` on the `family_members` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisVerified` on the `family_members` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisVerifiedAt` on the `family_members` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisVerifiedBy` on the `family_members` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `family_members` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `family_members` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `family_members` table. All the data in the column will be lost.
  - You are about to drop the column `languagePreference` on the `patient_preferences` table. All the data in the column will be lost.
  - The `interestedTopics` column on the `patient_preferences` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `dietaryRestrictions` column on the `patient_preferences` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `diagnosisLetterKey` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisLetterUploadedAt` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisLetterUrl` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisRejectedReason` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisVerified` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisVerifiedAt` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosisVerifiedBy` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the `patient_profiles` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[migratedToPatientId]` on the table `family_members` will be added. If there are existing duplicate values, this will fail.
  - Made the column `maxTravelDistance` on table `patient_preferences` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "patient_profiles" DROP CONSTRAINT "patient_profiles_patientId_fkey";

-- AlterTable
ALTER TABLE "family_members" DROP COLUMN "condition",
DROP COLUMN "dateOfBirth",
DROP COLUMN "diagnosisLetterKey",
DROP COLUMN "diagnosisLetterUploadedAt",
DROP COLUMN "diagnosisLetterUrl",
DROP COLUMN "diagnosisRejectedReason",
DROP COLUMN "diagnosisVerified",
DROP COLUMN "diagnosisVerifiedAt",
DROP COLUMN "diagnosisVerifiedBy",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "severity",
ADD COLUMN     "migratedAt" TIMESTAMP(3),
ADD COLUMN     "migratedToPatientId" TEXT,
ADD COLUMN     "migrationEligibleAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "patient_preferences" DROP COLUMN "languagePreference",
DROP COLUMN "interestedTopics",
ADD COLUMN     "interestedTopics" TEXT[],
ALTER COLUMN "maxTravelDistance" SET NOT NULL,
ALTER COLUMN "maxTravelDistance" SET DEFAULT 30,
DROP COLUMN "dietaryRestrictions",
ADD COLUMN     "dietaryRestrictions" TEXT[];

-- AlterTable
ALTER TABLE "patients" DROP COLUMN "diagnosisLetterKey",
DROP COLUMN "diagnosisLetterUploadedAt",
DROP COLUMN "diagnosisLetterUrl",
DROP COLUMN "diagnosisRejectedReason",
DROP COLUMN "diagnosisVerified",
DROP COLUMN "diagnosisVerifiedAt",
DROP COLUMN "diagnosisVerifiedBy",
ADD COLUMN     "diagnosisGracePeriodSource" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactRelationship" TEXT;

-- DropTable
DROP TABLE "patient_profiles";

-- CreateTable
CREATE TABLE "contact_profiles" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "familyMemberId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disorder_profiles" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "familyMemberId" TEXT,
    "condition" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "dateOfDiagnosis" TIMESTAMP(3),
    "treatingPhysician" TEXT,
    "specialtyPharmacy" TEXT,
    "diagnosisLetterUrl" TEXT,
    "diagnosisLetterKey" TEXT,
    "diagnosisLetterUploadedAt" TIMESTAMP(3),
    "diagnosisVerified" BOOLEAN NOT NULL DEFAULT false,
    "diagnosisVerifiedBy" TEXT,
    "diagnosisVerifiedAt" TIMESTAMP(3),
    "diagnosisRejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disorder_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contact_profiles_patientId_key" ON "contact_profiles"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "contact_profiles_familyMemberId_key" ON "contact_profiles"("familyMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "disorder_profiles_patientId_key" ON "disorder_profiles"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "disorder_profiles_familyMemberId_key" ON "disorder_profiles"("familyMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_migratedToPatientId_key" ON "family_members"("migratedToPatientId");

-- AddForeignKey
ALTER TABLE "contact_profiles" ADD CONSTRAINT "contact_profiles_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_profiles" ADD CONSTRAINT "contact_profiles_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disorder_profiles" ADD CONSTRAINT "disorder_profiles_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disorder_profiles" ADD CONSTRAINT "disorder_profiles_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
