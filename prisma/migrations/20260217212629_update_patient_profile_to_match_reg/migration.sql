/*
  Warnings:

  - You are about to drop the column `childrenAges` on the `PatientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosis` on the `PatientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `familyAdults` on the `PatientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `familyChildren` on the `PatientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `inhibitorStatus` on the `PatientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `supportInterests` on the `PatientProfile` table. All the data in the column will be lost.
  - Added the required column `communicationConsent` to the `PatientProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `diagnosisDate` to the `PatientProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergencyContactName` to the `PatientProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergencyContactPhone` to the `PatientProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergencyContactRelationship` to the `PatientProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hipaaConsent` to the `PatientProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `PatientProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `photoConsent` to the `PatientProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primaryCondition` to the `PatientProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `specialtyPharmacy` to the `PatientProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `treatingPhysician` to the `PatientProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PatientProfile" DROP COLUMN "childrenAges",
DROP COLUMN "diagnosis",
DROP COLUMN "familyAdults",
DROP COLUMN "familyChildren",
DROP COLUMN "inhibitorStatus",
DROP COLUMN "supportInterests",
ADD COLUMN     "communicationConsent" BOOLEAN NOT NULL,
ADD COLUMN     "diagnosisDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "emergencyContactName" TEXT NOT NULL,
ADD COLUMN     "emergencyContactPhone" TEXT NOT NULL,
ADD COLUMN     "emergencyContactRelationship" TEXT NOT NULL,
ADD COLUMN     "hipaaConsent" BOOLEAN NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "photoConsent" BOOLEAN NOT NULL,
ADD COLUMN     "primaryCondition" TEXT NOT NULL,
ADD COLUMN     "specialtyPharmacy" TEXT NOT NULL,
ADD COLUMN     "treatingPhysician" TEXT NOT NULL;
