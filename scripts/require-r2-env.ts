/**
 * First step of the Vercel production build (scripts/vercel-build.mjs): stop the deploy if an R2 setting is missing or
 * malformed. The server refuses to start without them (src/instrumentation.ts), so failing here keeps the previous
 * deployment live instead of publishing one that cannot start. Prints variable names only, never values.
 */
import { readR2Config } from "../src/lib/r2-config";

try {
  readR2Config();
  console.log("R2 settings: all present.");
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
