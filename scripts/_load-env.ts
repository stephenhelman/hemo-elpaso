// Import this FIRST in a script: modules such as src/lib/r2.ts read process.env when they are imported,
// and ES imports are evaluated before any code in the importing file runs.
import { config } from "dotenv";
config({ path: ".env.local" });
config();
