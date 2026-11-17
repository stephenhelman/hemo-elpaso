import { groq } from "next-sanity";
import { sponsorFragment } from "./fragments";

export const siteSettingsQuery = groq`
  *[_id == "siteSettings"][0]{
    orgName, tagline, phone{ display, e164 }, facebookUrl, facebookLabel,
    locationLabel, contactNote, footerText,
    "footerSponsors": *[_type == "sponsor" && active == true && _id in ^.footerSponsors[]._ref]|order(order asc)[0...4]{ ${sponsorFragment} },
    "seo": defaultSeo{ title, description, "ogImage": ogImage.asset->url }
  }`;
export const SITE_SETTINGS_TAGS = ["siteSettings", "sponsor"];
