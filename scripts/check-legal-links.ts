/**
 * Links to the legal pages. Run: npm run check:legal-links   (offline: no DB, no network)
 *  - builds the route list from src/app and fails if any internal link to a legal page matches no real route
 *  - renders what builds links from data (footer, form links, consent and policy text, email footer), EN and ES
 *  - footer lists all three on every public page; sitemap lists the legal pages; print and ?lang= are wired
 *  - the redirects for other spellings lead to real pages and shadow nothing
 *
 * A link can be right and the page still be down, so there is a second, LIVE mode against a running site:
 *   LEGAL_LINKS_URL=https://hemoelpaso.org npm run check:legal-links
 * It only sends GET requests. Each page is requested twice: a page that works only until its data is cached passes once.
 */
import "./_react-global";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { render } from "@react-email/render";
import LegalLinks from "../src/components/legal/LegalLinks";
import RichText from "../src/components/legal/RichText";
import EmailLayout from "../src/messages/EmailLayout";
import { footerTranslation } from "../src/translation/layoutPage";
import { consentTextVersions } from "../src/content/consent";
import { privacy } from "../src/content/legal/privacy";
import { terms } from "../src/content/legal/terms";
import { children } from "../src/content/legal/children";
import { unitsOf } from "../src/content/legal/analyze";
// @ts-ignore plain ESM shared with next.config.mjs
import { LEGAL_REDIRECTS } from "./legal-redirects.mjs";

const LANGS = ["en", "es"] as const;
const DOCS = { "/privacy": privacy, "/terms": terms, "/children": children } as const;
const THREE = Object.keys(DOCS);
const ALL_LEGAL = ["/legal", ...THREE];

/** A path that is meant to be one of the legal pages, whether or not it exists. */
const LEGAL_LOOKING = /privac|polic|terms|t[eé]rmin|child|menor|legal|^\/tos$/i;

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));

/**
 * Every address the app really serves. The top-level catch-all [...slug] is left out on purpose: it only renders the
 * 404 page, and counting it would make every link "resolve".
 */
function routeList(): RegExp[] {
  return walk("src/app").flatMap((file) => {
    const parts = relative("src/app", file).split(sep);
    const name = parts.pop()!;
    const metadata = /^(sitemap|robots|manifest)\.ts$/.exec(name)?.[1];
    if (!metadata && !/^(page\.tsx|route\.ts)$/.test(name)) return [];
    const segments = parts.filter((p) => !/^\(.*\)$/.test(p));
    if (segments.length === 1 && segments[0].startsWith("[...")) return [];
    if (metadata) segments.push({ sitemap: "sitemap.xml", robots: "robots.txt", manifest: "manifest.webmanifest" }[metadata]!);
    const pattern = segments
      .map((s) => (/^\[\[?\.\.\./.test(s) ? ".+" : /^\[.+\]$/.test(s) ? "[^/]+" : s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
      .join("/");
    return [new RegExp(`^/${pattern}$`)];
  });
}
const ROUTES = routeList();
const pathOf = (href: string) => href.split(/[?#]/)[0].replace(/(.)\/$/, "$1");
const isRoute = (href: string) => ROUTES.some((r) => r.test(pathOf(href)));

/** Internal addresses written in a source file: "…", `${base}/…`, [label](/…) and full URLs on our own domain. */
function linksIn(text: string): string[] {
  const patterns = [
    /["'`](\/(?!\/)[^"'`\s<>(){}$]*)/g,
    /\}(\/[A-Za-z0-9_\-./]+(?:\?[A-Za-z0-9_=&-]*)?)/g,
    /\]\((\/(?!\/)[^)\s]*)\)/g,
    /https?:\/\/(?:www\.)?hemo-?el-?paso\.org(\/[^"'`\s<>()]*)/gi,
  ];
  return patterns.flatMap((p) => Array.from(text.matchAll(p), (m) => m[1]));
}

const hrefs = (html: string) => Array.from(html.matchAll(/href="([^"]*)"/g), (m) => m[1].replace(/&amp;/g, "&"));
const internal = (list: string[]) => list.filter((h) => h.startsWith("/"));
const assertReal = (list: string[], where: string) => {
  for (const h of list) assert.ok(isRoute(h), `${where}: ${h} matches no route`);
};

test("the route list holds the legal pages and not the catch-all", () => {
  for (const p of ALL_LEGAL) assert.ok(isRoute(p), p);
  for (const p of ["/privacy-policy", "/legal/privacy", "/nothing-here"]) assert.ok(!isRoute(p), p);
  assert.ok(isRoute("/events/any-slug") && isRoute("/privacy?print=1") && isRoute("/sitemap.xml"));
});

test("every internal link to a legal page, anywhere in the source, matches a real route", () => {
  const files = [...walk("src").filter((f) => /\.(tsx?|mjs)$/.test(f)), "scripts/seed-sanity.ts", "scripts/seed-templates.ts"];
  const broken: string[] = [];
  let found = 0;
  for (const file of files) {
    readFileSync(file, "utf8").split("\n").forEach((line, n) => {
      for (const href of linksIn(line)) {
        if (!LEGAL_LOOKING.test(pathOf(href))) continue;
        found++;
        if (!isRoute(href)) broken.push(`${file}:${n + 1}  ${href}`);
      }
    });
  }
  assert.deepEqual(broken, []);
  assert.ok(found >= 20, `the scan found only ${found} legal links: has the pattern stopped matching?`);
});

test("the scan catches a broken link in each way one can be written", () => {
  for (const line of ['href="/privacy-policy"', "`${base}/terms-of-use`", "[Privacy](/legal/privacy)", "https://hemoelpaso.org/children-policy"]) {
    assert.ok(linksIn(line).some((h) => LEGAL_LOOKING.test(pathOf(h)) && !isRoute(h)), line);
  }
});

test("form links (LegalLinks) resolve, EN and ES", () => {
  for (const locale of LANGS) {
    const out = hrefs(renderToStaticMarkup(createElement(LegalLinks, { locale, which: ["privacy", "children", "terms"] })));
    assert.deepEqual(out, ["/privacy", "/children", "/terms"]);
    assertReal(out, "LegalLinks");
  }
});

test("links inside consent wording (every version) and policy text resolve, EN and ES", () => {
  let seen = 0;
  const check = (text: string, locale: "en" | "es", where: string) => {
    const out = internal(hrefs(renderToStaticMarkup(createElement(RichText, { text, locale }))));
    seen += out.length;
    assertReal(out, where);
  };
  for (const [version, texts] of Object.entries(consentTextVersions)) {
    for (const [key, t] of Object.entries(texts as Record<string, { en: string; es: string }>)) for (const l of LANGS) check(t[l], l, `consent ${version}.${key}.${l}`);
  }
  for (const [path, doc] of Object.entries(DOCS)) for (const u of unitsOf(path, doc)) check(u.text, u.lang, `${path} ${u.lang}`);
  assert.ok(seen > 0);
});

test("every email's footer links to the privacy policy in the email's language", async () => {
  for (const lang of LANGS) {
    const html = await render(createElement(EmailLayout, { lang, preview: "p", children: createElement("p", null, "x") }));
    const links = hrefs(html).filter((h) => LEGAL_LOOKING.test(h));
    assert.equal(links.length, 1);
    const u = new URL(links[0]);
    assert.deepEqual([u.pathname, u.search], ["/privacy", `?lang=${lang}`]);
    assert.ok(isRoute(u.pathname));
  }
});

test("the footer lists all three policies in both languages, and every public page has that footer", () => {
  for (const l of LANGS) assert.deepEqual(footerTranslation[l].legalLinks.map((x) => x.href), THREE, l);
  const footer = readFileSync("src/components/layout/Footer.tsx", "utf8");
  assert.ok(footer.includes("t.legalLinks.map"));
  assert.ok(readFileSync("src/components/layout/SiteLayout.tsx", "utf8").includes("<Footer />"));
  assert.ok(readFileSync("src/app/(public)/layout.tsx", "utf8").includes("<SiteLayout"));
  // The announcement card is fixed to the bottom of the screen: it must leave room so these links stay clickable.
  assert.ok(readFileSync("src/components/announcements/AnnouncementCard.tsx", "utf8").includes("data-announcement-room"));
  // No public page may sit under a second document layout, which would drop the site footer.
  const documents = walk("src/app").filter((f) => /layout\.tsx$/.test(f) && readFileSync(f, "utf8").includes("<html"));
  assert.deepEqual(documents.map((f) => f.split(sep).join("/")).sort(), ["src/app/(public)/layout.tsx", "src/app/admin/layout.tsx"]);
});

test("sitemap, print version, language links", () => {
  const sitemap = readFileSync("src/app/sitemap.ts", "utf8");
  for (const p of ALL_LEGAL) assert.ok(sitemap.includes(`"${p}"`), `sitemap lacks ${p}`);
  const middleware = readFileSync("src/middleware.ts", "utf8");
  for (const p of ALL_LEGAL) assert.ok(middleware.includes(`"${p}"`), `?lang= is not applied on ${p}`);
  for (const p of THREE) assert.ok(readFileSync(`src/app/(public)${p}/page.tsx`, "utf8").includes('autoPrint={searchParams.print === "1"}'), `${p}?print=1`);
  const index = readFileSync("src/app/(public)/legal/page.tsx", "utf8");
  assert.ok(index.includes("`${href}?print=1`"));
  for (const p of THREE) assert.ok(index.includes(`href: "${p}"`), p);
});

test("redirects: unique, shadow no real page, lead to a legal page; the usual guesses are covered", () => {
  const seen = new Set<string>();
  for (const [source, destination] of LEGAL_REDIRECTS as [string, string][]) {
    assert.ok(!seen.has(source.toLowerCase()), `duplicate ${source}`);
    seen.add(source.toLowerCase());
    assert.ok(!isRoute(source), `${source} is a real page`);
    const [path, query] = destination.split("?");
    assert.ok(THREE.includes(path) && isRoute(path), destination);
    assert.ok(!query || /^(lang=(en|es)|print=1)$/.test(query), destination);
  }
  for (const guess of ["/privacy-policy", "/terms-of-use", "/terms-of-service", "/children-policy", "/childrens-policy", "/politica-de-privacidad", "/terminos-de-uso", "/politica-para-menores"]) {
    assert.ok(seen.has(guess), guess);
  }
  assert.ok(readFileSync("next.config.mjs", "utf8").includes("...legalRedirects()"));
});

// ── Live mode ────────────────────────────────────────────────────────────────
const BASE = process.env.LEGAL_LINKS_URL?.replace(/\/+$/, "");
const live = { skip: BASE ? false : "set LEGAL_LINKS_URL to check a running site" };
const get = (path: string) => fetch(`${BASE}${path}`, { redirect: "manual", signal: AbortSignal.timeout(60_000) });
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/'/g, "&#x27;");
const footerLinks = (html: string) => hrefs(/<nav aria-label="Legal"[\s\S]*?<\/nav>/.exec(html)?.[0] ?? "");

test("live: every legal page, language and print version answers 200, twice", live, async () => {
  const failures: string[] = [];
  const addresses = [
    ...ALL_LEGAL.flatMap((p) => ["", "?lang=en", "?lang=es"].map((q) => p + q)),
    ...THREE.flatMap((p) => ["?print=1", "?print=1&lang=es"].map((q) => p + q)),
  ];
  for (const address of addresses) {
    for (const attempt of [1, 2]) {
      const res = await get(address);
      const html = await res.text();
      if (res.status !== 200) { failures.push(`${address} (request ${attempt}): HTTP ${res.status}`); break; }
      const lang = /lang=(en|es)/.exec(address)?.[1] as "en" | "es" | undefined;
      const doc = DOCS[pathOf(address) as keyof typeof DOCS];
      if (lang && doc && !html.includes(escapeHtml(doc[lang].title))) failures.push(`${address}: not shown in ${lang}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("live: other spellings answer 308 to the right page", live, async () => {
  const failures: string[] = [];
  for (const [source, destination] of LEGAL_REDIRECTS as [string, string][]) {
    const res = await get(source);
    const to = res.headers.get("location");
    const got = to ? new URL(to, BASE).pathname + new URL(to, BASE).search : null;
    if (res.status !== 308 || got !== destination) failures.push(`${source}: HTTP ${res.status} -> ${got}`);
  }
  assert.deepEqual(failures, []);
});

test("live: public pages show all three in the footer; the sitemap lists the legal pages", live, async () => {
  const failures: string[] = [];
  // Not the 404 page: Next 14 draws it in the browser, so its footer is not in the server's HTML.
  for (const page of ["/", "/about", "/events", "/resources", "/scholarships", "/get-involved", "/contact", "/gallery", "/unsubscribe", ...ALL_LEGAL]) {
    const res = await get(page);
    const links = footerLinks(await res.text());
    if (!THREE.every((p) => links.includes(p))) failures.push(`${page} (HTTP ${res.status}): footer has ${links.join(", ") || "no legal links"}`);
  }
  const xml = await (await get("/sitemap.xml")).text();
  for (const p of ALL_LEGAL) if (!new RegExp(`<loc>[^<]+${p}</loc>`).test(xml)) failures.push(`sitemap lacks ${p}`);
  assert.deepEqual(failures, []);
});
