-- ============================================================
-- SCHEMA-001: Family system
-- SCHEMA-002: Volunteer system
-- ============================================================

-- ============================================================
-- NEW ENUMS
-- ============================================================

CREATE TYPE "AgeTier" AS ENUM ('RECORD_ONLY', 'YOUTH', 'ADULT');

CREATE TYPE "FamilyMembershipStatus" AS ENUM ('ACTIVE', 'PENDING_INVITE', 'DETACHED');

CREATE TYPE "BoardApprovalType" AS ENUM ('FAMILY_DETACHMENT', 'VOLUNTEER_APPROVAL', 'ROLE_ASSIGNMENT');

CREATE TYPE "BoardApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

CREATE TYPE "VolunteerStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'INACTIVE', 'REJECTED');

CREATE TYPE "VolunteerEventRole" AS ENUM ('CHECK_IN_STAFF', 'REGISTRATION_TABLE', 'SETUP_CREW', 'TEARDOWN_CREW', 'HOSPITALITY', 'ACTIVITIES', 'GENERAL_SUPPORT', 'OTHER');

-- ============================================================
-- ENUM ADDITIONS — AuditAction
-- ============================================================

ALTER TYPE "AuditAction" ADD VALUE 'RSVP_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'CHECKIN_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'CHECKOUT_RECORDED';
ALTER TYPE "AuditAction" ADD VALUE 'FAMILY_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'FAMILY_MEMBER_INVITED';
ALTER TYPE "AuditAction" ADD VALUE 'FAMILY_MEMBER_JOINED';
ALTER TYPE "AuditAction" ADD VALUE 'FAMILY_MEMBER_DETACHED';
ALTER TYPE "AuditAction" ADD VALUE 'FAMILY_DETACHMENT_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'FAMILY_DETACHMENT_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'BOARD_APPROVAL_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'BOARD_APPROVAL_GRANTED';
ALTER TYPE "AuditAction" ADD VALUE 'BOARD_APPROVAL_DENIED';
ALTER TYPE "AuditAction" ADD VALUE 'VOLUNTEER_REQUEST_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE 'VOLUNTEER_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'VOLUNTEER_REJECTED';
ALTER TYPE "AuditAction" ADD VALUE 'VOLUNTEER_ASSIGNED_TO_EVENT';
ALTER TYPE "AuditAction" ADD VALUE 'VOLUNTEER_ROLE_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'VOLUNTEER_CHECKED_IN';
ALTER TYPE "AuditAction" ADD VALUE 'VOLUNTEER_CHECKED_OUT';
ALTER TYPE "AuditAction" ADD VALUE 'TIMECARD_ADJUSTED';

-- ============================================================
-- ENUM ADDITIONS — EmailTemplateType
-- ============================================================

ALTER TYPE "EmailTemplateType" ADD VALUE 'VOLUNTEER_REQUEST_RECEIVED';
ALTER TYPE "EmailTemplateType" ADD VALUE 'VOLUNTEER_REQUEST_NOTIFY';
ALTER TYPE "EmailTemplateType" ADD VALUE 'VOLUNTEER_APPROVED';
ALTER TYPE "EmailTemplateType" ADD VALUE 'VOLUNTEER_ASSIGNED';

-- ============================================================
-- MODIFY EXISTING TABLES
-- ============================================================

-- DisorderProfile: make severity optional
ALTER TABLE "disorder_profiles" ALTER COLUMN "severity" DROP NOT NULL;

-- CheckIn: new fields
ALTER TABLE "check_ins" ADD COLUMN "checkOutTime" TIMESTAMP(3);
ALTER TABLE "check_ins" ADD COLUMN "familyMembershipIds" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "check_ins" ADD COLUMN "timecardId" TEXT;

-- Rsvp: new fields
ALTER TABLE "Rsvp" ADD COLUMN "familyId" TEXT;
ALTER TABLE "Rsvp" ADD COLUMN "familyMembershipIds" TEXT[] NOT NULL DEFAULT '{}';

-- Patient: new fields
ALTER TABLE "patients" ADD COLUMN "wantsToVolunteer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patients" ADD COLUMN "volunteerRequestedAt" TIMESTAMP(3);

-- AnnualReport: volunteer hours
ALTER TABLE "annual_reports" ADD COLUMN "totalVolunteerHours" DECIMAL(8,2) NOT NULL DEFAULT 0;

-- ============================================================
-- NEW TABLES
-- ============================================================

-- Family
CREATE TABLE "families" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryPatientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- BoardApproval
CREATE TABLE "board_approvals" (
    "id" TEXT NOT NULL,
    "type" "BoardApprovalType" NOT NULL,
    "status" "BoardApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,

    CONSTRAINT "board_approvals_pkey" PRIMARY KEY ("id")
);

-- FamilyMembership
CREATE TABLE "family_memberships" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "patientId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "relationship" TEXT NOT NULL,
    "ageTier" "AgeTier" NOT NULL DEFAULT 'RECORD_ONLY',
    "status" "FamilyMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "inviteEmail" TEXT,
    "inviteSentAt" TIMESTAMP(3),
    "inviteAcceptedAt" TIMESTAMP(3),
    "parentalConsentGiven" BOOLEAN NOT NULL DEFAULT false,
    "parentalConsentAt" TIMESTAMP(3),
    "parentalConsentBy" TEXT,
    "hasBleedingDisorder" BOOLEAN NOT NULL DEFAULT false,
    "disorderCondition" TEXT,
    "disorderSeverity" TEXT,
    "diagnosisLetterUrl" TEXT,
    "diagnosisLetterKey" TEXT,
    "diagnosisVerified" BOOLEAN NOT NULL DEFAULT false,
    "diagnosisVerifiedBy" TEXT,
    "diagnosisVerifiedAt" TIMESTAMP(3),
    "detachedAt" TIMESTAMP(3),
    "detachedBy" TEXT,
    "detachReason" TEXT,
    "boardApprovalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_memberships_pkey" PRIMARY KEY ("id")
);

-- VolunteerProfile
CREATE TABLE "volunteer_profiles" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" "VolunteerStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "internalNotes" TEXT,
    "generalAvailability" JSONB,
    "skills" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_profiles_pkey" PRIMARY KEY ("id")
);

-- VolunteerApplication
CREATE TABLE "volunteer_applications" (
    "id" TEXT NOT NULL,
    "volunteerProfileId" TEXT NOT NULL,
    "whyVolunteering" TEXT,
    "skills" TEXT,
    "availability" TEXT,
    "priorExperience" TEXT,
    "references" JSONB,
    "submittedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,

    CONSTRAINT "volunteer_applications_pkey" PRIMARY KEY ("id")
);

-- VolunteerEventAssignment
CREATE TABLE "volunteer_event_assignments" (
    "id" TEXT NOT NULL,
    "volunteerProfileId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "role" "VolunteerEventRole" NOT NULL DEFAULT 'GENERAL_SUPPORT',
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessToken" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "volunteer_event_assignments_pkey" PRIMARY KEY ("id")
);

-- VolunteerTimecard
CREATE TABLE "volunteer_timecards" (
    "id" TEXT NOT NULL,
    "volunteerProfileId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),
    "totalHours" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'active',
    "adjustedBy" TEXT,
    "adjustedAt" TIMESTAMP(3),
    "adjustmentNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_timecards_pkey" PRIMARY KEY ("id")
);

-- VolunteerTimecardRole
CREATE TABLE "volunteer_timecard_roles" (
    "id" TEXT NOT NULL,
    "timecardId" TEXT NOT NULL,
    "role" "VolunteerEventRole" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "assignedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "volunteer_timecard_roles_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- UNIQUE CONSTRAINTS
-- ============================================================

CREATE UNIQUE INDEX "families_primaryPatientId_key" ON "families"("primaryPatientId");
CREATE UNIQUE INDEX "volunteer_profiles_patientId_key" ON "volunteer_profiles"("patientId");
CREATE UNIQUE INDEX "volunteer_event_assignments_accessToken_key" ON "volunteer_event_assignments"("accessToken");
CREATE UNIQUE INDEX "volunteer_event_assignments_volunteerProfileId_eventId_key" ON "volunteer_event_assignments"("volunteerProfileId", "eventId");

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX "board_approvals_status_idx" ON "board_approvals"("status");
CREATE INDEX "board_approvals_type_idx" ON "board_approvals"("type");
CREATE INDEX "family_memberships_familyId_idx" ON "family_memberships"("familyId");
CREATE INDEX "family_memberships_patientId_idx" ON "family_memberships"("patientId");
CREATE INDEX "family_memberships_status_idx" ON "family_memberships"("status");
CREATE INDEX "volunteer_profiles_status_idx" ON "volunteer_profiles"("status");

-- ============================================================
-- FOREIGN KEYS
-- ============================================================

-- families.primaryPatientId -> patients.id
ALTER TABLE "families" ADD CONSTRAINT "families_primaryPatientId_fkey"
    FOREIGN KEY ("primaryPatientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- family_memberships.familyId -> families.id
ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- family_memberships.patientId -> patients.id (SetNull on delete)
ALTER TABLE "family_memberships" ADD CONSTRAINT "family_memberships_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rsvp.familyId -> families.id (SetNull on delete)
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- volunteer_profiles.patientId -> patients.id
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- volunteer_applications.volunteerProfileId -> volunteer_profiles.id
ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_volunteerProfileId_fkey"
    FOREIGN KEY ("volunteerProfileId") REFERENCES "volunteer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- volunteer_event_assignments.volunteerProfileId -> volunteer_profiles.id
ALTER TABLE "volunteer_event_assignments" ADD CONSTRAINT "volunteer_event_assignments_volunteerProfileId_fkey"
    FOREIGN KEY ("volunteerProfileId") REFERENCES "volunteer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- volunteer_event_assignments.eventId -> events.id
ALTER TABLE "volunteer_event_assignments" ADD CONSTRAINT "volunteer_event_assignments_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- volunteer_timecards.volunteerProfileId -> volunteer_profiles.id
ALTER TABLE "volunteer_timecards" ADD CONSTRAINT "volunteer_timecards_volunteerProfileId_fkey"
    FOREIGN KEY ("volunteerProfileId") REFERENCES "volunteer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- volunteer_timecards.eventId -> events.id
ALTER TABLE "volunteer_timecards" ADD CONSTRAINT "volunteer_timecards_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- volunteer_timecard_roles.timecardId -> volunteer_timecards.id
ALTER TABLE "volunteer_timecard_roles" ADD CONSTRAINT "volunteer_timecard_roles_timecardId_fkey"
    FOREIGN KEY ("timecardId") REFERENCES "volunteer_timecards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
