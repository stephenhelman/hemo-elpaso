/**
 * Site announcements. Run: npm run check:announcements  (pure; no DB, no network, no Sanity token)
 *  - toggle off = nothing fetched; any failure = no card, never an error page
 *  - time windows applied in code (Mountain Time days), not in the cached query
 *  - events: only published, open to requests, not over; by-invitation excluded
 *  - automatic conference announcements from the registration window; organizer always named
 *  - page exclusions, skip on the target page, dismissals stored as ids only
 *  - the real GROQ query; the card's accessibility controls; the Studio warning; the policy sentence
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { evaluate, parse } from "groq-js";
import { buildAnnouncements, eligibleEvents, referencedEventSlugs, type EventRow } from "../src/lib/announcements/rules";
import { loadAnnouncements, type LoadDeps } from "../src/lib/announcements/load";
import {
  MAX_DISMISSED, addDismissed, hiddenOnPath, parseDismissed, pointsHere, visibleAnnouncements, type PublicAnnouncement,
} from "../src/lib/announcements/display";
import { announcementsQuery } from "../src/sanity/queries/announcements";
import { privacy } from "../src/content/legal/privacy";
import type { AnnouncementData, AnnouncementsData, AnnouncingConferenceData } from "../src/sanity/types";

const NOW = new Date("2027-03-10T18:00:00Z");
const iso = (v: string) => new Date(v).toISOString();
const ann = (id: string, target: AnnouncementData["target"] = { kind: "page", page: "/contact" }, extra: Partial<AnnouncementData> = {}): AnnouncementData => ({
  _id: id, title: { en: id }, startsAt: "2027-03-01T00:00:00Z", endsAt: "2027-04-01T00:00:00Z", target, ...extra,
});
const conf = (extra: Partial<AnnouncingConferenceData> = {}): AnnouncingConferenceData => ({
  _id: "c1", slug: "annual", name: { en: "Annual Meeting", es: "Reunión Anual" }, organizer: "Example Org", startDate: "2027-08-05", endDate: "2027-08-07",
  registrationOpensAt: "2027-03-01T15:00:00Z", registrationClosesAt: "2027-07-01T06:00:00Z", ...extra,
});
const event = (slug: string, extra: Partial<EventRow> = {}): EventRow => ({
  slug, status: "published", allowUninvitedRequests: true, eventDate: "2027-03-20T23:00:00Z", endDate: "2027-03-21T02:00:00Z", ...extra,
});
const data = (d: Partial<AnnouncementsData>): AnnouncementsData => ({ announcements: [], conferences: [], hasConferenceSection: true, ...d });
const build = (d: Partial<AnnouncementsData>, opts: { events?: EventRow[]; registrationOpen?: boolean; now?: Date } = {}) =>
  buildAnnouncements({ data: data(d), events: opts.events ?? [], registrationOpen: opts.registrationOpen ?? true, now: opts.now ?? NOW });
const keys = (list: PublicAnnouncement[]) => list.map((a) => a.key);

// ── Loading ──────────────────────────────────────────────────────────────────
function deps(over: Partial<LoadDeps> = {}) {
  const calls: string[] = [];
  const d: LoadDeps = {
    enabled: async () => true,
    fetchContent: async () => { calls.push("content"); return data({ announcements: [ann("a"), ann("e", { kind: "event", eventSlug: "picnic" })] }); },
    findEvents: async (s) => { calls.push("events:" + s.join()); return [event("picnic")]; },
    registrationOpen: () => true,
    onError: (stage) => { calls.push("error:" + stage); },
    ...over,
  };
  return { d, calls };
}

test("toggle off: nothing is fetched and nothing is shown", async () => {
  const { d, calls } = deps({ enabled: async () => false });
  assert.deepEqual(await loadAnnouncements(d, NOW), []);
  assert.deepEqual(calls, []);
});

test("toggle on: content, then only the referenced events", async () => {
  const { d, calls } = deps();
  assert.deepEqual(keys(await loadAnnouncements(d, NOW)), ["e", "a"]); // the event ends first
  assert.deepEqual(calls, ["content", "events:picnic"]);
});

test("failures never throw: events unreadable drops only event announcements; anything else shows nothing", async () => {
  const noEvents = deps({ findEvents: async () => { throw new Error("db"); } });
  assert.deepEqual(keys(await loadAnnouncements(noEvents.d, NOW)), ["a"]);
  assert.ok(noEvents.calls.includes("error:events"));
  for (const over of [{ enabled: async () => { throw new Error("x"); } }, { fetchContent: async () => { throw new Error("x"); } }, { fetchContent: async () => ({}) as AnnouncementsData }]) {
    assert.deepEqual(await loadAnnouncements(deps(over).d, NOW), []);
  }
});

// ── Time ─────────────────────────────────────────────────────────────────────
test("window: from the start (inclusive) to the end (exclusive)", () => {
  const d = { announcements: [ann("a", undefined, { startsAt: "2027-03-10T18:00:00Z", endsAt: "2027-03-10T19:00:00Z" })] };
  assert.deepEqual(keys(build(d, { now: new Date("2027-03-10T17:59:59Z") })), []);
  assert.deepEqual(keys(build(d, { now: NOW })), ["a"]);
  assert.deepEqual(keys(build(d, { now: new Date("2027-03-10T19:00:00Z") })), []);
  assert.deepEqual(keys(build({ announcements: [ann("x", undefined, { startsAt: null }), ann("y", undefined, { endsAt: "soon" }), ann("z", undefined, { title: {} })] })), []);
});

// ── Targets ──────────────────────────────────────────────────────────────────
test("events: only published, open to requests and not over; by-invitation excluded", () => {
  const rows = [
    event("ok"), event("invite", { allowUninvitedRequests: false }), event("draft", { status: "draft" }),
    event("cancelled", { status: "cancelled" }), event("done", { status: "completed" }),
    event("over", { eventDate: "2027-03-01T00:00:00Z", endDate: "2027-03-01T02:00:00Z" }),
    event("no-end", { eventDate: "2027-03-10T07:00:00Z", endDate: null }), // start + 12h is still ahead
  ];
  assert.deepEqual(Array.from(eligibleEvents(rows, NOW).keys()), ["ok", "no-end"]);
  const announcements = [...rows.map((r) => ann(r.slug, { kind: "event", eventSlug: r.slug })), ann("missing", { kind: "event", eventSlug: "nope" })];
  assert.deepEqual(keys(build({ announcements }, { events: rows })).sort(), ["no-end", "ok"]);
  assert.equal(referencedEventSlugs(data({ announcements: [...announcements, ann("again", { kind: "event", eventSlug: " ok " })] })).filter((s) => s === "ok").length, 1);
});

test("an event announcement ends when the event does, and its link is the event page", () => {
  const [a] = build({ announcements: [ann("e", { kind: "event", eventSlug: "picnic" })] }, { events: [event("picnic")] });
  assert.equal(a.href, "/events/picnic");
  assert.equal(a.endsAt, iso("2027-03-21T02:00:00Z"));
  assert.equal(a.organizer, undefined);
});

test("page and external targets: listed pages and https only; the sign-up page only while registration is open", () => {
  const bad = [
    ann("admin", { kind: "page", page: "/admin" }), ann("empty", { kind: "page" }), ann("http", { kind: "external", url: "http://example.org" }),
    ann("js", { kind: "external", url: "javascript:alert(1)" }), ann("none", null), ann("kind", { kind: undefined }),
  ];
  assert.deepEqual(build({ announcements: bad }), []);
  const signup = { announcements: [ann("r", { kind: "page", page: "/register-info" })] };
  assert.deepEqual(keys(build(signup)), ["r"]);
  assert.deepEqual(build(signup, { registrationOpen: false }), []);
  const [x] = build({ announcements: [ann("x", { kind: "external", url: "https://example.org/a" })] });
  assert.deepEqual([x.href, x.external], ["https://example.org/a", true]);
});

test("conference target: names the organizer; dropped when hidden, ended or not on the Resources page", () => {
  const target = (c: Record<string, unknown> | null) => ({ announcements: [ann("k", { kind: "conference", conference: c as never })] });
  const good = { _id: "c1", active: true, slug: "annual", organizer: "Example Org", endDate: "2027-08-07" };
  const [a] = build(target(good));
  assert.deepEqual([a.href, a.organizer, a.external], ["/resources#conference-annual", "Example Org", false]);
  assert.deepEqual(build({ ...target(good), hasConferenceSection: false }), []);
  for (const c of [null, { ...good, active: false }, { ...good, endDate: "2027-03-09" }, { ...good, organizer: "" }, { ...good, slug: null }]) {
    assert.deepEqual(build(target(c)), [], JSON.stringify(c));
  }
});

// ── Automatic conference announcements ───────────────────────────────────────
test("automatic: from the opening time until registration closes", () => {
  const d = { conferences: [conf()] };
  assert.deepEqual(build(d, { now: new Date("2027-03-01T14:59:59Z") }), []);
  const [a] = build(d);
  assert.deepEqual(a, {
    key: "conference:c1:2027-03-01",
    title: { en: "Registration is open: Annual Meeting", es: "Inscripciones abiertas: Reunión Anual" },
    text: undefined, organizer: "Example Org", href: "/resources#conference-annual", external: false, endsAt: iso("2027-07-01T06:00:00Z"),
  });
  assert.deepEqual(build(d, { now: new Date("2027-07-01T06:00:00Z") }), []);
});

test("automatic: with no closing time it ends when the first conference day begins in El Paso", () => {
  const d = { conferences: [conf({ registrationClosesAt: null })] };
  const [a] = build(d);
  assert.equal(a.endsAt, iso("2027-08-05T06:00:00Z")); // midnight Mountain Daylight Time
  assert.deepEqual(build(d, { now: new Date("2027-08-05T06:00:00Z") }), []);
  const [winter] = build({ conferences: [conf({ startDate: "2027-12-03", endDate: "2027-12-04", registrationClosesAt: null })] });
  assert.equal(winter.endsAt, iso("2027-12-03T07:00:00Z"));
});

test("automatic: needs an opening time, a name, an organizer and the Conference list on the page", () => {
  for (const c of [conf({ registrationOpensAt: null }), conf({ organizer: null }), conf({ name: {} }), conf({ slug: "Bad Slug" }), conf({ endDate: "2027-03-09", startDate: "2027-03-08" })]) {
    assert.deepEqual(build({ conferences: [c] }), [], JSON.stringify(c));
  }
  assert.deepEqual(build({ conferences: [conf()], hasConferenceSection: false }), []);
});

test("automatic: custom wording wins; the dismissal key survives an hour change but not a new opening day", () => {
  const [custom] = build({ conferences: [conf({ announcementTitle: { en: "Sign up now" }, announcementText: { en: "Details" } })] });
  assert.deepEqual([custom.title, custom.text], [{ en: "Sign up now" }, { en: "Details" }]);
  const key = (opens: string) => build({ conferences: [conf({ registrationOpensAt: opens })] })[0].key;
  assert.equal(key("2027-03-01T20:00:00Z"), key("2027-03-01T15:00:00Z"));
  assert.notEqual(key("2027-03-02T15:00:00Z"), key("2027-03-01T15:00:00Z"));
});

test("order: lower number first, then whatever ends soonest; nothing extra leaves the server", () => {
  const list = build({
    announcements: [ann("late", undefined, { order: 100, endsAt: "2027-09-01T00:00:00Z" }), ann("top", undefined, { order: 1 }), ann("soon", undefined, { endsAt: "2027-03-12T00:00:00Z" })],
    conferences: [conf()],
  });
  assert.deepEqual(keys(list), ["top", "soon", "conference:c1:2027-03-01", "late"]);
  const allowed = ["key", "title", "text", "buttonLabel", "organizer", "href", "external", "endsAt"];
  for (const a of list) assert.deepEqual(Object.keys(a).filter((k) => !allowed.includes(k)), []);
});

// ── In the browser ───────────────────────────────────────────────────────────
const pub = (key: string, href = "/about", extra: Partial<PublicAnnouncement> = {}): PublicAnnouncement => ({
  key, title: { en: key }, href, external: false, endsAt: "2027-04-01T00:00:00Z", ...extra,
});

test("hidden on admin, family and single-task pages; shown elsewhere", () => {
  for (const p of ["/admin", "/admin/studio", "/portal", "/portal/confirm-email/t", "/rsvp/t", "/confirm/t", "/unsubscribe", "/register-info", "/no-household", "/access-denied"]) {
    assert.equal(hiddenOnPath(p), true, p);
    assert.deepEqual(visibleAnnouncements([pub("a")], { pathname: p, dismissed: [], now: NOW.getTime() }), []);
  }
  for (const p of ["/", "/events", "/events/picnic", "/resources", "/contact", "/privacy", "/portals"]) assert.equal(hiddenOnPath(p), false, p);
});

test("skipped on the page it links to", () => {
  const c = pub("c", "/resources#conference-annual"), e = pub("e", "/events/picnic"), list = pub("l", "/events"), home = pub("h", "/");
  assert.equal(pointsHere(c, "/resources"), true);
  assert.equal(pointsHere(c, "/about"), false);
  assert.equal(pointsHere(e, "/events/picnic"), true);
  assert.equal(pointsHere(e, "/events/picnic/recap"), true);
  assert.equal(pointsHere(e, "/events/picnic-2"), false);
  assert.equal(pointsHere(e, "/events"), false);
  assert.equal(pointsHere(list, "/events/picnic"), false);
  assert.equal(pointsHere(home, "/about"), false);
  assert.equal(pointsHere(home, "/"), true);
  assert.equal(pointsHere(pub("s", "/events/d%C3%ADa"), "/events/día"), true);
  assert.equal(pointsHere(pub("x", "https://example.org/about", { external: true }), "/about"), false);
});

test("dismissed and expired ones are filtered out", () => {
  const list = [pub("a"), pub("b"), pub("old", "/about", { endsAt: "2027-03-10T18:00:00Z" })];
  assert.deepEqual(keys(visibleAnnouncements(list, { pathname: "/", dismissed: ["a"], now: NOW.getTime() })), ["b"]);
});

test("dismissals: ids only, bad storage ignored, size capped", () => {
  for (const bad of [null, undefined, "", "{", "{}", "5", '"a"']) assert.deepEqual(parseDismissed(bad), [], String(bad));
  assert.deepEqual(parseDismissed('["a",1,null,"b"]'), ["a", "b"]);
  assert.deepEqual(addDismissed(["a", "b"], "a"), ["b", "a"]);
  let l: string[] = [];
  for (let i = 0; i < MAX_DISMISSED + 10; i++) l = addDismissed(l, `k${i}`);
  assert.equal(l.length, MAX_DISMISSED);
  assert.equal(l[l.length - 1], `k${MAX_DISMISSED + 9}`);
});

// ── Query and wiring ─────────────────────────────────────────────────────────
test("GROQ: switched-off items excluded, unpublished references empty, conference block detected", async () => {
  const doc = (id: string, extra: Record<string, unknown>) => ({ _id: id, ...extra });
  const c = (id: string, extra: Record<string, unknown> = {}) =>
    doc(id, { _type: "conference", slug: { current: id }, name: { en: id }, organizer: "O", active: true, announceRegistration: true, lastVerified: "2027-01-01", ...extra });
  const a = (id: string, extra: Record<string, unknown> = {}) =>
    doc(id, { _type: "announcement", title: { en: id }, active: true, target: { kind: "conference", conference: { _type: "reference", _ref: "c-on" } }, internalNote: "secret", ...extra });
  const dataset = [
    doc("resourcesPage", { _type: "resourcesPage", sections: [{ _key: "k", _type: "conferenceList" }] }),
    c("c-on"), c("c-off", { active: false }), c("c-quiet", { announceRegistration: false }),
    a("a-on"), a("a-off", { active: false }), a("a-dangling", { target: { kind: "conference", conference: { _type: "reference", _ref: "gone" } } }),
  ];
  const run = async (ds: object[]) => (await (await evaluate(parse(announcementsQuery), { dataset: ds as never })).get()) as AnnouncementsData;
  const r = await run(dataset);
  assert.deepEqual(r.announcements!.map((x) => x._id).sort(), ["a-dangling", "a-on"]);
  assert.deepEqual(r.conferences!.map((x) => x._id), ["c-on"]);
  assert.equal(r.hasConferenceSection, true);
  assert.equal(r.announcements!.find((x) => x._id === "a-on")!.target!.conference!.slug, "c-on");
  assert.equal(r.announcements!.find((x) => x._id === "a-dangling")!.target!.conference, null);
  assert.ok(!/secret|lastVerified/.test(JSON.stringify(r)));
  assert.notEqual((await run(dataset.slice(1))).hasConferenceSection, true);
  assert.notEqual((await run([doc("resourcesPage", { _type: "resourcesPage" })])).hasConferenceSection, true);
});

const src = (f: string) => readFileSync(f, "utf8");

test("wiring: public layout only, behind the toggle; the event lookup repeats the visibility rule", () => {
  assert.ok(src("src/app/(public)/layout.tsx").includes("getLiveAnnouncements()"));
  assert.ok(!src("src/app/admin/layout.tsx").includes("Announcement"));
  const service = src("src/lib/announcements/service.ts");
  assert.ok(service.includes('isFeatureEnabled("site_announcements")'));
  assert.ok(service.includes('status: "published", allowUninvitedRequests: true'));
  assert.ok(!announcementsQuery.includes("now()"), "time is applied in code, not in the cached query");
});

test("card: pause control, pause on hover and focus, no auto-advance with reduced motion; nothing but ids stored", () => {
  const card = src("src/components/announcements/AnnouncementCard.tsx");
  assert.ok(card.includes("(prefers-reduced-motion: reduce)"));
  assert.ok(card.includes("total > 1 && !reducedMotion && !paused && !hovered && !focused"));
  assert.ok(card.includes("onPointerEnter") && card.includes("onFocus") && card.includes("t.pause") && card.includes("t.dismiss"));
  assert.ok(card.includes('rel="noopener noreferrer"'));
  assert.equal((card.match(/localStorage\.(getItem|setItem)/g) ?? []).length, 2);
  assert.ok(card.includes("JSON.stringify(next)"));
  assert.ok(!/fetch\(|trackEvent|sendBeacon/.test(card), "dismissals are never sent anywhere");
});

test("Studio: every announcement text field carries the health warning", () => {
  assert.match(src("src/sanity/helpers/warnings.ts"), /Never write anything about any individual family or person's health/);
  assert.ok((src("src/sanity/schemas/documents/announcement.ts").match(/PUBLIC_TEXT_WARNING/g) ?? []).length >= 4);
  assert.ok((src("src/sanity/schemas/documents/conference.ts").match(/PUBLIC_TEXT_WARNING/g) ?? []).length >= 3);
});

test("privacy policy describes the on-device storage in both languages, bound to the toggle", () => {
  for (const lang of ["en", "es"] as const) {
    const p = privacy[lang].blocks.filter((b) => b.t === "p" && b.text.includes("{STATUS:site_announcements}"));
    assert.equal(p.length, 1, lang);
  }
});
