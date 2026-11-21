/** Run: npm run check:legacy-redirects (pure). Live behaviour is proven with curl, see docs/overhaul/CUTOVER.md. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
// @ts-ignore plain ESM shared with next.config.mjs
import { LEGACY_REDIRECTS } from "./legacy-redirects.mjs";

/** Top-level route segments of the new app: every directory under src/app and src/app/(public), minus route groups. */
function routeSegments(): Set<string> {
  const out = new Set<string>();
  for (const base of ["src/app", "src/app/(public)"]) {
    for (const d of readdirSync(base)) {
      if (!statSync(join(base, d)).isDirectory() || d.startsWith("(") || d.startsWith("[")) continue;
      out.add(d);
    }
  }
  // files that are routes: robots, sitemap, manifest, icons
  ["robots.txt", "sitemap.xml", "manifest.webmanifest"].forEach((f) => out.add(f));
  return out;
}

test("no legacy source collides with a real route", () => {
  const routes = routeSegments();
  for (const [src] of LEGACY_REDIRECTS as [string, string][]) {
    const seg = src.split("/")[1];
    assert.ok(!routes.has(seg), `${src} collides with real route /${seg}`);
  }
});
test("every destination is a real route (or home) and sources are unique", () => {
  const routes = routeSegments();
  const seen = new Set<string>();
  for (const [src, dst] of LEGACY_REDIRECTS as [string, string][]) {
    assert.ok(!seen.has(src), `duplicate ${src}`);
    seen.add(src);
    assert.ok(dst === "/" || routes.has(dst.split("/")[1]), `${dst} is not a route`);
  }
});
