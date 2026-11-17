import { groq } from "next-sanity";
import { seoFragment, sectionsFragment } from "./fragments";

export const getInvolvedPageQuery = groq`
  *[_id == "getInvolvedPage"][0]{
    ${seoFragment},
    ${sectionsFragment}
  }`;
export const GET_INVOLVED_TAGS = ["page:get-involved", "siteSettings", "sponsor"];
