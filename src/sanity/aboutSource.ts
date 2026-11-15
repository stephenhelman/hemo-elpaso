/**
 * Today's About page, expressed as Sanity data. ONE source for the seed (writes it) and
 * the dictionary fallback (renders it when Sanity is unreachable), so they cannot drift.
 * Numbers that the live page computes use the tokens {decadeYears} / {decades}.
 */
import {
  aboutHeroTranslation,
  founderStoryTranslation,
  missionValuesTranslation,
  founderSpotlightTranslation,
  boardOfDirectors,
  boardOfDirectorsTranslation,
  aboutCTATranslation,
} from "@/translation/aboutPage";
import { localizedPt, localizedPtMulti } from "./helpers/pt";

type L = { en: string; es: string };
const l = (en: string, es: string): L => ({ en, es });
/** The seed documents use {decades} (documented token); the dictionary still says {Decades}. */
const tok = (s: string) => s.replace(/\{Decades\}/g, "{decades}");

export const ABOUT_IDS = {
  founder: "person-lou-anne-fetters",
  teresita: "person-teresita-fernandez-de-robles",
};

const header = (eyebrow: L | null, heading: L | null, sub: L | null, wide = false) => ({
  ...(eyebrow ? { eyebrow } : {}),
  ...(heading ? { heading: localizedPt(tok(heading.en), tok(heading.es)) } : {}),
  ...(sub ? { subheading: sub } : {}),
  ...(wide ? { subWidth: "wide" } : {}),
  align: "center",
});

const iconOf = (k: string) => k; // bookOpen | heart | users | globe: already ICON_OPTIONS keys

export type AboutRefs = {
  founder: any; // person doc (resolved shape) or { _ref } for the seed
  teresita: any;
  pastPresidents: { _id: string; name: string }[];
};

/** Sections in today's order. `refs` supplies the person fields (references in the seed, resolved objects in the fallback). */
export function aboutSections(refs: AboutRefs) {
  const h = aboutHeroTranslation, s = founderStoryTranslation, m = missionValuesTranslation;
  const f = founderSpotlightTranslation, b = boardOfDirectorsTranslation, c = aboutCTATranslation;

  const card = (x: { icon: string; title: string; body: string }, es: { title: string; body: string }) => ({
    _type: "card", emoji: x.icon, title: l(x.title, es.title), body: l(x.body, es.body), accent: "primary",
  });
  const value = (en: any, es: any) => ({
    _type: "card", icon: iconOf(en.icon), title: l(en.title, es.title), body: l(en.body, es.body), accent: "primary",
  });

  return [
    {
      _key: "hero", _type: "pageHero", variant: "compact", decoration: "one", width: "wide",
      eyebrow: l(h.en.eyebrow, h.es.eyebrow),
      heading: localizedPt(tok(h.en.heading), tok(h.es.heading)),
      subheading: l(tok(h.en.sub), tok(h.es.sub)),
    },
    {
      _key: "story", _type: "textWithAside",
      eyebrow: l(s.en.eyebrow, s.es.eyebrow),
      heading: localizedPt(s.en.heading, s.es.heading),
      body: localizedPtMulti(s.en.paragraphs.map(tok), s.es.paragraphs.map(tok)),
      credit: refs.founder,
      creditTitle: l(s.en.founderTitle, s.es.founderTitle),
      aside: "both",
      foundedLabel: l("Year Founded", "Año de Fundación"),
      foundedCaption: l("Over {decadeYears} years serving the El Paso bleeding disorders community", "Más de {decadeYears} años sirviendo a la comunidad de trastornos hemorrágicos de El Paso"),
      pastPresidentsHeading: l(s.en.hallOfFame, s.es.hallOfFame),
      pastPresidents: refs.pastPresidents,
    },
    {
      _key: "mission", _type: "cardGrid", variant: "emojiCard", columns: 3, background: "neutral",
      header: header(l(m.en.missionEyebrow, m.es.missionEyebrow), l(m.en.missionHeading, m.es.missionHeading), null),
      cards: [
        card(m.en.mission, m.es.mission), card(m.en.objective, m.es.objective), card(m.en.goal, m.es.goal),
      ],
    },
    {
      _key: "values", _type: "cardGrid", variant: "iconCircle", columns: 4, background: "neutral", continuesPrevious: true,
      header: header(null, l(m.en.valuesHeading, m.es.valuesHeading), null),
      cards: m.en.values.map((v, i) => value(v, m.es.values[i])),
    },
    {
      _key: "spotlight", _type: "featuredPerson", background: "dark",
      eyebrow: l(f.en.eyebrow, f.es.eyebrow),
      subtitle: l(f.en.founded, f.es.founded),
      quote: l(f.en.quote, f.es.quote),
      body: localizedPt(tok(f.en.body), tok(f.es.body)),
      badges: [l(f.en.badge1, f.es.badge1), l(f.en.badge2, f.es.badge2), l(f.en.badge3, f.es.badge3)].map((x) => ({ _type: "localizedString", en: tok(x.en), es: tok(x.es) })),
      person: refs.founder,
    },
    {
      _key: "board", _type: "peopleGrid", layout: "card",
      header: header(l(b.en.eyebrow, b.es.eyebrow), l(b.en.heading, b.es.heading), l(b.en.sub, b.es.sub), true),
      people: [refs.teresita],
    },
    {
      _key: "cta", _type: "ctaBanner", background: "neutral",
      heading: l(c.en.heading, c.es.heading),
      subheading: l(c.en.sub, c.es.sub),
      buttons: [
        { _type: "ctaButton", style: "primary", icon: "arrowRight", link: { type: "internal", value: "/get-involved", label: l(c.en.cta1, c.es.cta1) } },
        { _type: "ctaButton", style: "outline", icon: "mail", link: { type: "internal", value: "/contact", label: l(c.en.cta2, c.es.cta2) } },
      ],
    },
  ];
}

/** Resolved person shapes for the fallback (what the query would return). */
export function aboutFallbackRefs(): AboutRefs {
  const f = founderSpotlightTranslation;
  const s = founderStoryTranslation;
  const t = boardOfDirectors.officers[0];
  return {
    founder: { _id: ABOUT_IDS.founder, name: f.en.name, group: "founder", title: l(f.en.title, f.es.title), photo: null },
    teresita: { _id: ABOUT_IDS.teresita, name: t.name, group: "officer", office: l(t.titleEn ?? "", t.titleEs ?? ""), photo: null },
    pastPresidents: s.en.hallNames.map((name, i) => ({ _id: `fallback-hall-${i}`, name })),
  };
}
