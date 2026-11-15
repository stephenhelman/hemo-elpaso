import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "orgName",
      type: "string",
      initialValue: "Hemophilia Outreach of El Paso",
      description: "Same in English and Spanish (it's a proper noun).",
      validation: (r) => r.required(),
    }),
    defineField({ name: "tagline", type: "localizedString" }),
    defineField({
      name: "phone",
      type: "object",
      fields: [
        defineField({ name: "display", type: "string", description: "As shown, e.g. (915) 621-8291", validation: (r) => r.required() }),
        defineField({
          name: "e164",
          title: "International format",
          type: "string",
          description: "+19156218291 (used for tap-to-call links)",
          validation: (r) => r.required().regex(/^\+1\d{10}$/, "Use +1 and ten digits"),
        }),
      ],
    }),
    defineField({
      name: "facebookUrl",
      type: "url",
      validation: (r) =>
        r
          .required()
          .uri({ scheme: ["https"] })
          .custom((u) => !u || /^https:\/\/(www\.)?facebook\.com\//.test(u) || "Must be a facebook.com link"),
    }),
    defineField({ name: "facebookLabel", type: "localizedString", description: "e.g. HOEP on Facebook" }),
    defineField({ name: "locationLabel", type: "localizedString", description: "e.g. El Paso, Texas" }),
    defineField({ name: "contactNote", type: "localizedText", description: "Small note under the contact details." }),
    defineField({ name: "footerText", type: "localizedString", description: "Footer line, e.g. 'All rights reserved.'" }),
    defineField({
      name: "footerSponsors",
      type: "array",
      description: "Optional 'Thank you to our sponsors' row in the footer (up to 4). Hidden when empty.",
      of: [{ type: "reference", to: [{ type: "sponsor" }], options: { filter: "active == true" } }],
      validation: (r) => r.max(4),
    }),
    defineField({
      name: "defaultSeo",
      type: "pageSeo",
      description: "Default title, description and share image (used when a page has none).",
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
