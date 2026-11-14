/**
 * Upserts the email template catalogue (email_templates). Idempotent and safe on
 * any database: touches ONLY that table, no mock data.
 *
 *   npm run db:seed-templates          (dev DB; refuses production)
 *   ALLOW_PROD_DB=yes npx tsx scripts/db-guard.ts whoami && ALLOW_PROD_DB=yes npx tsx scripts/seed-templates.ts   (production, on purpose)
 *
 * Run after any database reset/restore. Note: update overwrites name/subject/
 * enabled with the seed values.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { seedEmailTemplates } from "../prisma/seeds/email-templates";

seedEmailTemplates()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
