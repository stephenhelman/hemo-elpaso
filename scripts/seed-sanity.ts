/**
 * Seeds Sanity with what the live site shows today.
 *
 *   npx tsx scripts/seed-sanity.ts            # dry run: prints what it would write
 *   SANITY_WRITE_TOKEN=... npx tsx scripts/seed-sanity.ts --write
 *
 * - Needs a token with WRITE access (Editor role). It is used by this script ONLY:
 *   never put it in the app's environment or in a NEXT_PUBLIC_ variable.
 * - Idempotent: documents have fixed ids and are written with createOrReplace, so
 *   re-running RESETS those documents to the seed content. Do not re-run after
 *   editors have changed them unless that is what you want.
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

const docs: any[] = [
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

async function main() {
  console.log(`Sanity seed: project ${projectId}, dataset ${dataset}, ${docs.length} documents`);
  for (const d of docs) console.log(`  ${WRITE ? "write" : "would write"}: ${d._type} ${d._id}`);
  if (!WRITE) {
    console.log("\nDry run. Re-run with --write and SANITY_WRITE_TOKEN set to apply.");
    return;
  }
  const token = process.env.SANITY_WRITE_TOKEN;
  if (!token) throw new Error("SANITY_WRITE_TOKEN is not set");
  const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });
  const tx = client.transaction();
  for (const d of docs) tx.createOrReplace(d);
  await tx.commit();
  console.log("Done. Documents were written as published. Open /admin/studio to review them.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
