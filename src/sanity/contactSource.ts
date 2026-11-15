/** Today's Contact page copy as Sanity data (one source for the seed and the dictionary fallback). */
import { contactHeroTranslation, contactFormTranslation, contactMapTranslation } from "@/translation/contactPage";
import { localizedPt } from "./helpers/pt";

type L = { en: string; es: string };
const l = (en: string, es: string): L => ({ en, es });

export function contactPageFields() {
  const h = contactHeroTranslation, f = contactFormTranslation, m = contactMapTranslation;
  return {
    hero: {
      _type: "pageHero", variant: "compact", decoration: "one", width: "narrow",
      eyebrow: l(h.en.eyebrow, h.es.eyebrow),
      heading: localizedPt(h.en.heading, h.es.heading),
      subheading: l(h.en.sub, h.es.sub),
    },
    formHeading: l(f.en.heading, f.es.heading),
    formSubheading: l(f.en.sub, f.es.sub),
    mapHeader: {
      heading: localizedPt(m.en.heading, m.es.heading),
      subheading: l(m.en.sub, m.es.sub),
      align: "center",
    },
  };
}
