#!/usr/bin/env node
/**
 * Every check script, one after another. Run: npm run check:all
 * Picks up each "check:*" script in package.json, so a new one is included without editing this file.
 * Scripts that touch a database keep their own guard (scripts/db-guard.ts refuses production).
 * check:photo-pipeline and check:flyer-upload write to R2 (and clean up); check:admin-pages builds the app first, so this takes a while.
 * Type checking and the production build are separate: npx tsc --noEmit, npm run build.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const scripts = Object.keys(JSON.parse(readFileSync("package.json", "utf8")).scripts)
  .filter((name) => name.startsWith("check:") && name !== "check:all");

// Arguments some checks require.
const args = { "check:photo-pipeline": () => ["--", mkdtempSync(join(tmpdir(), "hoep-photo-check-"))] };

const failed = [];
for (const name of scripts) {
  console.log(`\n=== ${name}`);
  const r = spawnSync("npm", ["run", "-s", name, ...(args[name]?.() ?? [])], { stdio: "inherit" });
  if (r.status !== 0) failed.push(name);
}
console.log(`\n${scripts.length - failed.length} of ${scripts.length} check scripts passed.`);
if (failed.length) console.log(`Failed: ${failed.join(", ")}`);
process.exit(failed.length ? 1 : 0);
