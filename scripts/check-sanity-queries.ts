/**
 * Offline check (no network, no token): runs the real GROQ queries against the
 * seed documents with groq-js and asserts that
 *   1. the seeded Scholarships page equals the dictionary fallback (the live page today);
 *   2. inactive people are hidden.
 *   npm run check:sanity
 */
import { parse, evaluate } from "groq-js";
import { docs } from "./seed-sanity";
import { scholarshipsPageQuery } from "../src/sanity/queries/scholarships";
import { scholarshipsPageFallback } from "../src/sanity/fallback";

const run = async (q: string, dataset: any[]) => (await (await evaluate(parse(q), { dataset })).get()) as any;
// Drop nulls/_key/_id and reduce people to what the page shows, so "absent" equals "null".
const sortKeys = (x: any): any =>
  Array.isArray(x) ? x.map(sortKeys) : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, sortKeys(x[k])])) : x;
const norm = (x: any): any =>
  sortKeys(JSON.parse(
    JSON.stringify(x, (k, v) => {
      if (k === "_key" || k === "_id" || v === null) return undefined;
      if (k === "people" && Array.isArray(v)) return v.map((p: any) => ({ name: p.name, group: p.group, office: p.office }));
      return v;
    }),
  ));

(async () => {
  let ok = true;
  const seeded = await run(scholarshipsPageQuery, docs);
  const fb = scholarshipsPageFallback();
  const a = JSON.stringify(norm({ sections: seeded.sections, scholarship: seeded.scholarship }));
  const b = JSON.stringify(norm({ sections: fb.sections, scholarship: fb.scholarship }));
  console.log(a === b ? "PASS seeded page == dictionary fallback" : "FAIL seeded page differs from fallback");
  if (a !== b) { ok = false; console.log(a, "\n", b); }

  const hidden = await run(
    scholarshipsPageQuery,
    docs.map((d: any) => (d._type === "person" ? { ...d, active: false } : d)),
  );
  const none = (hidden.sections.find((s: any) => s._type === "peopleGrid")?.people ?? []).length === 0;
  console.log(none ? "PASS inactive people are hidden" : "FAIL inactive people leaked");
  ok = ok && none;

  const text = JSON.stringify(seeded);
  const leaks = /@[a-z0-9-]+\.[a-z]{2,}/i.test(text) || /email/i.test(Object.keys(seeded).join());
  console.log(!leaks ? "PASS no email in query result" : "FAIL email-like text in query result");
  ok = ok && !leaks;
  process.exit(ok ? 0 : 1);
})();
