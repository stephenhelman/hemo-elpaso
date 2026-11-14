import { defineField, defineType } from "sanity";

export const sectionHeader = defineType({
  name: "sectionHeader",
  title: "Section header",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", type: "localizedString" }),
    defineField({ name: "heading", type: "localizedHeading" }),
    defineField({ name: "subheading", type: "localizedText" }),
    defineField({
      name: "align",
      type: "string",
      initialValue: "center",
      options: { list: ["left", "center"], layout: "radio" },
    }),
  ],
});

export const pageSeo = defineType({
  name: "pageSeo",
  title: "SEO",
  type: "object",
  fields: [
    defineField({ name: "title", type: "localizedString", description: "Browser tab and search result title." }),
    defineField({ name: "description", type: "localizedText", description: "Search result description (about 150 characters)." }),
    defineField({ name: "ogImage", title: "Share image", type: "image", description: "1200 × 630. Pages without one use the site default." }),
  ],
});
