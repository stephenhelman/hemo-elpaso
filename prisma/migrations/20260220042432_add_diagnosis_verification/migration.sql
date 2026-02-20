-- AlterTable
ALTER TABLE "family_members" ADD COLUMN     "diagnosisLetterKey" TEXT,
ADD COLUMN     "diagnosisLetterUploadedAt" TIMESTAMP(3),
ADD COLUMN     "diagnosisLetterUrl" TEXT,
ADD COLUMN     "diagnosisRejectedReason" TEXT,
ADD COLUMN     "diagnosisVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "diagnosisVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "diagnosisVerifiedBy" TEXT;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "diagnosisGracePeriodEndsAt" TIMESTAMP(3),
ADD COLUMN     "diagnosisLetterKey" TEXT,
ADD COLUMN     "diagnosisLetterUploadedAt" TIMESTAMP(3),
ADD COLUMN     "diagnosisLetterUrl" TEXT,
ADD COLUMN     "diagnosisRejectedReason" TEXT,
ADD COLUMN     "diagnosisVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "diagnosisVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "diagnosisVerifiedBy" TEXT,
ADD COLUMN     "registrationCompletedAt" TIMESTAMP(3);
