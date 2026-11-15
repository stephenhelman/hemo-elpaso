import { groq } from "next-sanity";
import { seoFragment, sectionsFragment } from "./fragments";

export const resourcesPageQuery = groq`
  *[_id == "resourcesPage"][0]{
    ${seoFragment},
    ${sectionsFragment}
  }`;
export const RESOURCES_TAGS = ["page:resources", "resource", "siteSettings"];
