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
import { getInvolvedPageQuery } from "../src/sanity/queries/getInvolved";
import { contactPageQuery } from "../src/sanity/queries/contact";
import { homePageQuery } from "../src/sanity/queries/home";
import { visibleSponsors } from "../src/sanity/helpers/sponsors";
import { siteSettingsQuery } from "../src/sanity/queries/siteSettings";
import { yearsSinceFounding } from "../src/lib/site";
import { homePageFallback, getInvolvedPageFallback, contactPageFallback, scholarshipsPageFallback, resourcesPageFallback, aboutPageFallback } from "../src/sanity/fallback";

const run = async (q: string, dataset: any[]) => (await (await evaluate(parse(q), { dataset })).get()) as any;
// Drop nulls/_key/_id and reduce people to what the page shows, so "absent" equals "null".
const sortKeys = (x: any): any =>
  Array.isArray(x) ? x.map(sortKeys) : x && typeof x === "object" ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, sortKeys(x[k])])) : x;
const norm = (x: any): any =>
  sortKeys(JSON.parse(
    JSON.stringify(x, (k, v) => {
      if (k === "_key" || k === "_id" || k === "order" || k === "bio" || v === null) return undefined;
      // array-member `_type`s (card, ctaButton, metaItem, localizedString) are needed by Studio but not projected
      if (k === "_type" && ["card", "ctaButton", "heroButton", "heroBadge", "stat", "metaItem", "localizedString"].includes(v)) return undefined;
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
  // ---- Home ----
  const hSeeded = await run(homePageQuery, docs);
  const ha = JSON.stringify(norm({ sections: hSeeded.sections })), hb = JSON.stringify(norm({ sections: homePageFallback().sections }));
  console.log(ha === hb ? "PASS seeded home page == dictionary fallback" : "FAIL seeded home page differs from fallback");
  if (ha !== hb) { ok = false; console.log(ha.slice(0, 900), "\n", hb.slice(0, 900)); }
  const order = hSeeded.sections.map((x: any) => x._type).join(",");
  const homeOrderOk = order === "pageHero,statsRow,eventsFeed,ctaBanner";
  console.log(homeOrderOk ? `PASS home sections in today's order (${order})` : `FAIL home order (${order})`);
  ok = ok && homeOrderOk;
  const stats = hSeeded.sections.find((x: any) => x._type === "statsRow").stats as any[];
  const shown = stats.map((st) => `${st.source === "yearsOfService" ? yearsSinceFounding() : st.value}${st.suffix ?? ""} ${st.label.en}`);
  const statsOk = shown.join("|") === "150+ Families Served|33 Years of Service|50+ Events Hosted|100% Free of Charge" && stats[1].value == null;
  console.log(statsOk ? `PASS stats compute 33 (${shown.join(" | ")})` : `FAIL stats (${shown.join(" | ")})`);
  ok = ok && statsOk;
  const heroH = hSeeded.sections[0].heading;
  const mark = (pt: any[]) => (pt ?? []).flatMap((b: any) => b.children).filter((c: any) => (c.marks ?? []).includes("emphasis")).map((c: any) => c.text).join();
  const markOk = mark(heroH.en) === "Hope" && mark(heroH.es) === "Esperanza";
  console.log(markOk ? "PASS heading emphasis marks: EN 'Hope', ES 'Esperanza'" : `FAIL emphasis marks (${mark(heroH.en)} / ${mark(heroH.es)})`);
  ok = ok && markOk;
  const band = hSeeded.sections.find((x: any) => x._type === "ctaBanner");
  const bandOk = band.background === "primary" && band.icon === "clipboardList" && band.showIfRegistrationOpen === true;
  console.log(bandOk ? "PASS register band: primary, icon, showIfRegistrationOpen" : "FAIL register band");
  ok = ok && bandOk;
  const flatText = (pt: any[]) => (pt ?? []).flatMap((b: any) => b.children).map((c: any) => c.text).join("");
  const sameText = flatText(heroH.en) === "Giving Hope To Our Community" && flatText(heroH.es) === "Dando Esperanza A Nuestra Comunidad";
  console.log(sameText ? "PASS hero heading text unchanged (EN/ES)" : "FAIL hero heading text");
  ok = ok && sameText;

  // ---- Get Involved ----
  const gSeeded = await run(getInvolvedPageQuery, docs);
  const ga = JSON.stringify(norm({ sections: gSeeded.sections })), gb = JSON.stringify(norm({ sections: getInvolvedPageFallback().sections }));
  console.log(ga === gb ? "PASS seeded get-involved page == dictionary fallback" : "FAIL seeded get-involved page differs from fallback");
  if (ga !== gb) { ok = false; console.log(ga.slice(0, 700), "\n", gb.slice(0, 700)); }
  const gText = JSON.stringify(gSeeded);
  const gOk = !/sponsor(ship)? tier|bronze|platinum/i.test(gText) && (gSeeded.sections.find((x: any) => x._type === "cardGrid").cards.length === 4);
  console.log(gOk ? "PASS get-involved: 4 cards, no sponsorship tiers" : "FAIL get-involved cards/tiers");
  ok = ok && gOk;
  const links = (gSeeded.sections.find((x: any) => x._type === "cardGrid").cards as any[]).every((c) => c.link?.type === "internal" && c.link?.value === "/contact");
  console.log(links ? "PASS all four cards link to /contact" : "FAIL card links");
  ok = ok && links;

  // ---- Contact ----
  const cSeeded = await run(contactPageQuery, docs);
  const ca = JSON.stringify(norm({ ...cSeeded, seo: null })), cb = JSON.stringify(norm(contactPageFallback()));
  console.log(ca === cb ? "PASS seeded contact page == dictionary fallback" : "FAIL seeded contact page differs from fallback");
  if (ca !== cb) { ok = false; console.log(ca.slice(0, 900), "\n", cb.slice(0, 900)); }
  const cText = JSON.stringify(cSeeded);
  const cOk = !/office hours|horario|9:00|@[a-z0-9-]+\.[a-z]{2,}/i.test(cText) && !("sections" in cSeeded);
  console.log(cOk ? "PASS contact: no office hours, no email, no free sections array" : "FAIL contact result has hours/email/sections");
  ok = ok && cOk;

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
  // ---- Sponsors ----
  const logo = (ref: string) => ({ _type: "image", asset: { _type: "reference", _ref: ref }, alt: { en: "Logo" } });
  const sp = (id: string, name: string, order: number, active: boolean) => ({
    _id: id, _type: "sponsor", name, order, active, logo: logo(`image-${id}-100x100-png`), website: "https://example.org",
    _updatedAt: "2026-01-01T00:00:00Z",
    // private data that must never come out of a projection, even if someone typed it into the document
    contactEmail: "secret@example.org", amount: 5000, tier: "gold",
  });
  const sdocs = [sp("s1", "Alpha", 20, true), sp("s2", "Bravo", 10, true), sp("s3", "Hidden", 5, false), sp("s4", "Delta", 30, true)];
  const homeDoc = (mode: string, extra: any = {}) => ({ _id: "homePage", _type: "homePage", sections: [{ _key: "k", _type: "sponsorStrip", mode, layout: "row", showNames: true, ...extra }] });
  const all = (await run(homePageQuery, [...sdocs, homeDoc("allActive")])).sections[0].sponsors.map((x: any) => x.name).join(",");
  console.log(all === "Bravo,Alpha,Delta" ? "PASS sponsor strip allActive: by order, inactive hidden" : `FAIL sponsor strip allActive (${all})`);
  ok = ok && all === "Bravo,Alpha,Delta";
  const refs = (ids: string[]) => ids.map((r) => ({ _key: r, _type: "reference", _ref: r }));
  const sel = visibleSponsors((await run(homePageQuery, [...sdocs, homeDoc("selected", { sponsors: refs(["s4", "s3", "s1"]) })])).sections[0].sponsors).map((x: any) => x.name).join(",");
  console.log(sel === "Delta,Alpha" ? "PASS sponsor strip selected: editor order kept, inactive skipped" : `FAIL sponsor strip selected (${sel})`);
  ok = ok && sel === "Delta,Alpha";
  const leak = /secret@|5000|gold|contactEmail/i.test(JSON.stringify(await run(homePageQuery, [...sdocs, homeDoc("allActive")])));
  console.log(!leak ? "PASS sponsor projection leaks no private fields" : "FAIL sponsor projection leaked a private field");
  ok = ok && !leak;
  const settings = (await run(siteSettingsQuery, [...sdocs, { _id: "siteSettings", _type: "siteSettings", orgName: "x", footerSponsors: refs(["s1", "s3", "s2", "s4"]) }])).footerSponsors.map((x: any) => x.name).join(",");
  console.log(settings === "Bravo,Alpha,Delta" ? "PASS footerSponsors: active only" : `FAIL footerSponsors (${settings})`);
  ok = ok && settings === "Bravo,Alpha,Delta";
  const emptyFooter = (await run(siteSettingsQuery, [...sdocs, { _id: "siteSettings", _type: "siteSettings", orgName: "x" }])).footerSponsors;
  console.log(Array.isArray(emptyFooter) && emptyFooter.length === 0 ? "PASS footerSponsors empty when unset" : `FAIL footerSponsors unset (${JSON.stringify(emptyFooter)})`);
  ok = ok && Array.isArray(emptyFooter) && emptyFooter.length === 0;

  process.exit(ok ? 0 : 1);
})();
