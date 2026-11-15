/**
 * Today's Get Involved page as Sanity data (one source for the seed and the dictionary fallback).
 * Sponsorship tiers are NOT part of the page: that section stays hidden and dormant in code.
 */
import { getInvolvedHeroTranslation, waysToHelpTranslation, getInvolvedCTATranslation } from "@/translation/getInvolvedPage";
import { Clock, DollarSign, Megaphone, Heart } from "lucide-react";
import { localizedPt } from "./helpers/pt";

type L = { en: string; es: string };
const l = (en: string, es: string): L => ({ en, es });

// The dictionary stores Lucide components; Sanity stores an icon key.
const ICON_KEY = new Map<unknown, string>([
  [Clock, "clock"], [DollarSign, "dollarSign"], [Megaphone, "megaphone"], [Heart, "heart"],
]);

export function getInvolvedSections() {
  const h = getInvolvedHeroTranslation, w = waysToHelpTranslation, c = getInvolvedCTATranslation;
  return [
    {
      _key: "hero", _type: "pageHero", variant: "compact", decoration: "two",
      eyebrow: l(h.en.eyebrow, h.es.eyebrow),
      heading: localizedPt(h.en.heading, h.es.heading),
      subheading: l(h.en.sub, h.es.sub),
    },
    {
      _key: "ways", _type: "cardGrid", variant: "iconSquareLink", columns: 2, background: "neutral",
      header: {
        eyebrow: l(w.en.eyebrow, w.es.eyebrow),
        heading: localizedPt(w.en.heading, w.es.heading),
        subheading: l(w.en.sub, w.es.sub),
        align: "center",
      },
      cards: w.en.ways.map((way, i) => {
        const es = w.es.ways[i];
        return {
          _type: "card",
          icon: ICON_KEY.get(way.icon) ?? "heart",
          accent: way.color,
          title: l(way.title, es.title),
          body: l(way.body, es.body),
          link: { type: "internal", value: way.anchor, label: l(way.cta, es.cta) },
        };
      }),
    },
    {
      _key: "cta", _type: "ctaBanner", background: "white",
      heading: l(c.en.heading, c.es.heading),
      subheading: l(c.en.sub, c.es.sub),
      buttons: [
        { _type: "ctaButton", style: "primary", icon: "arrowRight", link: { type: "internal", value: "/contact", label: l(c.en.cta1, c.es.cta1) } },
        { _type: "ctaButton", style: "outline", link: { type: "internal", value: "/contact", label: l(c.en.cta2, c.es.cta2) } },
      ],
    },
  ];
}
