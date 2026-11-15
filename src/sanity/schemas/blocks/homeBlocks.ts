import { defineField, defineType } from "sanity";

export const statsRow = defineType({
  name: "statsRow",
  title: "Stats row",
  type: "object",
  fields: [
    defineField({ name: "header", type: "sectionHeader" }),
    defineField({
      name: "stats",
      type: "array",
      validation: (r) => r.min(1).max(4),
      of: [
        {
          type: "object",
          name: "stat",
          fields: [
            defineField({
              name: "source",
              type: "string",
              initialValue: "manual",
              options: {
                layout: "radio",
                list: [
                  { title: "A number I type", value: "manual" },
                  { title: "Years of service (computed from the founding year, 1993)", value: "yearsOfService" },
                ],
              },
            }),
            defineField({
              name: "value",
              type: "number",
              hidden: ({ parent }) => parent?.source === "yearsOfService",
              validation: (r) =>
                r.custom((v: any, ctx: any) =>
                  ctx.parent?.source !== "yearsOfService" && (v === undefined || v === null) ? "Enter the number." : true,
                ),
            }),
            defineField({ name: "suffix", type: "string", description: 'Shown after the number, e.g. "+" or "%". Optional.' }),
            defineField({ name: "label", type: "localizedString", validation: (r) => r.required() }),
            defineField({ name: "animate", type: "boolean", initialValue: true, description: "Count up when it scrolls into view." }),
          ],
          preview: {
            select: { title: "label.en", value: "value", suffix: "suffix", source: "source" },
            prepare: ({ title, value, suffix, source }: any) => ({
              title,
              subtitle: source === "yearsOfService" ? "Years of service (computed)" : `${value ?? ""}${suffix ?? ""}`,
            }),
          },
        },
      ],
    }),
  ],
  preview: { select: { title: "header.heading.en.0.children.0.text" }, prepare: ({ title }: any) => ({ title: title || "Stats row" }) },
});

export const eventsFeed = defineType({
  name: "eventsFeed",
  title: "Upcoming events feed",
  type: "object",
  description:
    "Shows the next published events (they come from the events system, not from here). You control only the heading, how many events, and the 'view all' link.",
  fields: [
    defineField({ name: "header", type: "sectionHeader" }),
    defineField({ name: "limit", type: "number", initialValue: 3, options: { list: [1, 2, 3, 4, 5, 6] }, validation: (r) => r.required().min(1).max(6).integer() }),
    defineField({ name: "showViewAllLink", type: "boolean", initialValue: true, description: "Show the 'View All Events' button under the events." }),
  ],
  preview: { select: { title: "header.heading.en.0.children.0.text", limit: "limit" }, prepare: ({ title, limit }: any) => ({ title: title || "Events feed", subtitle: `up to ${limit ?? 3} events` }) },
});
