/**
 * Refuses destructive/dev Prisma commands against the PRODUCTION database.
 * Wired into the db:* npm scripts. Override on purpose with ALLOW_PROD_DB=yes (not needed for migrations:
 * those run on Vercel, or via `npm run db:deploy`, which has its own typed confirmation).
 *
 * "Production" = the Neon endpoint the live site uses. Keep it in sync if the
 * production database ever moves to another endpoint.
 */
import { config } from "dotenv";
config({ path: ".env.local" }); // same precedence as prisma.config.ts and `next dev`
config();

import endpoints from "./db-endpoints.json";
const PRODUCTION_ENDPOINT = endpoints.production;

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
// `prisma migrate` talks to DIRECT_URL when it is set, so that one must not be production either.
const directHost = (() => { try { return new URL(process.env.DIRECT_URL ?? "").host; } catch { return ""; } })();
const isProd = host.includes(PRODUCTION_ENDPOINT) || directHost.includes(PRODUCTION_ENDPOINT);
const mode = process.argv[2]; // "whoami" prints and exits 0

console.log(`DATABASE_URL -> host: ${host}  database: ${db}  ${isProd ? "[PRODUCTION]" : "[not production]"}`);
console.log(`DIRECT_URL   -> host: ${directHost || "(unset)"}`);

if (mode === "whoami") process.exit(0);

if (isProd && process.env.ALLOW_PROD_DB !== "yes") {
  console.error(
    "\nRefusing to run: DATABASE_URL or DIRECT_URL points at the PRODUCTION database.\n" +
      "Point .env.local at a Neon dev branch, or re-run with ALLOW_PROD_DB=yes if you really mean it\n" +
      "(production migrations run automatically on Vercel; `npm run db:deploy` is the manual fallback and does not use this guard).\n",
  );
  process.exit(1);
}
