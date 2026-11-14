import { groq } from "next-sanity";

/** Every projection is an allow-list: nothing leaves the dataset unless it is named here. */
export const seoFragment = groq`seo{ title, description, "ogImage": ogImage.asset->url }`;
export const linkFragment = groq`{ label, type, value }`;
export const personFragment = groq`
  _id, name, group, order, office, title, bio,
  "photo": photo{ "url": asset->url, alt }`;
export const sectionsFragment = groq`sections[]{
  _key, _type,
  _type == "pageHero"   => { variant, eyebrow, heading, subheading,
                             buttons[]{ style, link${linkFragment} }, badges[]{ text, icon } },
  _type == "richText"   => { header, body, background, width },
  _type == "ctaBanner"  => { heading, subheading, icon, background, showIfRegistrationOpen,
                             buttons[]{ style, icon, showIfRegistrationOpen, link${linkFragment} } },
  _type == "peopleGrid" => { header, layout,
                             "people": people[]->[active == true]|order(order asc){ ${personFragment} } }
}`;
