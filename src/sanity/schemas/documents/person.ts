import { defineField, defineType } from "sanity";

export const person = defineType({
  name: "person",
  title: "Person",
  type: "document",
  description:
    "Never add someone until they are approved for public release. Untick 'Show on site' hides them from the site, but the record is still stored and visible to anyone with project access.",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "photo",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "localizedString" })],
      validation: (r) =>
        r.custom((v: any) => (!v?.asset || v?.alt?.en ? true : "Add alt text (English) for the photo.")),
    }),
    defineField({
      name: "group",
      type: "string",
      validation: (r) => r.required(),
      options: {
        list: [
          { title: "Officer", value: "officer" },
          { title: "Member at large", value: "memberAtLarge" },
          { title: "Advisor", value: "advisor" },
          { title: "Founder", value: "founder" },
          { title: "Past president", value: "pastPresident" },
          { title: "In memory of", value: "honoree" },
        ],
      },
    }),
    defineField({
      name: "office",
      type: "localizedString",
      description: "e.g. President / Presidenta",
      hidden: ({ document }) => document?.group !== "officer",
      validation: (r) =>
        r.custom((v: any, ctx: any) =>
          ctx.document?.group === "officer" && !v?.en ? "Officers need an office (e.g. President)." : true,
        ),
    }),
    defineField({ name: "title", type: "localizedString", description: "Optional extra line, e.g. 'Founder & Visionary'." }),
    defineField({ name: "bio", type: "localizedRichText" }),
    defineField({ name: "order", type: "number", initialValue: 100, description: "Lower numbers first." }),
    defineField({ name: "active", title: "Show on site", type: "boolean", initialValue: true }),
  ],
  orderings: [{ title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "group", media: "photo" } },
});
