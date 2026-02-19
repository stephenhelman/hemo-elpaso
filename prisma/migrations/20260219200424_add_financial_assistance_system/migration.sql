-- CreateEnum
CREATE TYPE "AssistanceType" AS ENUM ('EVENT_FEES', 'TRANSPORTATION', 'MEDICATION', 'MEDICAL_EQUIPMENT', 'EMERGENCY_SUPPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "AssistanceStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DENIED', 'DISBURSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisbursementStatus" AS ENUM ('PENDING', 'ISSUED', 'CASHED', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CHECK', 'CASH', 'REIMBURSEMENT');

-- CreateTable
CREATE TABLE "financial_assistance_applications" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "assistanceType" "AssistanceType" NOT NULL,
    "requestedAmount" DECIMAL(10,2) NOT NULL,
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "status" "AssistanceStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "approvedAmount" DECIMAL(10,2),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_assistance_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistance_documents" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistance_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistance_disbursements" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "checkNumber" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "cashedDate" TIMESTAMP(3),
    "status" "DisbursementStatus" NOT NULL DEFAULT 'PENDING',
    "issuedBy" TEXT NOT NULL,
    "notes" TEXT,
    "proofOfPaymentUrl" TEXT,
    "proofOfPaymentKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistance_disbursements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "financial_assistance_applications" ADD CONSTRAINT "financial_assistance_applications_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistance_documents" ADD CONSTRAINT "assistance_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "financial_assistance_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistance_disbursements" ADD CONSTRAINT "assistance_disbursements_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "financial_assistance_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
