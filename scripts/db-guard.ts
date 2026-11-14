/**
 * Refuses destructive/dev Prisma commands against the PRODUCTION database.
 * Wired into the db:* npm scripts. Override on purpose with ALLOW_PROD_DB=yes.
 *
 * "Production" = the Neon endpoint the live site uses. Keep it in sync if the
 * production database ever moves to another endpoint.
 */
import { config } from "dotenv";
config({ path: ".env.local" }); // same precedence as prisma.config.ts and `next dev`
config();

const PRODUCTION_ENDPOINT = "ep-weathered-dream-aezg1oqp";

const url = process.env.DATABASE_URL ?? "";
let host = "(unset)";
let db = "";
try {
  const u = new URL(url);
  host = u.host;
  db = u.pathname.replace(/^\//, "");
} catch {
  /* leave defaults */
}
const isProd = host.includes(PRODUCTION_ENDPOINT);
const mode = process.argv[2]; // "whoami" prints and exits 0

console.log(`DATABASE_URL -> host: ${host}  database: ${db}  ${isProd ? "[PRODUCTION]" : "[not production]"}`);

if (mode === "whoami") process.exit(0);

if (isProd && process.env.ALLOW_PROD_DB !== "yes") {
  console.error(
    "\nRefusing to run: DATABASE_URL points at the PRODUCTION database.\n" +
      "Point .env.local at a Neon dev branch, or re-run with ALLOW_PROD_DB=yes if you really mean it\n" +
      "(only `npm run db:deploy` should ever need that).\n",
  );
  process.exit(1);
}
