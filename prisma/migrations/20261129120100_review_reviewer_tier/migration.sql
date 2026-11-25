-- Reviewer tier (permission canReviewRegistrations). Additive only: two audit actions. The permission itself needs no
-- row: the matrix starts from the code defaults (SECRETARY, TREASURER) and overlays stored cells.
ALTER TYPE "AuditAction" ADD VALUE 'REVIEWER_VIEWED';
ALTER TYPE "AuditAction" ADD VALUE 'REVIEW_NEEDS_MERGE_FLAGGED';
