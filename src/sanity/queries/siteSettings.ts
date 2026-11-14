import { groq } from "next-sanity";

export const siteSettingsQuery = groq`
  *[_id == "siteSettings"][0]{
    orgName, tagline, phone{ display, e164 }, facebookUrl, facebookLabel,
    locationLabel, contactNote, footerText,
    "seo": defaultSeo{ title, description, "ogImage": ogImage.asset->url }
  }`;
export const SITE_SETTINGS_TAGS = ["siteSettings"];
