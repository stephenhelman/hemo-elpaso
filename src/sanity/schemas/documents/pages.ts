import { defineField, defineType } from "sanity";

/** Blocks available in this phase. More arrive page by page. */
export const SECTION_TYPES = ["pageHero", "richText", "ctaBanner", "peopleGrid"];

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

export const pageDocuments = PAGE_TYPES.map((p) =>
  p.name === "scholarshipsPage"
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
