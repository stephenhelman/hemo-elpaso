// Import this FIRST in a script: some modules read process.env when they are imported,
// and ES imports are evaluated before any code in the importing file runs.
import { config } from "dotenv";
config({ path: ".env.local" });
config();
// Check scripts NEVER send email: force capture whatever the environment says (lib/email/mode.ts). Not even "allowlist".
process.env.EMAIL_MODE = "capture";
process.env.EMAIL_OUTBOX_FILES = "0"; // tests read the in-memory outbox; no .email-outbox/ files
delete process.env.VERCEL_ENV;
// Check scripts NEVER ring a phone and never see real Twilio credentials (lib/twilio/mode.ts).
process.env.TWILIO_MODE = "capture";
for (const name of Object.keys(process.env)) if (name.startsWith("TWILIO_") && name !== "TWILIO_MODE") delete process.env[name];
delete process.env.PHONE_DATA_KEY; // checks that need it set their own
