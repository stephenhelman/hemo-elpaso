import { defineField, defineType, useFormValue, type FieldProps } from "sanity";
import { COLOR_OPTIONS, ICON_OPTIONS, RESOURCE_CATEGORIES, isStale } from "../../options";

const catTitle = (v?: string) => RESOURCE_CATEGORIES.find((c) => c.value === v)?.title ?? "Resource";

/** Conditions are medical content: relabel the date and add a reminder. Other categories say "Last verified". */
function LastVerifiedField(props: FieldProps) {
  const category = useFormValue(["category"]) as string | undefined;
  const condition = category === "condition";
  return props.renderDefault({
    ...props,
    title: condition ? "Last medically reviewed" : "Last verified",
    description: condition
      ? "Check wording against bleeding.org before editing."
      : "The date someone last checked that this is still accurate (links, phone, address).",
  });
}

const only = (...cats: string[]) => ({ document }: { document?: any }) => !cats.includes(document?.category);

export const resource = defineType({
  name: "resource",
  title: "Resource",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name (English)", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "nameEs",
      title: "Name (Español)",
      type: "string",
      description: "Only if the Spanish name differs (e.g. Hemofilia A). Empty = same as English.",
    }),
    defineField({ name: "abbreviation", type: "string", description: "Short badge text, e.g. NBDF (optional)." }),
    defineField({
      name: "category",
      type: "string",
      validation: (r) => r.required(),
      options: { list: RESOURCE_CATEGORIES },
    }),
    defineField({
      name: "kicker",
      type: "localizedString",
      description: "Small line above/below the name: provider type (local care) or organization (youth programs).",
      hidden: only("localCare", "youthProgram"),
    }),
    defineField({ name: "summary", type: "localizedText", validation: (r) => r.required() }),
    defineField({
      name: "body",
      type: "localizedRichText",
      description: "Optional longer text. When filled in, it replaces the summary on condition cards.",
    }),
    defineField({
      name: "facts",
      type: "array",
      of: [{ type: "localizedString" }],
      description: "Short bullet facts shown on condition cards.",
      hidden: only("condition"),
    }),
    defineField({ name: "address", type: "string", hidden: only("localCare") }),
    defineField({
      name: "phone",
      type: "object",
      description: "This organization's own phone (not the HOEP phone).",
      hidden: only("localCare"),
      fields: [
        defineField({ name: "display", type: "string", description: "As shown, e.g. (915) 521-7602" }),
        defineField({
          name: "e164",
          title: "International format",
          type: "string",
          description: "+19155217602 (used for tap-to-call)",
          validation: (r) => r.regex(/^\+1\d{10}$/, "Use +1 and ten digits").warning(),
        }),
      ],
    }),
    defineField({
      name: "meta",
      title: "Details (ages, season, cost…)",
      type: "array",
      hidden: only("youthProgram"),
      description: "Shown as small tags. The LAST one is highlighted (use it for cost).",
      of: [
        {
          type: "object",
          name: "metaItem",
          fields: [
            defineField({ name: "label", type: "localizedString", description: "For editors only, e.g. Ages." }),
            defineField({ name: "value", type: "localizedString", description: "Shown on the site, e.g. Ages 6–17." }),
          ],
          preview: { select: { title: "label.en", subtitle: "value.en" } },
        },
      ],
    }),
    defineField({ name: "link", type: "resourceLink" }),
    defineField({ name: "accent", type: "string", initialValue: "primary", options: { list: COLOR_OPTIONS } }),
    defineField({ name: "icon", type: "string", options: { list: ICON_OPTIONS } }),
    defineField({ name: "order", type: "number", initialValue: 100, description: "Lower numbers first." }),
    defineField({ name: "active", title: "Show on site", type: "boolean", initialValue: true }),
    defineField({
      name: "lastVerified",
      type: "date",
      components: { field: LastVerifiedField },
      validation: (r) =>
        r
          .required()
          .custom((v: any) => (isStale(v) ? { message: "Check this is still accurate.", level: "warning" } : true))
          .warning(),
    }),
  ],
  orderings: [
    { title: "Category, then order", name: "catOrder", by: [{ field: "category", direction: "asc" }, { field: "order", direction: "asc" }] },
    { title: "Least recently verified", name: "stale", by: [{ field: "lastVerified", direction: "asc" }] },
  ],
  preview: {
    select: { title: "name", category: "category", verified: "lastVerified", active: "active" },
    prepare: ({ title, category, verified, active }: any) => ({
      title,
      subtitle: `${catTitle(category)} · ${verified ? `verified ${verified}` : "NEVER VERIFIED"}${isStale(verified) ? " · ⚠ STALE" : ""}${active === false ? " · hidden" : ""}`,
    }),
  },
});
