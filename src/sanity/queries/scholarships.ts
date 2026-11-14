import { groq } from "next-sanity";
import { seoFragment, sectionsFragment } from "./fragments";

export const scholarshipsPageQuery = groq`
  *[_id == "scholarshipsPage"][0]{
    ${seoFragment},
    ${sectionsFragment},
    "scholarship": featuredScholarship->{
      title, memorialNote, status, amount, recipients, semester, deadline, essayPrompt,
      eligibility[]{ title, body }
    }
  }`;
export const SCHOLARSHIPS_TAGS = ["page:scholarships", "scholarship", "person", "siteSettings"];
