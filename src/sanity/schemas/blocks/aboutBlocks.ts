import { defineField, defineType } from "sanity";
import { COLOR_OPTIONS, EMOJI_OPTIONS, ICON_OPTIONS } from "../../options";

export const textWithAside = defineType({
  name: "textWithAside",
  title: "Text with aside",
  type: "object",
  description: "Story text on the left; on the right a founding-year card and/or the past presidents list.",
  fields: [
    defineField({ name: "eyebrow", type: "localizedString" }),
    defineField({ name: "heading", type: "localizedHeading", validation: (r) => r.required() }),
    defineField({ name: "body", type: "localizedRichText", description: "Each paragraph is a separate block. Tokens work here too." }),
    defineField({
      name: "credit",
      title: "Credit (person)",
      type: "reference",
      to: [{ type: "person" }],
      options: { filter: "active == true" },
      description: "Shown under the text with a heart badge (or the person's photo).",
    }),
    defineField({
      name: "creditTitle",
      type: "localizedString",
      description: "Optional line under the credit's name. Empty = the person's title or office.",
    }),
    defineField({
      name: "aside",
      type: "string",
      initialValue: "both",
      options: {
        layout: "radio",
        list: [
          { title: "Founding-year card", value: "foundingYear" },
          { title: "Past presidents list", value: "pastPresidents" },
          { title: "Both", value: "both" },
        ],
      },
    }),
    defineField({
      name: "foundedLabel",
      title: "Founding card: label",
      type: "localizedString",
      description: "e.g. Year Founded. The big number is the founding year (1993), set in code.",
      hidden: ({ parent }) => parent?.aside === "pastPresidents",
    }),
    defineField({
      name: "foundedCaption",
      title: "Founding card: caption",
      type: "localizedText",
      description: "e.g. Over {decadeYears} years serving the El Paso bleeding disorders community",
      hidden: ({ parent }) => parent?.aside === "pastPresidents",
    }),
    defineField({
      name: "pastPresidentsHeading",
      title: "Past presidents: heading",
      type: "localizedString",
      description: "Lists every active person in the groups Past president and Founder, in their Order.",
      hidden: ({ parent }) => parent?.aside === "foundingYear",
    }),
  ],
  preview: { select: { title: "heading.en.0.children.0.text", subtitle: "aside" }, prepare: ({ title, subtitle }: any) => ({ title: title || "Text with aside", subtitle }) },
});

export const cardGrid = defineType({
  name: "cardGrid",
  title: "Card grid",
  type: "object",
  fields: [
    defineField({ name: "header", type: "sectionHeader" }),
    defineField({
      name: "variant",
      type: "string",
      initialValue: "emojiCard",
      options: {
        layout: "radio",
        list: [
          { title: "Emoji cards (centered, boxed)", value: "emojiCard" },
          { title: "Icon in a circle", value: "iconCircle" },
          { title: "Icon square with a link", value: "iconSquareLink" },
        ],
      },
    }),
    defineField({ name: "columns", type: "number", initialValue: 3, options: { list: [2, 3, 4], layout: "radio" } }),
    defineField({ name: "background", type: "string", initialValue: "neutral", options: { list: ["white", "neutral"], layout: "radio" } }),
    defineField({
      name: "continuesPrevious",
      type: "boolean",
      initialValue: false,
      description: "Place this grid inside the previous card grid's background (same section, extra gap), instead of starting a new band.",
    }),
    defineField({
      name: "cards",
      type: "array",
      validation: (r) => r.min(1),
      of: [
        {
          type: "object",
          name: "card",
          fields: [
            defineField({ name: "icon", type: "string", options: { list: ICON_OPTIONS }, description: "Use an icon OR an emoji." }),
            defineField({ name: "emoji", type: "string", options: { list: EMOJI_OPTIONS } }),
            defineField({ name: "title", type: "localizedString", validation: (r) => r.required() }),
            defineField({ name: "body", type: "localizedText" }),
            defineField({ name: "accent", type: "string", initialValue: "primary", options: { list: COLOR_OPTIONS } }),
            defineField({ name: "link", type: "link", description: "Optional. Used by the 'Icon square with a link' variant." }),
          ],
          validation: (r) =>
            r.custom((c: any) => (c?.icon && c?.emoji ? "Pick an icon or an emoji, not both." : true)),
          preview: { select: { title: "title.en", subtitle: "body.en", emoji: "emoji" }, prepare: ({ title, subtitle, emoji }: any) => ({ title: `${emoji ? emoji + " " : ""}${title ?? ""}`, subtitle }) },
        },
      ],
    }),
  ],
  preview: { select: { title: "header.heading.en.0.children.0.text", subtitle: "variant" }, prepare: ({ title, subtitle }: any) => ({ title: title || "Card grid", subtitle }) },
});

export const featuredPerson = defineType({
  name: "featuredPerson",
  title: "Featured person",
  type: "object",
  fields: [
    defineField({ name: "person", type: "reference", to: [{ type: "person" }], options: { filter: "active == true" }, validation: (r) => r.required() }),
    defineField({ name: "eyebrow", type: "localizedString" }),
    defineField({ name: "subtitle", type: "localizedString", description: "Small line under the title, e.g. Founded HOEP in 1993." }),
    defineField({ name: "quote", type: "localizedText" }),
    defineField({ name: "body", type: "localizedRichText" }),
    defineField({ name: "badges", type: "array", of: [{ type: "localizedString" }], validation: (r) => r.max(3) }),
    defineField({ name: "background", type: "string", initialValue: "dark", options: { list: ["dark"], layout: "radio" } }),
  ],
  preview: { select: { title: "person.name", subtitle: "eyebrow.en" } },
});
