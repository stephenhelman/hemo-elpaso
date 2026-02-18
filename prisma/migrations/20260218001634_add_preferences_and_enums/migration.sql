-- CreateEnum
CREATE TYPE "EventTopic" AS ENUM ('EDUCATION', 'SOCIAL', 'FUNDRAISING', 'ADVOCACY', 'YOUTH', 'FAMILY_SUPPORT', 'MEDICAL_UPDATE', 'FINANCIAL_ASSISTANCE');

-- CreateEnum
CREATE TYPE "DietaryRestriction" AS ENUM ('NONE', 'VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'DAIRY_FREE', 'NUT_ALLERGY', 'HALAL', 'KOSHER', 'OTHER');

-- CreateTable
CREATE TABLE "patient_preferences" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "interestedTopics" "EventTopic"[],
    "preferredEventTimes" TEXT[],
    "maxTravelDistance" INTEGER,
    "dietaryRestrictions" "DietaryRestriction"[],
    "accessibilityNeeds" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "languagePreference" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_preferences_patientId_key" ON "patient_preferences"("patientId");

-- AddForeignKey
ALTER TABLE "patient_preferences" ADD CONSTRAINT "patient_preferences_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
