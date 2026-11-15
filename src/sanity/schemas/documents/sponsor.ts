import { defineField, defineType } from "sanity";

/**
 * A public-facing sponsor listing: what the site may show, nothing else.
 * Contact names, emails, phone numbers, pledge amounts and tiers are PRIVATE: they never go in Sanity
 * (the dataset is private, but everyone with project access can read every field, and the site's
 * GROQ projections are the only thing keeping a field off the public pages).
 */
export const sponsor = defineType({
  name: "sponsor",
  title: "Sponsor",
  type: "document",
  description:
    "Only what may appear on the public site. Never put contact names, emails, phone numbers or amounts here. Untick 'Show on site' to hide a sponsor everywhere (strips, footer, event pages).",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "logo",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "localizedString",
          description: "Describe the logo, e.g. 'Acme Pharmacy logo'. English is required.",
        }),
      ],
      validation: (r) =>
        r.required().custom((v: any) => (!v?.asset || v?.alt?.en ? true : "Add alt text (English) for the logo.")),
    }),
    defineField({
      name: "website",
      type: "url",
      description: "Optional. Logos link here in a new tab. https only.",
      validation: (r) => r.uri({ scheme: ["https"] }),
    }),
    defineField({ name: "description", type: "localizedText", description: "Optional one or two sentences. Shown with the name in the grid layout." }),
    defineField({ name: "sinceYear", title: "Supporting since", type: "number", description: "Optional, e.g. 2019.", validation: (r) => r.integer().min(1993).max(2100) }),
    defineField({ name: "order", type: "number", initialValue: 100, description: "Lower numbers first." }),
    defineField({ name: "active", title: "Show on site", type: "boolean", initialValue: true }),
  ],
  orderings: [{ title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "name", subtitle: "website", media: "logo", active: "active" },
    prepare: ({ title, subtitle, media, active }: any) => ({
      title,
      subtitle: active === false ? "Hidden" : subtitle ?? "",
      media,
    }),
  },
});
