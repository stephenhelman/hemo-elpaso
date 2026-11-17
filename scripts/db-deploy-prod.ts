/**
 * MANUAL FALLBACK: apply pending migrations to the PRODUCTION database from your machine.
 *   npm run db:deploy
 *
 * The normal path is automatic: every Vercel Production build runs `prisma migrate deploy` (scripts/vercel-build.mjs).
 * Use this only if that is unavailable.
 *
 * Safety:
 *  - reads ONLY ./.env.production.local (git-ignored). It never uses .env.local, so a dev connection string can't be
 *    migrated by mistake and the production string never sits in the file `next dev` reads.
 *  - both DATABASE_URL and DIRECT_URL in that file must point at the production Neon endpoint.
 *  - you must type the production endpoint id to continue; needs an interactive terminal.
 */
import { existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { spawnSync } from "node:child_process";
import { parse } from "dotenv";
import endpoints from "./db-endpoints.json";

const FILE = ".env.production.local";
const PROD = endpoints.production;
const die = (m: string): never => {
  console.error(`\n${m}\n`);
  process.exit(1);
};

if (!existsSync(FILE)) {
  die(
    `${FILE} not found.\nCreate it (it is git-ignored) with the production values from Neon / Vercel:\n  DATABASE_URL="postgresql://…-pooler…/neondb?sslmode=require"\n  DIRECT_URL="postgresql://…(no -pooler)…/neondb?sslmode=require"`,
  );
}
const vars = parse(readFileSync(FILE));
const { DATABASE_URL, DIRECT_URL } = vars;
if (!DATABASE_URL || !DIRECT_URL) die(`${FILE} must define both DATABASE_URL and DIRECT_URL.`);
const host = (u: string) => { try { return new URL(u).host; } catch { return "(invalid)"; } };
if (!DATABASE_URL.includes(PROD) || !DIRECT_URL.includes(PROD)) {
  die(`${FILE} does not point at the production endpoint (${PROD}).\n  DATABASE_URL -> ${host(DATABASE_URL)}\n  DIRECT_URL   -> ${host(DIRECT_URL)}`);
}
if (/-pooler\./.test(DIRECT_URL)) die("DIRECT_URL must be the direct (non-pooled) connection string.");
if (!process.stdin.isTTY) die("This needs an interactive terminal (a typed confirmation is required).");

// Prisma gets ONLY these two variables from us; dotenv inside prisma.config.ts never overrides values already set.
const env = { ...process.env, DATABASE_URL, DIRECT_URL };

console.log(`\nTarget: PRODUCTION\n  DATABASE_URL -> ${host(DATABASE_URL)}\n  DIRECT_URL   -> ${host(DIRECT_URL)}\n`);
spawnSync("npx", ["prisma", "migrate", "status"], { stdio: "inherit", env });

(async () => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const typed = (await rl.question(`\nType the production endpoint (${PROD}) to apply pending migrations, anything else cancels: `)).trim();
  rl.close();
  if (typed !== PROD) die("Cancelled. Nothing was changed.");
  const r = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", env });
  process.exit(r.status ?? 1);
})();
