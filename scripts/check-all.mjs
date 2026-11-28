#!/usr/bin/env node
/**
 * Every check script, one after another. Run: npm run check:all
 * Picks up each "check:*" script in package.json, so a new one is included without editing this file.
 * Scripts that touch a database keep their own guard (scripts/db-guard.ts refuses production).
 * Nothing here can use PRODUCTION file storage (lib/r2-config.ts refuses it in any check run). check:photo-pipeline and
 * check:flyer-upload write real files to a DEVELOPMENT bucket (docs/STORAGE.md) and clean up; without one their storage
 * parts are skipped and listed at the end. check:admin-pages builds the app first, so this takes a while.
 * Type checking and the production build are separate: npx tsc --noEmit, npm run build.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const scripts = Object.keys(JSON.parse(readFileSync("package.json", "utf8")).scripts)
  .filter((name) => name.startsWith("check:") && name !== "check:all");

// Arguments some checks require.
const args = { "check:photo-pipeline": () => ["--", mkdtempSync(join(tmpdir(), "hoep-photo-check-"))] };

const skipFile = join(mkdtempSync(join(tmpdir(), "hoep-checks-")), "skipped");
const env = { ...process.env, HOEP_CHECK_RUN: "1", HOEP_SKIP_FILE: skipFile };
delete env.R2_ALLOW_PROD_BUCKET;

const failed = [];
for (const name of scripts) {
  console.log(`\n=== ${name}`);
  const r = spawnSync("npm", ["run", "-s", name, ...(args[name]?.() ?? [])], { stdio: "inherit", env });
  if (r.status !== 0) failed.push(name);
}
console.log(`\n${scripts.length - failed.length} of ${scripts.length} check scripts passed.`);
if (existsSync(skipFile)) console.log(`\nSTORAGE TESTS SKIPPED (no development bucket):\n${readFileSync(skipFile, "utf8")}`);
if (failed.length) console.log(`Failed: ${failed.join(", ")}`);
process.exit(failed.length ? 1 : 0);
