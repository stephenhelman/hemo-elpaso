"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { Section } from "@/sanity/types";
import SectionRenderer from "./SectionRenderer";
import CardGridBlock from "./CardGridBlock";
import { sectionAnchors } from "@/sanity/helpers/anchors";

type Grid = Extract<Section, { _type: "cardGrid" }>;

/**
 * Renders a page's sections in order. Both languages are already in the props; the language
 * comes from context. A card grid marked "continues previous" joins the previous grid's band.
 */
export default function PageSections({ sections }: { sections: Section[] }) {
  const { locale } = useLanguage();

  const anchors = sectionAnchors(sections);

  const out: React.ReactNode[] = [];
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (s._type === "cardGrid") {
      const group: Grid[] = [s];
      while (i + 1 < sections.length) {
        const next = sections[i + 1];
        if (next._type === "cardGrid" && next.continuesPrevious) {
          group.push(next);
          i++;
        } else break;
      }
      out.push(<CardGridBlock key={s._key} blocks={group} locale={locale} />);
    } else {
      out.push(<SectionRenderer key={s._key} section={s} locale={locale} anchorId={anchors[s._key]} />);
    }
  }
  return <>{out}</>;
}
