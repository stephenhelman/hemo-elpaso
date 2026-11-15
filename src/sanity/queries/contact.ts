import { groq } from "next-sanity";
import { seoFragment } from "./fragments";

export const contactPageQuery = groq`
  *[_id == "contactPage"][0]{
    ${seoFragment},
    "hero": hero{ "_type": "pageHero", variant, decoration, width, eyebrow, heading, subheading },
    formHeading, formSubheading, mapHeader
  }`;
// The sidebar reads Site settings, so changes there refresh this page too.
export const CONTACT_TAGS = ["page:contact", "siteSettings"];
