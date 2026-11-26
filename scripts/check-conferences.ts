/**
 * External conferences on /resources. Run: npm run check:conferences  (pure; no DB, no network, no Sanity token)
 *  - hidden after the end date, on the Mountain Time calendar, at request time
 *  - registration window, travel assistance deadline, Studio warnings (60 days, closed while shown)
 *  - anchors: #conferences and #conference-<slug>, unique on the page
 *  - the real GROQ query: inactive hidden, editor-only fields never returned
 *  - only https or listed site pages are linked; the webhook knows the type and the setup doc's filter matches it
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { evaluate, parse } from "groq-js";
import {
  closedButShown, conferenceIsUpcoming, formatDateSpan, prepareConferenceSections, registrationState,
  travelAssistanceOpen, travelLink, verificationIsStale,
} from "../src/sanity/helpers/conferences";
import { sectionAnchors } from "../src/sanity/helpers/anchors";
import { resourcesPageQuery } from "../src/sanity/queries/resources";
import { resourcesPageFallback } from "../src/sanity/fallback";
import { conferenceTranslation } from "../src/translation/conferences";
import type { Section } from "../src/sanity/types";

const at = (iso: string) => new Date(iso);
const conf = (id: string, extra: Record<string, unknown> = {}) => ({ _id: id, slug: id, startDate: "2027-03-05", endDate: "2027-03-07", ...extra });
const list = (items: any[], key = "c"): Section => ({ _key: key, _type: "conferenceList", items });
const itemsOf = (s: Section) => (s as Extract<Section, { _type: "conferenceList" }>).items ?? [];

test("shown through the end date on the Mountain Time calendar, hidden the next day", () => {
  // 2027-03-07 23:59 in El Paso (UTC-7) is 06:59 UTC on the 8th
  assert.equal(conferenceIsUpcoming("2027-03-07", at("2027-03-08T06:59:00Z")), true);
  assert.equal(conferenceIsUpcoming("2027-03-07", at("2027-03-08T07:00:00Z")), false);
  // summer time (UTC-6)
  assert.equal(conferenceIsUpcoming("2027-07-10", at("2027-07-11T05:59:00Z")), true);
  assert.equal(conferenceIsUpcoming("2027-07-10", at("2027-07-11T06:00:00Z")), false);
  assert.equal(conferenceIsUpcoming(undefined), false);
  assert.equal(conferenceIsUpcoming("soon"), false);
});

test("prepare: ended removed, soonest first, other sections untouched", () => {
  const other: Section = { _key: "h", _type: "pageHero" };
  const out = prepareConferenceSections(
    [other, list([conf("later", { startDate: "2027-09-01", endDate: "2027-09-02" }), conf("ended", { startDate: "2027-01-01", endDate: "2027-01-02" }), conf("soon")])],
    at("2027-02-01T12:00:00Z"),
  );
  assert.equal(out[0], other);
  assert.deepEqual(itemsOf(out[1]).map((c) => c._id), ["soon", "later"]);
});

test("registration window", () => {
  const o = "2027-01-10T16:00:00Z", c = "2027-02-10T23:00:00Z";
  assert.equal(registrationState(o, c, at("2027-01-10T15:59:59Z")), "upcoming");
  assert.equal(registrationState(o, c, at(o)), "open");
  assert.equal(registrationState(o, c, at(c)), "closed");
  assert.equal(registrationState(null, c, at(o)), "open");
  assert.equal(registrationState(o, null, at(c)), "open");
  assert.equal(registrationState(null, null, at(o)), null);
});

test("travel assistance: only when switched on, through the deadline (Mountain Time)", () => {
  assert.equal(travelAssistanceOpen({ travelAssistance: false }), false);
  assert.equal(travelAssistanceOpen({ travelAssistance: true }), true);
  const c = { travelAssistance: true, travelAssistanceDeadline: "2027-02-01" };
  assert.equal(travelAssistanceOpen(c, at("2027-02-02T06:59:00Z")), true);
  assert.equal(travelAssistanceOpen(c, at("2027-02-02T07:00:00Z")), false);
});

test("Studio warnings: verified more than 60 days ago; registration closed while shown", () => {
  const now = at("2027-03-02T12:00:00Z");
  assert.equal(verificationIsStale("2027-01-01", now), false, "exactly 60 days");
  assert.equal(verificationIsStale("2026-12-31", now), true, "61 days");
  assert.equal(verificationIsStale(undefined, now), true);
  assert.equal(closedButShown("2027-03-01T00:00:00Z", true, now), true);
  assert.equal(closedButShown("2027-03-01T00:00:00Z", false, now), false);
  assert.equal(closedButShown("2027-04-01T00:00:00Z", true, now), false);
  assert.equal(closedButShown(null, true, now), false);
});

test("links: https or a listed site page, nothing else", () => {
  assert.deepEqual(travelLink({ type: "internal", value: "/contact" }), { href: "/contact", external: false });
  assert.deepEqual(travelLink({ type: "external", value: "https://example.org/x" }), { href: "https://example.org/x", external: true });
  for (const bad of [
    { type: "internal", value: "/admin" }, { type: "external", value: "http://example.org" }, { type: "external", value: "javascript:alert(1)" },
    { type: "phone", value: "+19155397353" }, { type: "external", value: "" }, null,
  ]) assert.equal(travelLink(bad), null, JSON.stringify(bad));
});

test("dates are formatted without shifting the day", () => {
  assert.equal(formatDateSpan("2027-03-05", "2027-03-07", "en"), "March 5, 2027 – March 7, 2027");
  assert.equal(formatDateSpan("2027-03-05", "2027-03-05", "es"), "5 de marzo de 2027");
  assert.equal(formatDateSpan("2027-13-45", "soon", "en"), "", "unreadable dates are left out, not thrown");
  assert.equal(registrationState("soon", "later", at("2027-01-01T00:00:00Z")), null);
});

test("anchors: #conferences, #conference-<slug>, and no id is used twice", () => {
  const res = (key: string, category: string, n = 1): Section => ({ _key: key, _type: "resourceList", category, layout: "org", items: Array(n).fill({}) as any });
  const a = sectionAnchors([res("a", "condition"), res("b", "nationalOrg"), res("c", "nationalOrg"), res("e", "localCare", 0), res("f", "localCare"), list([conf("x")], "g"), list([conf("y")], "h")]);
  assert.deepEqual(a, { a: "conditions", b: "national", c: "national-2", f: "local", g: "conferences", h: "conferences-2" });
  assert.equal(new Set(Object.values(a)).size, Object.values(a).length);
  const out = prepareConferenceSections([list([conf("dup"), conf("dup", { _id: "dup2" }), conf("Bad Slug")], "1"), list([conf("dup")], "2")], at("2027-01-01T12:00:00Z"));
  assert.deepEqual(out.flatMap((s) => itemsOf(s).map((c) => c.anchor)), ["conference-dup", null, null, null]);
});

test("today's Resources page keeps its anchors", () => {
  assert.deepEqual(Object.values(sectionAnchors(resourcesPageFallback().sections)), ["conditions", "national", "local", "camps", "financial"]);
});

test("GROQ: active conferences with an address name only; editor-only fields never leave the dataset", async () => {
  const doc = (id: string, extra: Record<string, unknown> = {}) => ({
    _id: id, _type: "conference", name: { en: id }, slug: { current: id }, organizer: "Org", startDate: "2027-03-05", endDate: "2027-03-07",
    active: true, lastVerified: "2027-01-01", announceRegistration: true, announcementTitle: { en: "private-until-live" }, internalNote: "secret", ...extra,
  });
  const dataset = [
    { _id: "resourcesPage", _type: "resourcesPage", sections: [{ _key: "k", _type: "conferenceList" }] },
    doc("b", { startDate: "2027-05-01" }), doc("a"), doc("off", { active: false }), doc("noslug", { slug: undefined }),
  ];
  const page = (await (await evaluate(parse(resourcesPageQuery), { dataset })).get()) as any;
  assert.deepEqual(page.sections[0].items.map((i: any) => i.slug), ["a", "b"]);
  assert.ok(!/lastVerified|announce|private-until-live|secret|"active"/.test(JSON.stringify(page)));
});

test("card copy in both languages; an organizer ending in a period reads correctly", () => {
  assert.equal(conferenceTranslation.en.hostedBy("Example Org"), "Hosted by Example Org. Registration is on their website.");
  assert.equal(conferenceTranslation.en.hostedBy("Example Inc."), "Hosted by Example Inc. Registration is on their website.");
  assert.equal(conferenceTranslation.es.hostedBy("Example Org"), "Organizado por Example Org. La inscripción se hace en su sitio web.");
});

test("external links open in a new tab safely; no Event structured data", () => {
  const src = readFileSync("src/components/sanity/ConferenceListBlock.tsx", "utf8");
  assert.equal((src.match(/target="_blank"/g) ?? []).length, 1, "one shared external button");
  assert.ok(src.includes('rel="noopener noreferrer"') && src.includes("<ExternalLink") && src.includes("t.newTab"));
  assert.ok(!/ld\+json|EventSchema/.test(src));
});

test("the webhook revalidates every type it lists, and the setup doc's filter names the same types", () => {
  const route = readFileSync("src/app/api/revalidate/route.ts", "utf8");
  const block = route.slice(route.indexOf("TAGS_BY_TYPE"), route.indexOf("export async function POST"));
  const types = Array.from(block.matchAll(/^\s+(\w+): \[/gm)).map((m) => m[1]).sort();
  assert.ok(types.includes("conference"));
  const filter = /_type in (\[[^\]]+\])/.exec(readFileSync("docs/overhaul/SANITY_SETUP.md", "utf8"))![1];
  assert.deepEqual((JSON.parse(filter) as string[]).sort(), types);
});
