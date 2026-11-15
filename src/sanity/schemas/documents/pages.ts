import { defineField, defineType } from "sanity";

/** Blocks available in this phase. More arrive page by page. */
export const SECTION_TYPES = ["pageHero", "richText", "ctaBanner", "peopleGrid", "resourceList", "textWithAside", "cardGrid", "featuredPerson", "statsRow", "eventsFeed"];

export const PAGE_TYPES = [
  { name: "homePage", title: "Home" },
  { name: "aboutPage", title: "About" },
  { name: "resourcesPage", title: "Resources" },
  { name: "getInvolvedPage", title: "Get Involved" },
  { name: "scholarshipsPage", title: "Scholarships" },
  { name: "contactPage", title: "Contact" },
] as const;

const page = (name: string, title: string, extra: any[] = []) =>
  defineType({
    name,
    title: `${title} page`,
    type: "document",
    fields: [
      defineField({ name: "seo", type: "pageSeo" }),
      ...extra,
      defineField({ name: "sections", type: "array", of: SECTION_TYPES.map((type) => ({ type })) }),
    ],
    preview: { prepare: () => ({ title: `${title} page` }) },
  });

/** Contact page: the layout is fixed in code (hero, form + info sidebar, map); only these fields are editable. */
const contactPageDoc = defineType({
  name: "contactPage",
  title: "Contact page",
  type: "document",
  description:
    "Layout is fixed: hero, then the message form with the contact-details sidebar, then the map. The sidebar (phone, Facebook, location, note) is edited in Site settings. Form labels, reasons and messages are not editable here.",
  fields: [
    defineField({ name: "seo", type: "pageSeo" }),
    defineField({ name: "hero", type: "pageHero", description: "Compact hero at the top." }),
    defineField({ name: "formHeading", type: "localizedString", description: "Heading above the message form." }),
    defineField({ name: "formSubheading", type: "localizedText", description: "Text under the form heading." }),
    defineField({ name: "mapHeader", type: "sectionHeader", description: "Heading and text above the map (the eyebrow is not shown here)." }),
  ],
  preview: { prepare: () => ({ title: "Contact page" }) },
});

export const pageDocuments = PAGE_TYPES.map((p) =>
  p.name === "contactPage"
    ? contactPageDoc
    : p.name === "scholarshipsPage"
    ? page(p.name, p.title, [
        defineField({
          name: "featuredScholarship",
          type: "reference",
          to: [{ type: "scholarship" }],
          description: "Shown below the hero. If empty, the page shows 'Next cycle coming soon'.",
        }),
      ])
    : page(p.name, p.title),
);
