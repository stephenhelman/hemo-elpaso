import { defineField, defineType } from "sanity";

export const scholarship = defineType({
  name: "scholarship",
  title: "Scholarship",
  type: "document",
  fields: [
    defineField({ name: "title", type: "localizedString", validation: (r) => r.required() }),
    defineField({ name: "memorialNote", type: "localizedText", description: "In-memory note." }),
    defineField({
      name: "status",
      type: "string",
      initialValue: "comingSoon",
      validation: (r) => r.required(),
      options: {
        layout: "radio",
        list: [
          { title: "Coming soon", value: "comingSoon" },
          { title: "Open", value: "open" },
          { title: "Closed", value: "closed" },
        ],
      },
    }),
    defineField({ name: "amount", type: "number", description: "US dollars" }),
    defineField({ name: "recipients", type: "number" }),
    defineField({ name: "semester", type: "localizedString" }),
    defineField({ name: "deadline", type: "date", description: "Last day to apply (Mountain Time). The site shows 'Closed' the day after." }),
    defineField({ name: "essayPrompt", type: "localizedText" }),
    defineField({
      name: "eligibility",
      title: "Eligibility",
      type: "array",
      of: [
        {
          type: "object",
          name: "eligibilityItem",
          fields: [
            defineField({ name: "title", type: "localizedString" }),
            defineField({ name: "body", type: "localizedText" }),
          ],
          preview: { select: { title: "title.en" } },
        },
      ],
    }),
  ],
  // An open scholarship with no end date is a mistake.
  validation: (r) =>
    r.custom((d: any) => {
      if (d?.status !== "open") return true;
      const missing = [!d.deadline && "deadline", !d.amount && "amount", !d.essayPrompt?.en && "essay prompt"].filter(Boolean);
      return missing.length ? `To set status to Open, fill in: ${missing.join(", ")}.` : true;
    }),
  preview: { select: { title: "title.en", subtitle: "status" } },
});
