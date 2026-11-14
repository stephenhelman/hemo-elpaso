import { defineField, defineType } from "sanity";

const esWarning = (Rule: any) =>
  Rule.custom((v: unknown, ctx: any) => {
    const en = ctx.parent?.en;
    const hasEn = Array.isArray(en) ? en.length > 0 : !!en;
    const hasEs = Array.isArray(v) ? v.length > 0 : !!v;
    return hasEn && !hasEs
      ? { message: "No Spanish yet: the English text will be shown.", level: "warning" }
      : true;
  }).warning();

export const localizedString = defineType({
  name: "localizedString",
  title: "Text (EN/ES)",
  type: "object",
  options: { columns: 2 },
  fields: [
    defineField({ name: "en", title: "English", type: "string", validation: (r) => r.required() }),
    defineField({ name: "es", title: "Español", type: "string", validation: esWarning }),
  ],
});

export const localizedText = defineType({
  name: "localizedText",
  title: "Paragraph (EN/ES)",
  type: "object",
  fields: [
    defineField({ name: "en", title: "English", type: "text", rows: 3, validation: (r) => r.required() }),
    defineField({ name: "es", title: "Español", type: "text", rows: 3, validation: esWarning }),
  ],
});
