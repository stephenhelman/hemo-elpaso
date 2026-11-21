/**
 * Run: npm run check:host-redirects (pure; no DB, no server).
 * The live behaviour (old host -> 308, /brand and /api/checkin-qr served) is proven by curl against `next start`:
 * see docs/overhaul/CUTOVER.md "Smoke test".
 */
import assert from "node:assert/strict";
import { test } from "node:test";
// @ts-ignore plain ESM module shared with next.config.mjs
import { hostRedirects, KEEP_ON_OLD_HOST } from "./host-redirects.mjs";
import { siteUrl } from "../src/lib/site";

test("canonical hemoelpaso.org: old hosts and www redirect (308), query kept by Next", () => {
  const r = hostRedirects("https://hemoelpaso.org");
  assert.equal(r.length, 3);
  assert.ok(r.every((x: any) => x.permanent === true && x.destination.startsWith("https://hemoelpaso.org")));
  assert.ok(r[0].source.includes("(?!brand/|api/checkin-qr/)"));
  assert.deepEqual(KEEP_ON_OLD_HOST, ["brand/", "api/checkin-qr/"]);
});
test("no redirects for localhost, previews, www canonical or junk", () => {
  for (const u of ["http://localhost:3000", "https://hoep-git-x.vercel.app", "https://www.hemoelpaso.org", "", "nope"])
    assert.deepEqual(hostRedirects(u), [], u);
});
test("siteUrl: SITE_URL wins, BASE_URL fallback, production throws, preview uses VERCEL_URL", () => {
  const keep = { ...process.env };
  const set = (o: Record<string, string | undefined>) => {
    for (const k of ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_BASE_URL", "VERCEL_ENV", "VERCEL_URL"]) delete process.env[k];
    Object.entries(o).forEach(([k, v]) => v !== undefined && ((process.env as any)[k] = v));
  };
  try {
    set({ NEXT_PUBLIC_SITE_URL: "https://hemoelpaso.org/", NEXT_PUBLIC_BASE_URL: "https://old.example" });
    assert.equal(siteUrl(), "https://hemoelpaso.org");
    set({ NEXT_PUBLIC_BASE_URL: "https://old.example" });
    assert.equal(siteUrl(), "https://old.example");
    set({ VERCEL_ENV: "production", VERCEL_URL: "x.vercel.app" });
    assert.throws(() => siteUrl(), /NEXT_PUBLIC_SITE_URL/);
    set({ VERCEL_ENV: "preview", VERCEL_URL: "x.vercel.app" });
    assert.equal(siteUrl(), "https://x.vercel.app");
    set({});
    assert.equal(siteUrl(), "http://localhost:3000");
  } finally {
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, keep);
  }
});
