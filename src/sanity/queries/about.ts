import { groq } from "next-sanity";
import { seoFragment, sectionsFragment } from "./fragments";

export const aboutPageQuery = groq`
  *[_id == "aboutPage"][0]{
    ${seoFragment},
    ${sectionsFragment}
  }`;
export const ABOUT_TAGS = ["page:about", "person", "siteSettings", "sponsor"];
