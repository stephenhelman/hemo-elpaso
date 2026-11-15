import { groq } from "next-sanity";

/** Every projection is an allow-list: nothing leaves the dataset unless it is named here. */
export const seoFragment = groq`seo{ title, description, "ogImage": ogImage.asset->url }`;
export const linkFragment = groq`{ label, type, value }`;
export const personFragment = groq`
  _id, name, group, order, office, title, bio,
  "photo": photo{ "v": asset._ref, alt }`;  // asset ref only: images are served by /api/people-photo (private dataset)
export const resourceFragment = groq`
  _id, name, nameEs, abbreviation, category, kicker, summary, body, facts,
  address, "phone": phone{ display, e164 },
  "meta": meta[]{ label, value },
  "link": link{ label, type, value },
  accent, icon, order`;
// lastVerified is deliberately NOT projected: it is an editor-only field.

export const sectionsFragment = groq`sections[]{
  _key, _type,
  _type == "pageHero"   => { variant, decoration, width, eyebrow, heading, subheading,
                             buttons[]{ style, link${linkFragment} }, badges[]{ text, icon } },
  _type == "richText"   => { header, body, background, width },
  _type == "ctaBanner"  => { heading, subheading, icon, background, showIfRegistrationOpen,
                             buttons[]{ style, icon, showIfRegistrationOpen, link${linkFragment} } },
  _type == "resourceList" => { header, category, layout, columns,
                             "items": *[_type == "resource" && category == ^.category && active == true]|order(order asc){ ${resourceFragment} } },
  _type == "textWithAside" => { eyebrow, heading, body, creditTitle, aside, foundedLabel, foundedCaption, pastPresidentsHeading,
                             "credit": credit->{ ${personFragment} },
                             "pastPresidents": *[_type == "person" && active == true && group in ["founder", "pastPresident"]]|order(order asc){ _id, name } },
  _type == "cardGrid"   => { header, variant, columns, background, continuesPrevious,
                             cards[]{ _key, icon, emoji, title, body, accent, link{ label, type, value } } },
  _type == "featuredPerson" => { eyebrow, subtitle, quote, body, badges, background, "person": person->{ ${personFragment} } },
  _type == "peopleGrid" => { header, layout,
                             "people": *[_type == "person" && _id in ^.people[]._ref && active == true]|order(order asc){ ${personFragment} } }
}`;
