-- Audit action for patient edits that aren't user/profile changes (e.g. "Not a duplicate"). Additive.
ALTER TYPE "AuditAction" ADD VALUE 'PATIENT_UPDATED';
