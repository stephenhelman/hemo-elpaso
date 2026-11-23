-- Phase 1 (invitation log + actor type). ADDITIVE ONLY: new nullable columns and new enum values.

-- Activity log: who acted. NULL = written before this column existed (not backfilled on purpose).
ALTER TABLE "audit_logs" ADD COLUMN "actorType" TEXT;

-- Invitations: a manual removal keeps the row (status "removed") so matching never re-adds the household.
ALTER TABLE "invitations"
  ADD COLUMN "removedAt" TIMESTAMP(3),
  ADD COLUMN "removedByBoardUserId" TEXT,
  ADD COLUMN "removalReason" TEXT;

ALTER TABLE "invitations"
  ADD CONSTRAINT "invitations_removedByBoardUserId_fkey"
  FOREIGN KEY ("removedByBoardUserId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'INVITATION_MATCHED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'INVITATION_REMOVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'INVITATION_REPORT_VIEWED';
