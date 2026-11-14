import { defineField, defineType } from "sanity";
import { ICON_OPTIONS } from "../../options";

const styleField = defineField({
  name: "style",
  type: "string",
  initialValue: "primary",
  options: { list: ["primary", "outline"], layout: "radio" },
});

export const pageHero = defineType({
  name: "pageHero",
  title: "Page hero",
  type: "object",
  fields: [
    defineField({
      name: "variant",
      type: "string",
      initialValue: "compact",
      options: {
        layout: "radio",
        list: [
          { title: "Full (home: tall, badges, buttons)", value: "full" },
          { title: "Compact (eyebrow, heading, sub)", value: "compact" },
          { title: "Title only", value: "titleOnly" },
        ],
      },
    }),
    defineField({ name: "eyebrow", type: "localizedString", hidden: ({ parent }) => parent?.variant === "titleOnly" }),
    defineField({ name: "heading", type: "localizedHeading", validation: (r) => r.required() }),
    defineField({ name: "subheading", type: "localizedText" }),
    defineField({
      name: "buttons",
      type: "array",
      hidden: ({ parent }) => parent?.variant !== "full",
      of: [
        {
          type: "object",
          name: "heroButton",
          fields: [defineField({ name: "link", type: "link" }), styleField],
          preview: { select: { title: "link.label.en" } },
        },
      ],
      validation: (r) => r.max(2),
    }),
    defineField({
      name: "badges",
      type: "array",
      hidden: ({ parent }) => parent?.variant !== "full",
      of: [
        {
          type: "object",
          name: "heroBadge",
          fields: [
            defineField({ name: "text", type: "localizedString" }),
            defineField({ name: "icon", type: "string", options: { list: ICON_OPTIONS } }),
          ],
          preview: { select: { title: "text.en" } },
        },
      ],
      validation: (r) => r.max(3),
    }),
  ],
  preview: { select: { title: "heading.en.0.children.0.text", subtitle: "variant" } },
});

export const richText = defineType({
  name: "richText",
  title: "Rich text",
  type: "object",
  fields: [
    defineField({ name: "header", type: "sectionHeader" }),
    defineField({ name: "body", type: "localizedRichText", validation: (r) => r.required() }),
    defineField({ name: "background", type: "string", initialValue: "white", options: { list: ["white", "neutral"], layout: "radio" } }),
    defineField({ name: "width", type: "string", initialValue: "narrow", options: { list: ["narrow", "wide"], layout: "radio" } }),
  ],
  preview: { select: { title: "header.heading.en.0.children.0.text" }, prepare: ({ title }) => ({ title: title || "Rich text" }) },
});

export const ctaButton = defineType({
  name: "ctaButton",
  title: "Button",
  type: "object",
  fields: [
    defineField({ name: "link", type: "link", validation: (r) => r.required() }),
    styleField,
    defineField({ name: "icon", type: "string", options: { list: ICON_OPTIONS } }),
    defineField({
      name: "showIfRegistrationOpen",
      type: "boolean",
      initialValue: false,
      description: "Only show this button when online registration is open.",
    }),
  ],
  preview: { select: { title: "link.label.en", subtitle: "link.value" } },
});

export const ctaBanner = defineType({
  name: "ctaBanner",
  title: "Call to action",
  type: "object",
  fields: [
    defineField({ name: "heading", type: "localizedString", validation: (r) => r.required() }),
    defineField({ name: "subheading", type: "localizedText" }),
    defineField({ name: "icon", type: "string", options: { list: ICON_OPTIONS } }),
    defineField({ name: "buttons", type: "array", of: [{ type: "ctaButton" }], validation: (r) => r.max(2) }),
    defineField({ name: "background", type: "string", initialValue: "white", options: { list: ["white", "neutral", "primary"], layout: "radio" } }),
    defineField({
      name: "showIfRegistrationOpen",
      type: "boolean",
      initialValue: false,
      description: "Hide the whole banner unless online registration is open.",
    }),
  ],
  preview: { select: { title: "heading.en" } },
});

export const peopleGrid = defineType({
  name: "peopleGrid",
  title: "People",
  type: "object",
  description:
    "Groups are shown in a fixed order (Officers, Members at Large, Advisors, then the rest); empty groups are hidden. Contact layout never shows email.",
  fields: [
    defineField({ name: "header", type: "sectionHeader" }),
    defineField({
      name: "layout",
      type: "string",
      initialValue: "card",
      options: {
        layout: "radio",
        list: [
          { title: "Card (initials/photo, name, office)", value: "card" },
          { title: "Compact (one line)", value: "compact" },
          { title: "Contact (name, office, phone, 'Send a message')", value: "contact" },
        ],
      },
    }),
    defineField({
      name: "people",
      type: "array",
      of: [{ type: "reference", to: [{ type: "person" }], options: { filter: "active == true" } }],
      validation: (r) => r.min(1),
    }),
  ],
  preview: { select: { title: "header.heading.en.0.children.0.text", subtitle: "layout" }, prepare: ({ title, subtitle }) => ({ title: title || "People", subtitle }) },
});
