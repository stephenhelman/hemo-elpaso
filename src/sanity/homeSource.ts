/** Today's home page as Sanity data (one source for the seed and the dictionary fallback). */
import { homeHeroTranslation, impactStatsTranslation, upcomingEventsTranslation } from "@/translation/homePage";
import { registerInfoSectionTranslation } from "@/translation/registerInfoPage";
import { ptBlock } from "./helpers/pt";

type L = { en: string; es: string };
const l = (en: string, es: string): L => ({ en, es });

/**
 * Heading as portable text with the accent ("emphasis") mark on one word, replacing the old
 * word-matching hack. "Giving Hope To Our Community" → [Giving ][Hope*][ To Our Community].
 */
function emphasised(text: string, word: string) {
  const i = text.indexOf(word);
  if (i < 0) return [ptBlock(text)];
  const span = (t: string, k: string, marks: string[] = []) => ({ _type: "span", _key: k, text: t, marks });
  const children = [
    ...(i > 0 ? [span(text.slice(0, i), "s0")] : []),
    span(word, "s1", ["emphasis"]),
    ...(i + word.length < text.length ? [span(text.slice(i + word.length), "s2")] : []),
  ];
  return [{ _type: "block", _key: "b0", style: "normal", markDefs: [], children }];
}

export function homeSections() {
  const h = homeHeroTranslation, s = impactStatsTranslation, u = upcomingEventsTranslation, r = registerInfoSectionTranslation;
  return [
    {
      _key: "hero", _type: "pageHero", variant: "full",
      eyebrow: l(h.en.eyebrow, h.es.eyebrow),
      heading: { en: emphasised(h.en.heading, "Hope"), es: emphasised(h.es.heading, "Esperanza") },
      subheading: l(h.en.subheading, h.es.subheading),
      buttons: [
        { _type: "heroButton", style: "primary", link: { type: "internal", value: "/get-involved", label: l(h.en.cta1, h.es.cta1) } },
        { _type: "heroButton", style: "outline", link: { type: "internal", value: "/events", label: l(h.en.cta2, h.es.cta2) } },
      ],
      badges: [
        { _type: "heroBadge", icon: "heart", text: l(h.en.badge1, h.es.badge1) },
        { _type: "heroBadge", icon: "users", text: l(h.en.badge2, h.es.badge2) },
      ],
    },
    {
      _key: "stats", _type: "statsRow",
      header: { heading: { en: [ptBlock(s.en.heading)], es: [ptBlock(s.es.heading)] }, subheading: l(s.en.sub, s.es.sub), align: "center" },
      stats: s.en.stats.map((st, i) => {
        const es = s.es.stats[i];
        const years = (st as any).computed === "years";
        return {
          _type: "stat",
          source: years ? "yearsOfService" : "manual",
          ...(years ? {} : { value: st.value }),
          suffix: st.suffix,
          label: l(st.label, es.label),
          animate: true,
        };
      }),
    },
    {
      _key: "events", _type: "eventsFeed", limit: 3, showViewAllLink: true,
      header: { heading: { en: [ptBlock(u.en.title)], es: [ptBlock(u.es.title)] }, subheading: l(u.en.subtitle, u.es.subtitle), align: "center" },
    },
    {
      _key: "register", _type: "ctaBanner", background: "primary", icon: "clipboardList", showIfRegistrationOpen: true,
      heading: l(r.en.heading, r.es.heading),
      subheading: l(r.en.sub, r.es.sub),
      buttons: [{ _type: "ctaButton", style: "primary", link: { type: "internal", value: "/register-info", label: l(r.en.cta, r.es.cta) } }],
    },
  ];
}
