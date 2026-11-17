-- Audit action for approving / unapproving an event photo (the privacy gate). Additive.
ALTER TYPE "AuditAction" ADD VALUE 'EVENT_PHOTO_APPROVAL_CHANGED';
