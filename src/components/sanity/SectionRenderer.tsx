"use client";

import type { Lang } from "@/types";
import type { Section } from "@/sanity/types";
import PageHeroBlock from "./PageHeroBlock";
import RichTextBlock from "./RichTextBlock";
import CtaBannerBlock from "./CtaBannerBlock";
import PeopleGridBlock from "./PeopleGridBlock";
import ResourceListBlock from "./ResourceListBlock";
import StatsRowBlock from "./StatsRowBlock";
import EventsFeedBlock from "./EventsFeedBlock";
import TextWithAsideBlock from "./TextWithAsideBlock";
import CardGridBlock from "./CardGridBlock";
import FeaturedPersonBlock from "./FeaturedPersonBlock";

/** Maps a Sanity section to its component. Unknown types render nothing. */
export default function SectionRenderer({ section, locale }: { section: Section; locale: Lang }) {
  switch (section._type) {
    case "pageHero":
      return <PageHeroBlock block={section} locale={locale} />;
    case "richText":
      return <RichTextBlock block={section} locale={locale} />;
    case "ctaBanner":
      return <CtaBannerBlock block={section} locale={locale} />;
    case "statsRow":
      return <StatsRowBlock block={section} locale={locale} />;
    case "eventsFeed":
      return <EventsFeedBlock block={section} locale={locale} />;
    case "textWithAside":
      return <TextWithAsideBlock block={section} locale={locale} />;
    case "cardGrid":
      return <CardGridBlock blocks={[section]} locale={locale} />;
    case "featuredPerson":
      return <FeaturedPersonBlock block={section} locale={locale} />;
    case "resourceList":
      return <ResourceListBlock block={section} locale={locale} />;
    case "peopleGrid":
      return <PeopleGridBlock block={section} locale={locale} />;
    default:
      return null;
  }
}
