/**
 * Today's Resources page content, expressed as Sanity documents. ONE source for both
 * the seed script (writes these) and the dictionary fallback (renders these when
 * Sanity is unreachable), so the two cannot drift apart.
 */
import {
  resourcesHeroTranslation,
  conditionCardsTranslation,
  nationalOrgTranslation,
  localResourcesTranslation,
  campProgramTranslation,
  insuranceResourcesTranslation,
} from "@/translation/resourcesPage";
import { localizedPt } from "./helpers/pt";
import type { ResourceItem } from "./types";

type L = { en: string; es: string };
const l = (en: string, es: string): L => ({ en, es });
const e164 = (display: string) => `+1${display.replace(/\D/g, "")}`;
const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const ext = (url: string, label?: L) => ({ type: "external", value: url, ...(label ? { label } : {}) });

export const DEFAULT_LINK_LABEL = { en: "Learn more", es: "Más información" };

export function resourceItems(): ResourceItem[] {
  const out: ResourceItem[] = [];
  const cEn = conditionCardsTranslation.en, cEs = conditionCardsTranslation.es;
  cEn.conditions.forEach((c, i) => {
    const es = cEs.conditions[i];
    out.push({
      _id: `resource-condition-${slug(c.abbr)}`, category: "condition", order: (i + 1) * 10,
      name: c.name, nameEs: es.name, abbreviation: c.abbr, accent: c.color,
      summary: l(c.body, es.body),
      facts: c.facts.map((f, j) => ({ _type: "localizedString", ...l(f, es.facts[j]) })),
      link: ext(c.link, l(c.linkLabel, es.linkLabel)),
      // the "What is it?" label is UI text and lives in code
    });
  });
  const nEn = nationalOrgTranslation.en, nEs = nationalOrgTranslation.es;
  nEn.orgs.forEach((o, i) => {
    const es = nEs.orgs[i];
    out.push({
      _id: `resource-nationalOrg-${slug(o.abbr)}`, category: "nationalOrg", order: (i + 1) * 10,
      name: o.name, nameEs: es.name, abbreviation: o.abbr, accent: o.color,
      summary: l(o.body, es.body), link: ext(o.link),
    } as any);
  });
  const lEn = localResourcesTranslation.en, lEs = localResourcesTranslation.es;
  lEn.providers.forEach((p, i) => {
    const es = lEs.providers[i];
    out.push({
      _id: `resource-localCare-${slug(p.abbr)}`, category: "localCare", order: (i + 1) * 10,
      name: p.name, nameEs: es.name, abbreviation: p.abbr, accent: p.color,
      kicker: l(p.type, es.type), summary: l(p.body, es.body),
      address: p.address, phone: { display: p.phone, e164: e164(p.phone) },
      link: ext(p.link, l("Visit Website", "Visitar sitio web")),
    } as any);
  });
  const kEn = campProgramTranslation.en, kEs = campProgramTranslation.es;
  kEn.camps.forEach((c, i) => {
    const es = kEs.camps[i];
    out.push({
      _id: `resource-youthProgram-${slug(c.name)}`, category: "youthProgram", order: (i + 1) * 10,
      name: c.name, nameEs: es.name, kicker: l(c.org, es.org), summary: l(c.body, es.body), icon: "sun",
      meta: [
        { _type: "metaItem", label: l("Ages", "Edades"), value: l(c.ages, es.ages) },
        { _type: "metaItem", label: l("Season", "Temporada"), value: l(c.season, es.season) },
        { _type: "metaItem", label: l("Cost", "Costo"), value: l(c.cost, es.cost) },
      ],
      link: ext(c.link, l("Learn More", "Más información")),
    } as any);
  });
  const iEn = insuranceResourcesTranslation.en, iEs = insuranceResourcesTranslation.es;
  iEn.resources.forEach((r, i) => {
    const es = iEs.resources[i];
    out.push({
      _id: `resource-financialHelp-${slug(r.title)}`, category: "financialHelp", order: (i + 1) * 10,
      name: r.title, nameEs: es.title, icon: r.icon, summary: l(r.body, es.body),
      link: (r as any).internal ? { type: "internal", value: r.link, label: l(r.cta, es.cta) } : ext(r.link, l(r.cta, es.cta)),
    } as any);
  });
  return out;
}

const header = (t: { en: any; es: any }) => ({
  eyebrow: l(t.en.eyebrow, t.es.eyebrow),
  heading: localizedPt(t.en.heading, t.es.heading),
  subheading: l(t.en.sub, t.es.sub),
  align: "center" as const,
});

/** Page sections in today's order. Resource lists carry no items here (the query fills them). */
export function resourcesSections() {
  const h = resourcesHeroTranslation;
  return [
    {
      _key: "hero", _type: "pageHero", variant: "compact", decoration: "one",
      eyebrow: l(h.en.eyebrow, h.es.eyebrow),
      heading: localizedPt(h.en.heading, h.es.heading),
      subheading: l(h.en.sub, h.es.sub),
    },
    { _key: "conditions", _type: "resourceList", category: "condition", layout: "rich", columns: 3, header: header(conditionCardsTranslation) },
    { _key: "national", _type: "resourceList", category: "nationalOrg", layout: "org", columns: 2, header: header(nationalOrgTranslation) },
    { _key: "local", _type: "resourceList", category: "localCare", layout: "provider", columns: 3, header: header(localResourcesTranslation) },
    { _key: "camps", _type: "resourceList", category: "youthProgram", layout: "program", columns: 2, header: header(campProgramTranslation) },
    { _key: "financial", _type: "resourceList", category: "financialHelp", layout: "linkCard", columns: 3, header: header(insuranceResourcesTranslation) },
  ];
}
