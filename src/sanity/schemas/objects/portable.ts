import { defineArrayMember, defineField, defineType } from "sanity";

/** Body text. No headings, no images, no HTML. */
const bodyBlocks = [
  defineArrayMember({
    type: "block",
    styles: [{ title: "Normal", value: "normal" }],
    lists: [{ title: "Bulleted", value: "bullet" }],
    marks: {
      decorators: [
        { title: "Bold", value: "strong" },
        { title: "Italic", value: "em" },
      ],
      annotations: [
        {
          name: "link",
          type: "object",
          title: "Link",
          fields: [
            defineField({
              name: "href",
              type: "url",
              validation: (r) =>
                r.uri({ scheme: ["https", "mailto", "tel"], allowRelative: true }).required(),
            }),
          ],
        },
      ],
    },
  }),
];

/** One-line heading. The only mark is "emphasis" (accent colour), which replaces the Hope/Esperanza hack. */
const headingBlocks = [
  defineArrayMember({
    type: "block",
    styles: [{ title: "Heading", value: "normal" }],
    lists: [],
    marks: { decorators: [{ title: "Accent", value: "emphasis" }], annotations: [] },
  }),
];

const make = (name: string, title: string, of: any[]) =>
  defineType({
    name,
    title,
    type: "object",
    fields: [
      defineField({ name: "en", title: "English", type: "array", of, validation: (r) => r.required() }),
      defineField({ name: "es", title: "Español", type: "array", of }),
    ],
  });

export const localizedRichText = make("localizedRichText", "Rich text (EN/ES)", bodyBlocks);
export const localizedHeading = make("localizedHeading", "Heading (EN/ES)", headingBlocks);
