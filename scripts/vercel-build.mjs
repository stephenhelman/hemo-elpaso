#!/usr/bin/env node
/**
 * Vercel Build Command (see vercel.json).  Plain Node on purpose: no TypeScript runner needed at build time.
 *
 *   VERCEL_ENV=production          prisma migrate deploy -> prisma generate -> legal placeholder check (--db) -> next build
 *   anything else (preview,
 *   development, unset/local)      prisma generate -> legal placeholder check (static) -> next build   (NO migrations, ever)
 *
 * A failed `migrate deploy` fails the build, so a deploy never goes live on a schema it was not built for.
 * Preview deployments never touch a database schema: apply migrations to the dev branch yourself with
 * `npm run db:migrate` (see docs/DATABASE.md).
 *
 * Safety nets:
 *   - production: DATABASE_URL and DIRECT_URL must both be set (migrations need the direct, non-pooled connection).
 *   - non-production: refuses to build if DATABASE_URL or DIRECT_URL points at the production Neon endpoint
 *     (a preview must not run against production data). Override on purpose with ALLOW_PREVIEW_PROD_DB=yes.
 * VERCEL_BUILD_DRY_RUN=1 prints the plan and runs nothing (used to test this script).
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PROD_ENDPOINT = JSON.parse(readFileSync(new URL("./db-endpoints.json", import.meta.url), "utf8")).production;
const vercelEnv = process.env.VERCEL_ENV || "";
const isProduction = vercelEnv === "production";
const dry = process.env.VERCEL_BUILD_DRY_RUN === "1";
const label = vercelEnv || "(unset: local build)";

const log = (msg) => console.log(`[vercel-build] ${msg}`);
const fail = (msg) => {
  console.error(`[vercel-build] ERROR: ${msg}`);
  process.exit(1);
};
const hostOf = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return "(unset or invalid)";
  }
};

log(`VERCEL_ENV=${label}  branch=${process.env.VERCEL_GIT_COMMIT_REF || "(n/a)"}  commit=${(process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || "(n/a)"}`);
log(`DATABASE_URL host: ${hostOf(process.env.DATABASE_URL)}`);
log(`DIRECT_URL   host: ${hostOf(process.env.DIRECT_URL)}`);

if (isProduction) {
  if (!process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_BASE_URL) fail("NEXT_PUBLIC_SITE_URL is not set for Production (the public site URL, e.g. https://hemoelpaso.org).");
  if (!process.env.DATABASE_URL) fail("DATABASE_URL is not set for Production.");
  if (!process.env.DIRECT_URL) fail("DIRECT_URL is not set for Production (the non-pooled Neon connection string; migrations need it).");
  if (/-pooler\./.test(process.env.DIRECT_URL)) fail("DIRECT_URL points at a pooled (-pooler) host. Use the direct connection string.");
  if (!process.env.DIRECT_URL.includes(PROD_ENDPOINT) || !process.env.DATABASE_URL.includes(PROD_ENDPOINT)) {
    fail(`Production DATABASE_URL/DIRECT_URL do not point at the production endpoint (${PROD_ENDPOINT}). Refusing to migrate an unexpected database.`);
  }
} else if (process.env.ALLOW_PREVIEW_PROD_DB !== "yes") {
  for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
    if ((process.env[name] || "").includes(PROD_ENDPOINT)) {
      fail(`${name} points at the PRODUCTION database in a non-production build (VERCEL_ENV=${label}). Set the Preview value to the dev branch.`);
    }
  }
}

const steps = isProduction
  ? [["npx", ["prisma", "migrate", "deploy"]], ["npx", ["prisma", "generate"]], ["npx", ["tsx", "scripts/check-legal-placeholders.ts", "--db"]], ["npx", ["next", "build"]]]
  : [["npx", ["prisma", "generate"]], ["npx", ["tsx", "scripts/check-legal-placeholders.ts"]], ["npx", ["next", "build"]]];

log(isProduction ? "PATH: production -> prisma migrate deploy, prisma generate, legal placeholder check (reads feature toggles), next build" : "PATH: non-production -> SKIPPING prisma migrate deploy; prisma generate, legal placeholder check (static), next build");

for (const [cmd, args] of steps) {
  const line = `${cmd} ${args.join(" ")}`;
  if (dry) {
    log(`(dry run) would run: ${line}`);
    continue;
  }
  log(`running: ${line}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", env: process.env });
  if (r.status !== 0) fail(`"${line}" failed (exit ${r.status ?? r.signal}). Build stopped.`);
}
log("done");
