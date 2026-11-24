-- Family page. Additive only: two new audit action values. Consent changes reuse consent_records (method 'portal').
ALTER TYPE "AuditAction" ADD VALUE 'PORTAL_VIEWED';
ALTER TYPE "AuditAction" ADD VALUE 'PORTAL_CONSENT_CHANGED';
