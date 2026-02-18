/*
  Warnings:

  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PatientProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PatientProfile" DROP CONSTRAINT "PatientProfile_patientId_fkey";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "PatientProfile";

-- CreateTable
CREATE TABLE "patient_profiles" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "primaryCondition" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "diagnosisDate" TIMESTAMP(3) NOT NULL,
    "treatingPhysician" TEXT,
    "specialtyPharmacy" TEXT,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactRelationship" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "hipaaConsent" BOOLEAN NOT NULL,
    "photoConsent" BOOLEAN NOT NULL,
    "communicationConsent" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "relationship" TEXT NOT NULL,
    "hasBleedingDisorder" BOOLEAN NOT NULL DEFAULT false,
    "condition" TEXT,
    "severity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" TEXT,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_profiles_patientId_key" ON "patient_profiles"("patientId");

-- AddForeignKey
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
