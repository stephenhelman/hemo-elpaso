/**
 * Seeds Sanity with what the live site shows today.
 *
 *   npx tsx scripts/seed-sanity.ts            # dry run: prints what it would write
 *   SANITY_WRITE_TOKEN=... npx tsx scripts/seed-sanity.ts --write
 *
 * - Needs a token with WRITE access (Editor role). It is used by this script ONLY:
 *   never put it in the app's environment or in a NEXT_PUBLIC_ variable.
 * - Idempotent and non-destructive: documents have fixed ids and are created only if
 *   missing; existing ones (edited text, uploaded photos) are left alone. Pass
 *   --overwrite to reset them to the seed text on purpose.
 * - `--repair` (needs the token): adds missing `_type` markers to list rows in existing documents
 *   (so the Studio stops flagging them) without changing anything else.
 * - No emails, no photos. Nobody is added who is not already shown on the live site.
 */
import { createClient } from "@sanity/client";
import { footerTranslation } from "../src/translation/layoutPage";
import { contactInfoTranslation } from "../src/translation/contactPage";
import { founderSpotlightTranslation, founderStoryTranslation } from "../src/translation/aboutPage";
import { scholarshipCardTranslation } from "../src/translation/scholarshipsPage";
import { FACEBOOK_LABEL, FACEBOOK_URL, SITE_PHONE } from "../src/lib/site";
import { scholarshipsPageFallback } from "../src/sanity/fallback";
import { ptSimple } from "../src/sanity/helpers/pt";
import { resourceItems, resourcesSections } from "../src/sanity/resourcesSource";
import { aboutSections, ABOUT_IDS } from "../src/sanity/aboutSource";
import { getInvolvedSections } from "../src/sanity/getInvolvedSource";
import { contactPageFields } from "../src/sanity/contactSource";
import { homeSections } from "../src/sanity/homeSource";
import { projectId, dataset, apiVersion } from "../src/sanity/env";

const WRITE = process.argv.includes("--write");

const ids = {
  settings: "siteSettings",
  page: "scholarshipsPage",
  scholarship: "scholarship-memorial",
  teresita: "person-teresita-fernandez-de-robles",
  founder: "person-lou-anne-fetters",
  coles: "person-rosamaria-coles",
  garcia: "person-felix-garcia",
  ortiz: "person-yolanda-ortiz",
};

/** Add `_key` to every object inside arrays that lacks one (Sanity requires it). */
function withKeys<T>(v: T, path = "k"): T {
  if (Array.isArray(v)) {
    return v.map((item: any, i) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? withKeys({ _key: item._key ?? `${path}${i}`, ...item }, `${path}${i}`)
        : withKeys(item, `${path}${i}`),
    ) as any;
  }
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v as any).map(([k, x]) => [k, withKeys(x, `${path}_${k}`)])) as any;
  }
  return v;
}

const f = footerTranslation;
const c = contactInfoTranslation;
const fs = founderSpotlightTranslation;
const card = scholarshipCardTranslation;
const fallback = scholarshipsPageFallback();

export const docs: any[] = [
  {
    _id: ids.settings,
    _type: "siteSettings",
    orgName: "Hemophilia Outreach of El Paso",
    tagline: { en: f.en.tagline, es: f.es.tagline },
    phone: { display: SITE_PHONE.display, e164: SITE_PHONE.e164 },
    facebookUrl: FACEBOOK_URL,
    facebookLabel: { ...FACEBOOK_LABEL },
    locationLabel: { en: c.en.addrVal, es: c.es.addrVal },
    contactNote: { en: c.en.note, es: c.es.note },
    footerText: { en: f.en.rights, es: f.es.rights },
    defaultSeo: {
      title: { en: "Hemophilia Outreach of El Paso", es: "Hemophilia Outreach of El Paso" },
      description: {
        en: "Supporting individuals and families affected by bleeding disorders in the El Paso community since 1993.",
        es: "Apoyando a individuos y familias afectadas por trastornos hemorrágicos en la comunidad de El Paso desde 1993.",
      },
      // ogImage: upload in the Studio (Site settings > SEO). Until then the site serves src/app/opengraph-image.png.
    },
  },
  {
    _id: ids.teresita,
    _type: "person",
    name: "Teresita Fernandez de Robles",
    group: "officer",
    office: { en: "President", es: "Presidenta" },
    order: 1,
    active: true,
  },
  {
    _id: ids.founder,
    _type: "person",
    name: "Lou Anne Fetters",
    group: "founder",
    title: { en: fs.en.title, es: fs.es.title },
    // The live About page computes "three decades" from the founding year; this copy avoids a number so it cannot go stale.
    bio: {
      en: ptSimple(fs.en.body.replace("across {decades} decades", "over the decades")),
      es: ptSimple(fs.es.body.replace("durante {decades} décadas", "a lo largo de las décadas")),
    },
    order: 1,
    active: true,
  },
  ...[
    [ids.coles, "Rosamaria Coles", 10],
    [ids.garcia, "Felix Garcia", 11],
    [ids.ortiz, "Yolanda Ortiz", 12],
  ].map(([_id, name, order]) => ({ _id, _type: "person", name, group: "pastPresident", order, active: true })),
  {
    _id: ids.scholarship,
    _type: "scholarship",
    title: { en: card.en.heading, es: card.es.heading },
    memorialNote: { en: card.en.in_memory, es: card.es.in_memory },
    status: "comingSoon",
  },
  withKeys({
    _id: ids.page,
    _type: "scholarshipsPage",
    seo: {
      title: { en: "Scholarships", es: "Becas" },
      description: {
        en: "The Jesus M. Terrazas and Luis Ostos Memorial Scholarship, offered by Hemophilia Outreach of El Paso (HOEP) to students affected by bleeding disorders. The next cycle is coming soon.",
        es: "La Beca Conmemorativa Jesus M. Terrazas y Luis Ostos, ofrecida por Hemophilia Outreach of El Paso (HOEP) a estudiantes afectados por trastornos hemorrágicos. El próximo ciclo llegará pronto.",
      },
    },
    featuredScholarship: { _type: "reference", _ref: ids.scholarship },
    sections: fallback.sections.map((s: any) =>
      s._type === "peopleGrid"
        ? { ...s, people: [{ _type: "reference", _ref: ids.teresita }] }
        : s,
    ),
  }),
];

// ---- Resources (Phase 5B) -------------------------------------------------------------------
// Every current resource, with today's EN/ES text. lastVerified = the day the seed runs
// (the people who maintain the site have just reviewed this content).
const today = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

docs.push(
  ...resourceItems().map((r: any) => ({
    _type: "resource",
    ...r,
    active: true,
    lastVerified: today,
  })),
  withKeys({
    _id: "resourcesPage",
    _type: "resourcesPage",
    seo: {
      title: { en: "Resources", es: "Recursos" },
      description: {
        en: "Access educational resources, connect with national hemophilia organizations, find local healthcare providers, and discover support services for families affected by bleeding disorders in El Paso, Texas.",
        es: "Acceda a recursos educativos, conéctese con organizaciones nacionales de hemofilia, encuentre proveedores de atención médica locales y descubra servicios de apoyo para familias afectadas por trastornos hemorrágicos en El Paso, Texas.",
      },
    },
    sections: resourcesSections(),
  }),
);

// ---- About page (Phase 5C) --------------------------------------------------------------------
// Today's About page. No new people: it references Lou Anne Fetters (founder) and Teresita
// (president), who are seeded above. Numbers the live page computes use {decadeYears}/{decades}.
const ref = (_ref: string) => ({ _type: "reference", _ref });
docs.push(
  withKeys({
    _id: "aboutPage",
    _type: "aboutPage",
    seo: {
      title: { en: "About Us", es: "Sobre Nosotros" },
      description: {
        en: "Learn about Hemophilia Outreach of El Paso (HOEP), founded in 1993 by Lou Anne Fetters to support families affected by bleeding disorders in the El Paso community.",
        es: "Conozca la Hemophilia Outreach of El Paso (HOEP), fundada en 1993 por Lou Anne Fetters para apoyar a familias afectadas por trastornos hemorrágicos en la comunidad de El Paso.",
      },
    },
    sections: aboutSections({ founder: ref(ABOUT_IDS.founder), teresita: ref(ABOUT_IDS.teresita), pastPresidents: undefined as any }),
  }),
);

// ---- Get Involved + Contact (Phase 5D) --------------------------------------------------------
// Today's text. Sponsorship tiers are NOT seeded: that section stays hidden and dormant in code.
docs.push(
  withKeys({
    _id: "getInvolvedPage",
    _type: "getInvolvedPage",
    seo: {
      title: { en: "Get Involved", es: "Involúcrese" },
      description: {
        en: "Join the Hemophilia Outreach of El Paso (HOEP) community as a volunteer, sponsor, or supporter. Make a difference in the lives of families affected by bleeding disorders. Explore ways to volunteer and sponsor.",
        es: "Únase a la comunidad de la Hemophilia Outreach of El Paso (HOEP) como voluntario, patrocinador o colaborador. Haga una diferencia en las vidas de familias afectadas por trastornos hemorrágicos. Explore formas de ser voluntario y patrocinar.",
      },
    },
    sections: getInvolvedSections(),
  }),
  withKeys({
    _id: "contactPage",
    _type: "contactPage",
    seo: {
      title: { en: "Contact Us", es: "Contáctenos" },
      description: {
        en: "Get in touch with Hemophilia Outreach of El Paso (HOEP). We are here to help families affected by bleeding disorders. Reach out for support, questions, or to get involved in our community.",
        es: "Comuníquese con la Hemophilia Outreach of El Paso (HOEP). Estamos aquí para ayudar a familias afectadas por trastornos hemorrágicos. Contáctenos para apoyo, preguntas o para involucrarse en nuestra comunidad.",
      },
    },
    ...contactPageFields(),
  }),
);

// ---- Home (Phase 5E) --------------------------------------------------------------------------
// Today's home page: hero (with the accent word as an "emphasis" mark), stats (years of service computed),
// events feed (events come from Postgres) and the register band (shown only while registration is open).
docs.push(
  withKeys({
    _id: "homePage",
    _type: "homePage",
    seo: {
      title: { en: "Hemophilia Outreach of El Paso", es: "Hemophilia Outreach of El Paso" },
      description: {
        en: "Supporting individuals and families affected by bleeding disorders in the El Paso community since 1993. Educational events, financial assistance, and community support for hemophilia and bleeding disorders.",
        es: "Apoyando a individuos y familias afectadas por trastornos hemorrágicos en la comunidad de El Paso desde 1993. Eventos educativos, asistencia financiera y apoyo comunitario para hemofilia y trastornos hemorrágicos.",
      },
    },
    sections: homeSections(),
  }),
);

// ---- --repair: fix existing documents without touching their content --------------------------
// Older seeds wrote list rows without `_type`, which the Studio flags as invalid items. --repair adds the
// missing `_type`s to documents that already exist (nothing else changes) and writes only the ones that need it.
const MEMBER_TYPES: Record<string, Record<string, string>> = {
  // parent _type -> { array field -> member _type }
  pageHero: { buttons: "heroButton", badges: "heroBadge" },
  statsRow: { stats: "stat" },
  ctaBanner: { buttons: "ctaButton" },
  featuredPerson: { badges: "localizedString" },
  cardGrid: { cards: "card" },
  resource: { facts: "localizedString", meta: "metaItem" },
  scholarship: { eligibility: "eligibilityItem" },
};
export function repairTypes(node: any, parentType?: string): { value: any; changed: number } {
  let changed = 0;
  const walk = (n: any, ptype?: string): any => {
    if (Array.isArray(n)) return n.map((x) => walk(x, ptype));
    if (n && typeof n === "object") {
      const type = typeof n._type === "string" ? n._type : ptype;
      const out: any = {};
      for (const [k, v] of Object.entries(n)) {
        const member = MEMBER_TYPES[n._type ?? ""]?.[k];
        if (member && Array.isArray(v)) {
          out[k] = v.map((item: any) => {
            const fixed = walk(item, member);
            if (fixed && typeof fixed === "object" && !fixed._type) { changed++; return { ...fixed, _type: member }; }
            return fixed;
          });
        } else out[k] = walk(v, type);
      }
      return out;
    }
    return n;
  };
  return { value: walk(node, parentType), changed };
}

async function repair() {
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) throw new Error("SANITY_WRITE_TOKEN is not set");
  const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });
  const existing: any[] = await client.fetch(`*[_id in $ids]`, { ids: docs.map((d) => d._id) });
  const tx = client.transaction();
  let touched = 0;
  for (const d of existing) {
    const { value, changed } = repairTypes(d);
    if (changed > 0) { touched++; tx.createOrReplace(value); console.log(`  repaired ${changed} list row(s): ${d._type} ${d._id}`); }
    else console.log(`  fine: ${d._type} ${d._id}`);
  }
  if (touched > 0) await tx.commit();
  console.log(`Repair done: ${touched} document(s) changed. Content, photos and edits are untouched; only missing _type markers were added.`);
}

async function main() {
  if (process.argv.includes("--repair")) {
    if (!WRITE) {
      console.log("Repair is a write operation: run with --repair --write and SANITY_WRITE_TOKEN set. It only adds missing _type markers to list rows; nothing else changes.");
      return;
    }
    return repair();
  }
  console.log(`Sanity seed: project ${projectId}, dataset ${dataset}, ${docs.length} documents`);
  const OVERWRITE = process.argv.includes("--overwrite");
  if (!WRITE) {
    for (const d of docs) console.log(`  would ${OVERWRITE ? "create or REPLACE" : "create if missing"}: ${d._type} ${d._id}`);
    console.log("\nDry run. Re-run with --write and SANITY_WRITE_TOKEN set to apply.");
    console.log("By default existing documents are LEFT ALONE (editors' changes and uploads are safe). --overwrite resets them to the seed text.");
    return;
  }
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) throw new Error("SANITY_WRITE_TOKEN is not set");
  const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });
  const existing = new Set<string>(await client.fetch(`*[_id in $ids]._id`, { ids: docs.map((d) => d._id) }));
  const tx = client.transaction();
  let created = 0, skipped = 0, replaced = 0;
  for (const d of docs) {
    if (existing.has(d._id) && !OVERWRITE) { skipped++; console.log(`  exists, left alone: ${d._type} ${d._id}`); continue; }
    if (existing.has(d._id)) { replaced++; tx.createOrReplace(d); console.log(`  REPLACED: ${d._type} ${d._id}`); }
    else { created++; tx.create(d); console.log(`  created: ${d._type} ${d._id}`); }
  }
  await tx.commit();
  console.log(`Done: ${created} created, ${skipped} left alone, ${replaced} replaced. Documents are written as published; review them in /admin/studio.`);
}

if (process.argv[1]?.endsWith("seed-sanity.ts")) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
