"use client";

import type { Lang } from "@/types";
import type { Section } from "@/sanity/types";
import PageHeroBlock from "./PageHeroBlock";
import RichTextBlock from "./RichTextBlock";
import CtaBannerBlock from "./CtaBannerBlock";
import PeopleGridBlock from "./PeopleGridBlock";

/** Maps a Sanity section to its component. Unknown types render nothing. */
export default function SectionRenderer({ section, locale }: { section: Section; locale: Lang }) {
  switch (section._type) {
    case "pageHero":
      return <PageHeroBlock block={section} locale={locale} />;
    case "richText":
      return <RichTextBlock block={section} locale={locale} />;
    case "ctaBanner":
      return <CtaBannerBlock block={section} locale={locale} />;
    case "peopleGrid":
      return <PeopleGridBlock block={section} locale={locale} />;
    default:
      return null;
  }
}
