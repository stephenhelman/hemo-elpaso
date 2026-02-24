-- AlterTable
ALTER TABLE "patient_profiles" ALTER COLUMN "primaryCondition" DROP NOT NULL,
ALTER COLUMN "severity" DROP NOT NULL,
ALTER COLUMN "diagnosisDate" DROP NOT NULL;
