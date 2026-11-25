// Import this FIRST in a script: modules such as src/lib/r2.ts read process.env when they are imported,
// and ES imports are evaluated before any code in the importing file runs.
import { config } from "dotenv";
config({ path: ".env.local" });
config();
// Check scripts NEVER send email: force capture whatever the environment says (lib/email/mode.ts). Not even "allowlist".
process.env.EMAIL_MODE = "capture";
process.env.EMAIL_OUTBOX_FILES = "0"; // tests read the in-memory outbox; no .email-outbox/ files
delete process.env.VERCEL_ENV;
