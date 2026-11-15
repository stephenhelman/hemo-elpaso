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
import { resourcesPageQuery } from "../src/sanity/queries/resources";
import { scholarshipsPageFallback, resourcesPageFallback } from "../src/sanity/fallback";

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
  // ---- Resources page ----
  const rSeeded = await run(resourcesPageQuery, docs);
  const rFb = resourcesPageFallback();
  const ra = JSON.stringify(norm({ sections: rSeeded.sections }));
  const rb = JSON.stringify(norm({ sections: rFb.sections }));
  console.log(ra === rb ? "PASS seeded resources page == dictionary fallback" : "FAIL seeded resources page differs from fallback");
  if (ra !== rb) {
    ok = false;
    const A = JSON.parse(ra).sections, B = JSON.parse(rb).sections;
    A.forEach((sec: any, i: number) => { if (JSON.stringify(sec) !== JSON.stringify(B[i])) console.log(" first differing section:", i, JSON.stringify(sec).slice(0, 600), "\n vs", JSON.stringify(B[i]).slice(0, 600)); });
  }
  const counts = (rSeeded.sections as any[]).filter((x) => x._type === "resourceList").map((x) => `${x.category}:${x.items.length}`).join(" ");
  const countsOk = counts === "condition:3 nationalOrg:3 localCare:3 youthProgram:2 financialHelp:3";
  console.log(countsOk ? `PASS resource counts (${counts})` : `FAIL resource counts (${counts})`);
  ok = ok && countsOk;
  const hiddenR = await run(resourcesPageQuery, docs.map((d: any) => (d._type === "resource" && d._id.endsWith("-cdc") ? { ...d, active: false } : d)));
  const natl = hiddenR.sections.find((x: any) => x.category === "nationalOrg").items.length;
  console.log(natl === 2 ? "PASS inactive resource hidden" : "FAIL inactive resource shown");
  ok = ok && natl === 2;
  const rText = JSON.stringify(rSeeded);
  const noVerified = !/lastVerified/.test(rText) && !/"active"/.test(rText);
  console.log(noVerified ? "PASS editor-only fields (lastVerified, active) not projected" : "FAIL editor-only field leaked");
  ok = ok && noVerified;
  const orderOk = (rSeeded.sections.find((x: any) => x.category === "condition").items as any[]).map((i) => i.abbreviation).join() === "HA,HB,VWD";
  console.log(orderOk ? "PASS items sorted by order" : "FAIL order");
  ok = ok && orderOk;
  process.exit(ok ? 0 : 1);
})();
