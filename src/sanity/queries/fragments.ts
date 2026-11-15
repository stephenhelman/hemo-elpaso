import { groq } from "next-sanity";

/** Every projection is an allow-list: nothing leaves the dataset unless it is named here. */
export const seoFragment = groq`seo{ title, description, "ogImage": ogImage.asset->url }`;
export const linkFragment = groq`{ label, type, value }`;
export const personFragment = groq`
  _id, name, group, order, office, title, bio,
  "photo": photo{ "url": asset->url, alt }`;
export const resourceFragment = groq`
  _id, name, nameEs, abbreviation, category, kicker, summary, body, facts,
  address, "phone": phone{ display, e164 },
  "meta": meta[]{ label, value },
  "link": link{ label, type, value },
  accent, icon, order`;
// lastVerified is deliberately NOT projected: it is an editor-only field.

export const sectionsFragment = groq`sections[]{
  _key, _type,
  _type == "pageHero"   => { variant, decoration, eyebrow, heading, subheading,
                             buttons[]{ style, link${linkFragment} }, badges[]{ text, icon } },
  _type == "richText"   => { header, body, background, width },
  _type == "ctaBanner"  => { heading, subheading, icon, background, showIfRegistrationOpen,
                             buttons[]{ style, icon, showIfRegistrationOpen, link${linkFragment} } },
  _type == "resourceList" => { header, category, layout, columns,
                             "items": *[_type == "resource" && category == ^.category && active == true]|order(order asc){ ${resourceFragment} } },
  _type == "peopleGrid" => { header, layout,
                             "people": *[_type == "person" && _id in ^.people[]._ref && active == true]|order(order asc){ ${personFragment} } }
}`;
