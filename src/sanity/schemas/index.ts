import { localizedString, localizedText } from "./objects/localized";
import { localizedRichText, localizedHeading } from "./objects/portable";
import { link, resourceLink } from "./objects/link";
import { sectionHeader, pageSeo } from "./objects/sectionHeader";
import { siteSettings } from "./documents/siteSettings";
import { person } from "./documents/person";
import { resource } from "./documents/resource";
import { scholarship } from "./documents/scholarship";
import { sponsor } from "./documents/sponsor";
import { pageDocuments } from "./documents/pages";
import { textWithAside, cardGrid, featuredPerson } from "./blocks/aboutBlocks";
import { statsRow, eventsFeed } from "./blocks/homeBlocks";
import { sponsorStrip } from "./blocks/sponsorBlocks";
import { pageHero, richText, ctaButton, ctaBanner, peopleGrid, resourceList } from "./blocks/blocks";

export const schemaTypes = [
  localizedString,
  localizedText,
  localizedRichText,
  localizedHeading,
  link,
  resourceLink,
  sectionHeader,
  pageSeo,
  pageHero,
  richText,
  ctaButton,
  ctaBanner,
  peopleGrid,
  resourceList,
  textWithAside,
  cardGrid,
  featuredPerson,
  statsRow,
  eventsFeed,
  sponsorStrip,
  siteSettings,
  person,
  scholarship,
  sponsor,
  resource,
  ...pageDocuments,
];

/** Documents that exist exactly once, with a fixed _id equal to the type name. */
export const SINGLETON_TYPES = ["siteSettings", ...pageDocuments.map((d) => d.name)];
