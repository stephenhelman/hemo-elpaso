-- SCHEMA-004: SponsorStatus enum, extend Sponsor + VolunteerProfile, new AuditAction values

-- 1. Create SponsorStatus enum
CREATE TYPE "SponsorStatus" AS ENUM ('INQUIRED', 'CONTACTED', 'ACTIVE', 'INACTIVE', 'DECLINED');

-- 2. Add inquiry fields to sponsors
ALTER TABLE "sponsors"
  ADD COLUMN "status"             "SponsorStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "contactName"        TEXT,
  ADD COLUMN "contactEmail"       TEXT,
  ADD COLUMN "contactPhone"       TEXT,
  ADD COLUMN "interestedTier"     TEXT,
  ADD COLUMN "estimatedDonation"  TEXT,
  ADD COLUMN "inquiryMessage"     TEXT,
  ADD COLUMN "inquirySubmittedAt" TIMESTAMP(3);

-- 3. Make patientId nullable on volunteer_profiles (community volunteers have no patient account)
ALTER TABLE "volunteer_profiles"
  ALTER COLUMN "patientId" DROP NOT NULL;

-- 4. Add contact + interest fields to volunteer_profiles
ALTER TABLE "volunteer_profiles"
  ADD COLUMN "contactName"      TEXT,
  ADD COLUMN "contactEmail"     TEXT,
  ADD COLUMN "contactPhone"     TEXT,
  ADD COLUMN "areasOfInterest"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "whyVolunteer"     TEXT,
  ADD COLUMN "hasBDConnection"  BOOLEAN NOT NULL DEFAULT false;

-- 5. Add new AuditAction enum values
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SPONSOR_INQUIRY_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'VOLUNTEER_PROFILE_LINKED';
