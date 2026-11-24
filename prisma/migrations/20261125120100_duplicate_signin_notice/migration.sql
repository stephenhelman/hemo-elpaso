-- New email kind for the "a sign-in matched more than one household" officer notice. Additive only.
ALTER TYPE "EmailTemplateType" ADD VALUE 'DUPLICATE_SIGNIN_NOTICE';
