import { defineField, defineType } from "sanity";

export const sponsorStrip = defineType({
  name: "sponsorStrip",
  title: "Sponsors",
  type: "object",
  description: "A row or grid of sponsor logos. Only sponsors with 'Show on site' ticked appear.",
  fields: [
    defineField({ name: "header", type: "sectionHeader" }),
    defineField({
      name: "mode",
      type: "string",
      initialValue: "allActive",
      validation: (r) => r.required(),
      options: {
        layout: "radio",
        list: [
          { title: "All active sponsors (by their order)", value: "allActive" },
          { title: "Only the ones I pick", value: "selected" },
        ],
      },
    }),
    defineField({
      name: "sponsors",
      type: "array",
      hidden: ({ parent }) => parent?.mode !== "selected",
      of: [{ type: "reference", to: [{ type: "sponsor" }], options: { filter: "active == true" } }],
      validation: (r) =>
        r.custom((v: any, ctx: any) =>
          ctx.parent?.mode === "selected" && (!v || v.length === 0) ? "Pick at least one sponsor." : true,
        ),
    }),
    defineField({
      name: "layout",
      type: "string",
      initialValue: "grid",
      options: {
        layout: "radio",
        list: [
          { title: "Grid (cards, wraps)", value: "grid" },
          { title: "Row (one tidy line of logos)", value: "row" },
        ],
      },
    }),
    defineField({ name: "showNames", type: "boolean", initialValue: false, description: "Show the sponsor's name under the logo." }),
  ],
  preview: {
    select: { title: "header.heading.en.0.children.0.text", mode: "mode", layout: "layout" },
    prepare: ({ title, mode, layout }: any) => ({ title: title || "Sponsors", subtitle: `${mode === "selected" ? "Selected" : "All active"} · ${layout}` }),
  },
});
