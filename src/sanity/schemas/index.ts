import { localizedString, localizedText } from "./objects/localized";
import { localizedRichText, localizedHeading } from "./objects/portable";
import { link } from "./objects/link";
import { sectionHeader, pageSeo } from "./objects/sectionHeader";
import { siteSettings } from "./documents/siteSettings";
import { person } from "./documents/person";
import { scholarship } from "./documents/scholarship";
import { pageDocuments } from "./documents/pages";
import { pageHero, richText, ctaButton, ctaBanner, peopleGrid } from "./blocks/blocks";

export const schemaTypes = [
  localizedString,
  localizedText,
  localizedRichText,
  localizedHeading,
  link,
  sectionHeader,
  pageSeo,
  pageHero,
  richText,
  ctaButton,
  ctaBanner,
  peopleGrid,
  siteSettings,
  person,
  scholarship,
  ...pageDocuments,
];

/** Documents that exist exactly once, with a fixed _id equal to the type name. */
export const SINGLETON_TYPES = ["siteSettings", ...pageDocuments.map((d) => d.name)];
