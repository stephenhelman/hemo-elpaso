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
import { aboutPageQuery } from "../src/sanity/queries/about";
import { fillYears } from "../src/lib/site";
import { pick } from "../src/sanity/helpers/pick";
import { scholarshipsPageFallback, resourcesPageFallback, aboutPageFallback } from "../src/sanity/fallback";

const run = async (q: string, dataset: any[]) => (await (await evaluate(parse(q), { dataset })).get()) as any;
// Drop nulls/_key/_id and reduce people to what the page shows, so "absent" equals "null".
const sortKeys = (x: any): any =>
  Array.isArray(x) ? x.map(sortKeys) : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, sortKeys(x[k])])) : x;
const norm = (x: any): any =>
  sortKeys(JSON.parse(
    JSON.stringify(x, (k, v) => {
      if (k === "_key" || k === "_id" || k === "order" || k === "bio" || v === null) return undefined;
      // array-member `_type`s (card, ctaButton, metaItem, localizedString) are needed by Studio but not projected
      if (k === "_type" && ["card", "ctaButton", "metaItem", "localizedString"].includes(v)) return undefined;
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
  // ---- About page ----
  const aSeeded = await run(aboutPageQuery, docs);
  const aFb = aboutPageFallback();
  // seeded sections keep _type/_key noise out of the comparison; pastPresidents comes from the people docs.
  const aa = JSON.stringify(norm({ sections: aSeeded.sections }));
  const ab = JSON.stringify(norm({ sections: aFb.sections }));
  console.log(aa === ab ? "PASS seeded about page == dictionary fallback" : "FAIL seeded about page differs from fallback");
  if (aa !== ab) {
    ok = false;
    const A = JSON.parse(aa).sections, B = JSON.parse(ab).sections;
    A.forEach((sec: any, i: number) => { if (JSON.stringify(sec) !== JSON.stringify(B[i])) console.log(" differing section", i, "\n  seeded  :", JSON.stringify(sec).slice(0, 900), "\n  fallback:", JSON.stringify(B[i]).slice(0, 900)); });
  }
  const story = aSeeded.sections.find((x: any) => x._type === "textWithAside");
  const names = story.pastPresidents.map((p: any) => p.name).join(", ");
  const namesOk = names === "Lou Anne Fetters, Rosamaria Coles, Felix Garcia, Yolanda Ortiz";
  console.log(namesOk ? `PASS past presidents list (${names})` : `FAIL past presidents list (${names})`);
  ok = ok && namesOk;
  const aText = JSON.stringify(aSeeded);
  const aboutLeak = /@[a-z0-9-]+\.[a-z]{2,}/i.test(aText) || /Helman/i.test(aText);
  console.log(!aboutLeak ? "PASS no email / no Helman in about result" : "FAIL about result has an email or Helman");
  ok = ok && !aboutLeak;
  // Computed numbers vs today's live page (the dictionary, filled by the same function as before)
  const tokens = JSON.stringify(aSeeded.sections);
  console.log("tokens present in seeded About:", ["{decadeYears}", "{decades}", "{years}"].map((t) => `${t}=${(tokens.match(new RegExp(t.replace(/[{}]/g, "\\$&"), "g")) ?? []).length}`).join(" "));
  const hero = aSeeded.sections[0];
  const rendered = (loc: "en" | "es") => `${(pick(hero.heading, loc) as any)?.[0]?.children?.[0]?.text} | ${(pick(hero.subheading, loc) as any)?.slice(0, 90)}`;
  console.log(" EN hero:", rendered("en"));
  console.log(" ES hero:", rendered("es"));
  console.log(" stats years (home):", fillYears("{years}", "en"), "| {decadeYears}:", fillYears("{decadeYears}", "en"), "| {decades}:", fillYears("{decades}", "en"), fillYears("{decades}", "es"));
  process.exit(ok ? 0 : 1);
})();
