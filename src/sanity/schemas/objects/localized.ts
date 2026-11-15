import { defineField, defineType } from "sanity";

const TOKENS =
  "Tokens you can type: {years} = years since 1993 (33 today), {decades} = the decade count as a word (Three), {decadeYears} = years rounded down to the decade (30). They update every year by themselves.";

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
    defineField({ name: "en", title: "English", type: "string", description: TOKENS, validation: (r) => r.required() }),
    defineField({ name: "es", title: "Español", type: "string", description: TOKENS, validation: esWarning }),
  ],
});

export const localizedText = defineType({
  name: "localizedText",
  title: "Paragraph (EN/ES)",
  type: "object",
  fields: [
    defineField({ name: "en", title: "English", type: "text", rows: 3, description: TOKENS, validation: (r) => r.required() }),
    defineField({ name: "es", title: "Español", type: "text", rows: 3, description: TOKENS, validation: esWarning }),
  ],
});
