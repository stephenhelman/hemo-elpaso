import { groq } from "next-sanity";
import { seoFragment, sectionsFragment } from "./fragments";

export const homePageQuery = groq`
  *[_id == "homePage"][0]{
    ${seoFragment},
    ${sectionsFragment}
  }`;
// The events themselves come from Postgres, so only the page and site settings are tagged here.
export const HOME_TAGS = ["page:home", "siteSettings", "sponsor"];
