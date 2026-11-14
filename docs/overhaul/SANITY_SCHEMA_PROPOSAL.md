# Sanity schema proposal (Phase 5A, Step 1)

**Status: proposal only. Nothing here is installed or compiled.** The code blocks are the intended contents of `src/sanity/**` and are kept in this markdown file (not `.ts`) so `tsc` is unaffected. Based on `docs/overhaul/CONTENT_AUDIT.md`.

- Dataset: `production`.
- **Project ID: not provided.** Your message had `[paste]` as the value. I need it before Step 2 (`NEXT_PUBLIC_SANITY_PROJECT_ID`).
- Next is **14.2.35**. `next-sanity` v9 supports Next 14.2+, so no upgrade is needed. I'll confirm the exact version when installing.

---

## 0. Decisions I need from you

1. **Scholarship card placement.** You listed four blocks (PageHero, RichText, CTABanner, PeopleGrid) plus the `scholarship` document. The scholarship card is none of those. I propose a field on the Scholarships page, `featuredScholarship` (a reference to a `scholarship` doc), rendered by code in a fixed spot (after the hero) instead of adding a fifth block. The alternative is a `scholarshipCard` block (reference + "show eligibility" toggle). **Default if you don't answer: the field.**
2. **`LanguageProvider` initial locale.** Today `LanguageProvider` starts as `"en"` and reads the cookie in an effect. That means every client page's server HTML is English even for a Spanish visitor, then flips after hydration. Your constraint ("initial server render uses the cookie locale") requires passing `initialLocale` from the root layout (which already reads the cookie). This is a small, safe change to `SiteLayout`/`LanguageContext`. It also fixes the existing English flash on `/about`, `/resources` etc. **I'll include it in `feat/sanity-foundation` unless you object.**
3. **Phone fields.** You asked for display/tel/E.164. I propose storing only `display` and `e164`, and deriving `tel:` and the dashed form in code. Three independently typed values can disagree, which is the bug we just fixed in code. If you want all three as typed fields I'll add them.
4. **Navigation** (nav links, footer link lists) stays in code for this phase. It isn't in your list and it's tied to `registrationOpen`. Say so if you want it in `siteSettings`.
5. **Studio auth is two layers.** Our gate (`canEditSiteContent`, enforced by middleware and the page) controls who can *open* `/admin/studio`. Sanity's own login and project roles control who can *write*. Officers must also be invited to the Sanity project (as Editor). I'll document this in Step 3.

---

## 1. Localization model

Every localized field is an object `{ en, es }`, not a plugin and not per-language documents. It matches the `{ en, es }` shape already used in the dictionaries, keeps one document per page, and lets the server hand both languages to client components.

- `en` is required (publish is blocked without it). `es` is optional; an editor sees a warning, not an error.
- **Fallback:** if `es` is missing or empty, the site shows `en`. "Empty" means: empty/whitespace string, empty array, or portable text with no text in any span.
- Fallback lives in one helper, `pick()` (section 6). Components never read `field.es` directly.

### 1.1 Shared object types

```ts
// src/sanity/schemas/objects/localized.ts
import { defineField, defineType } from "sanity";

const esWarning = (Rule: any) =>
  Rule.custom((v: unknown, ctx: any) => {
    const en = ctx.parent?.en;
    const hasEn = Array.isArray(en) ? en.length > 0 : !!en;
    const hasEs = Array.isArray(v) ? v.length > 0 : !!v;
    return hasEn && !hasEs ? { message: "No Spanish yet: the English text will be shown.", level: "warning" } : true;
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
```

```ts
// src/sanity/schemas/objects/portable.ts
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

/** One-line heading. Only mark is "emphasis" (accent colour). Replaces the Hope/Esperanza hack. */
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
/** Headings: same shape, limited to the "emphasis" mark. */
export const localizedHeading = make("localizedHeading", "Heading (EN/ES)", headingBlocks);
```

`emphasis` renders as `<span className="text-primary-400">` (the same accent as today's hero). Because it's a mark on a span, it works in either language with no word matching.

```ts
// src/sanity/schemas/objects/link.ts
import { defineField, defineType } from "sanity";

/** Internal routes an editor may link to. Fixed list: no free typing of paths. */
export const INTERNAL_ROUTES = [
  ["/", "Home"], ["/about", "About"], ["/events", "Events"], ["/resources", "Resources"],
  ["/scholarships", "Scholarships"], ["/get-involved", "Get Involved"], ["/contact", "Contact"],
  ["/register-info", "Register for Information"],
] as const;

export const link = defineType({
  name: "link",
  title: "Link",
  type: "object",
  fields: [
    defineField({ name: "label", type: "localizedString", validation: (r) => r.required() }),
    defineField({
      name: "type",
      type: "string",
      initialValue: "internal",
      options: {
        layout: "radio",
        list: [
          { title: "Page on this site", value: "internal" },
          { title: "External website", value: "external" },
          { title: "Phone number", value: "phone" },
          { title: "Email address", value: "email" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "value",
      type: "string",
      description: "Page path, https:// URL, phone digits, or email, depending on the type above.",
      validation: (r) =>
        r.required().custom((v, ctx: any) => {
          const t = ctx.parent?.type;
          if (!v) return true;
          if (t === "internal") return INTERNAL_ROUTES.some(([p]) => p === v) || "Pick one of the site pages.";
          if (t === "external") return /^https:\/\/[^\s]+$/.test(v) || "Must start with https://";
          if (t === "phone") return /^\+?[0-9]{10,15}$/.test(v) || "Digits only, e.g. +19156218291";
          if (t === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Not a valid email.";
          return true;
        }),
    }),
  ],
  preview: { select: { title: "label.en", subtitle: "value" } },
});
```

Rendering: `internal` → `next/link`; `external` → `<a target=_blank rel="noopener noreferrer">`; `phone` → `tel:`; `email` → `mailto:`. Email links exist as a type for completeness, but **no block may expose a person's email** (see PeopleGrid).

```ts
// src/sanity/schemas/objects/sectionHeader.ts
export const sectionHeader = defineType({
  name: "sectionHeader",
  title: "Section header",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", type: "localizedString" }),
    defineField({ name: "heading", type: "localizedHeading" }),
    defineField({ name: "subheading", type: "localizedText" }),
    defineField({
      name: "align", type: "string", initialValue: "center",
      options: { list: ["left", "center"], layout: "radio" },
    }),
  ],
});

// src/sanity/schemas/objects/pageSeo.ts
export const pageSeo = defineType({
  name: "pageSeo",
  title: "SEO",
  type: "object",
  fields: [
    defineField({ name: "title", type: "localizedString", description: "Browser tab and search result title." }),
    defineField({ name: "description", type: "localizedText", description: "Search result description (about 150 characters)." }),
    defineField({ name: "ogImage", title: "Share image", type: "image", description: "1200 × 630. Falls back to the site default." }),
  ],
});
```

### 1.2 Fixed option lists (icons and colours)

No free text. The list values are the stored strings; code maps them to Lucide components and Tailwind classes.

```ts
// src/sanity/options.ts  (editor-facing lists, imported by schemas)
export const ICON_OPTIONS = [
  { title: "Heart", value: "heart" }, { title: "Clock", value: "clock" },
  { title: "Dollar sign", value: "dollarSign" }, { title: "Megaphone", value: "megaphone" },
  { title: "Book", value: "bookOpen" }, { title: "People", value: "users" },
  { title: "Globe", value: "globe" }, { title: "Shield", value: "shield" },
  { title: "Phone", value: "phone" }, { title: "Mail", value: "mail" },
  { title: "Calendar", value: "calendar" }, { title: "Clipboard", value: "clipboardList" },
  { title: "Bell", value: "bell" }, { title: "Star", value: "star" },
] as const;

export const COLOR_OPTIONS = [
  { title: "Primary (burgundy)", value: "primary" },
  { title: "Secondary", value: "secondary" },
  { title: "Accent", value: "accent" },
  { title: "Neutral", value: "neutral" },
] as const;

// src/sanity/icons.ts  (renderer side)
import { Heart, Clock, DollarSign, Megaphone, BookOpen, Users, Globe, Shield, Phone, Mail,
  Calendar, ClipboardList, Bell, Star } from "lucide-react";
export const ICONS = { heart: Heart, clock: Clock, dollarSign: DollarSign, megaphone: Megaphone,
  bookOpen: BookOpen, users: Users, globe: Globe, shield: Shield, phone: Phone, mail: Mail,
  calendar: Calendar, clipboardList: ClipboardList, bell: Bell, star: Star } as const;
export type IconKey = keyof typeof ICONS;
```

Colours map to the existing token classes (`bg-primary-50 text-primary`, `bg-secondary/10 text-secondary`, ...) in one table in `src/sanity/colors.ts`. An unknown value renders as `neutral`.

---

## 2. Documents

### 2.1 `siteSettings` (singleton)

```ts
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({ name: "orgName", type: "string", initialValue: "Hemophilia Outreach of El Paso",
      description: "Same in English and Spanish (it's a proper noun).", validation: (r) => r.required() }),
    defineField({ name: "tagline", type: "localizedString" }),
    defineField({
      name: "phone", type: "object",
      fields: [
        defineField({ name: "display", type: "string", description: "As shown, e.g. (915) 621-8291",
          validation: (r) => r.required() }),
        defineField({ name: "e164", title: "International format", type: "string", description: "+19156218291",
          validation: (r) => r.required().regex(/^\+1\d{10}$/, "Use +1 and ten digits") }),
      ],
    }),
    defineField({ name: "facebookUrl", type: "url",
      validation: (r) => r.required().uri({ scheme: ["https"] })
        .custom((u) => !u || /^https:\/\/(www\.)?facebook\.com\//.test(u) || "Must be a facebook.com link") }),
    defineField({ name: "facebookLabel", type: "localizedString", description: "e.g. HOEP on Facebook" }),
    defineField({ name: "locationLabel", type: "localizedString", description: "e.g. El Paso, Texas" }),
    defineField({ name: "contactNote", type: "localizedText", description: "Small note under the contact details." }),
    defineField({ name: "footerText", type: "localizedString", description: "Footer line, e.g. 'All rights reserved.'" }),
    defineField({ name: "defaultSeo", type: "pageSeo" }),
    defineField({ name: "defaultOgImage", type: "image", description: "Used when a page has no share image." }),
  ],
});
```

- **Fallback when Sanity is unreachable:** `getSiteSettings()` returns the Sanity doc merged over a constant built from `lib/site.ts` (`SITE_PHONE`, `FACEBOOK_URL`, `FACEBOOK_LABEL`) and the current dictionary strings. A failed fetch logs the error and uses the constants. Missing fields in a valid doc fall back field by field.
- **Not in settings:** the info email. `contactEmail()` stays in `lib/site.ts` (env-driven mailbox domain).

### 2.2 `person`

```ts
export const person = defineType({
  name: "person",
  title: "Person",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "photo", type: "image", options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "localizedString" })],
      validation: (r) => r.custom((v: any) =>
        !v?.asset || v?.alt?.en ? true : "Add alt text (English) for the photo."),
    }),
    defineField({ name: "title", type: "localizedString", description: "e.g. President / Presidenta" }),
    defineField({
      name: "group", type: "string", validation: (r) => r.required(),
      options: { list: [
        { title: "Founder", value: "founder" }, { title: "President", value: "president" },
        { title: "Officer", value: "officer" }, { title: "Board member", value: "board" },
        { title: "Advisor", value: "advisor" }, { title: "Past president", value: "pastPresident" },
        { title: "In memory of", value: "honoree" },
      ] },
    }),
    defineField({ name: "bio", type: "localizedRichText" }),
    defineField({ name: "order", type: "number", initialValue: 100 }),
    defineField({ name: "active", type: "boolean", initialValue: true,
      description: "Untick to hide from the site without deleting." }),
  ],
  orderings: [{ title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "group", media: "photo" } },
});
```

There is **no email field**, and no schema anywhere may add one. Queries only project `name, photo, title, group, bio, order` (an allow-list), so even a future field wouldn't leak by accident.

### 2.3 `scholarship`

```ts
export const scholarship = defineType({
  name: "scholarship",
  title: "Scholarship",
  type: "document",
  fields: [
    defineField({ name: "title", type: "localizedString", validation: (r) => r.required() }),
    defineField({ name: "memorialNote", type: "localizedText", description: "In-memory note." }),
    defineField({
      name: "status", type: "string", initialValue: "comingSoon", validation: (r) => r.required(),
      options: { layout: "radio", list: [
        { title: "Coming soon", value: "comingSoon" }, { title: "Open", value: "open" }, { title: "Closed", value: "closed" },
      ] },
    }),
    defineField({ name: "amount", type: "number", description: "US dollars" }),
    defineField({ name: "recipients", type: "number" }),
    defineField({ name: "semester", type: "localizedString" }),
    defineField({ name: "deadline", type: "date", description: "Last day to apply (Mountain Time)." }),
    defineField({ name: "essayPrompt", type: "localizedText" }),
    defineField({
      name: "eligibility", title: "Eligibility", type: "array",
      of: [{ type: "object", fields: [
        defineField({ name: "title", type: "localizedString" }),
        defineField({ name: "body", type: "localizedText" }),
      ], preview: { select: { title: "title.en" } } }],
    }),
  ],
  // "Open" requires a deadline, amount and essay prompt: an open scholarship with no end date is a mistake.
  validation: (r) => r.custom((d: any) => {
    if (d?.status !== "open") return true;
    const missing = [!d.deadline && "deadline", !d.amount && "amount", !d.essayPrompt?.en && "essay prompt"].filter(Boolean);
    return missing.length ? `To set status to Open, fill in: ${missing.join(", ")}.` : true;
  }),
});
```

- **Effective status** (computed by the page, never stored): `open` with a `deadline` earlier than the start of today in `America/Denver` becomes `closed`. The deadline day itself counts as open.
- The page shows the **"Next cycle coming soon"** state for `comingSoon`, and also whenever no scholarship doc is referenced.
- `eligibility` stays hidden on the page in `comingSoon` (as today). The component and data are kept.

---

## 3. Pages and blocks

One singleton document per existing page: `homePage`, `aboutPage`, `resourcesPage`, `getInvolvedPage`, `scholarshipsPage`, `contactPage`. All are created by one factory so the shape is identical. Document IDs equal the type names (fixed).

```ts
// src/sanity/schemas/pages.ts
const SECTION_TYPES = ["pageHero", "richText", "ctaBanner", "peopleGrid"]; // this phase only

const page = (name: string, title: string, extra: any[] = []) =>
  defineType({
    name, title, type: "document",
    fields: [
      defineField({ name: "seo", type: "pageSeo" }),
      ...extra,
      defineField({ name: "sections", type: "array", of: SECTION_TYPES.map((type) => ({ type }))}),
    ],
    preview: { prepare: () => ({ title }) },
  });

export const homePage = page("homePage", "Home");
export const aboutPage = page("aboutPage", "About");
export const resourcesPage = page("resourcesPage", "Resources");
export const getInvolvedPage = page("getInvolvedPage", "Get Involved");
export const contactPage = page("contactPage", "Contact");
export const scholarshipsPage = page("scholarshipsPage", "Scholarships", [
  defineField({ name: "featuredScholarship", type: "reference", to: [{ type: "scholarship" }] }),
]);
```

Only the Scholarships page is rendered from Sanity in Phase 5A. The other five documents exist (so the Studio structure is final) but their pages keep rendering from the dictionaries until their own phase. Their `sections` stay empty and are not read.

### 3.1 Blocks (this phase)

```ts
// pageHero
export const pageHero = defineType({
  name: "pageHero", title: "Page hero", type: "object",
  fields: [
    defineField({ name: "variant", type: "string", initialValue: "compact",
      options: { layout: "radio", list: [
        { title: "Full (home: tall, badges, buttons)", value: "full" },
        { title: "Compact (eyebrow, heading, sub)", value: "compact" },
        { title: "Title only", value: "titleOnly" },
      ] } }),
    defineField({ name: "eyebrow", type: "localizedString", hidden: ({ parent }) => parent?.variant === "titleOnly" }),
    defineField({ name: "heading", type: "localizedHeading", validation: (r) => r.required() }),
    defineField({ name: "subheading", type: "localizedText" }),
    defineField({ name: "buttons", type: "array", hidden: ({ parent }) => parent?.variant !== "full",
      of: [{ type: "object", name: "heroButton", fields: [
        defineField({ name: "link", type: "link" }),
        defineField({ name: "style", type: "string", initialValue: "primary",
          options: { list: ["primary", "outline"], layout: "radio" } }),
      ], preview: { select: { title: "link.label.en" } } }],
      validation: (r) => r.max(2) }),
    defineField({ name: "badges", type: "array", hidden: ({ parent }) => parent?.variant !== "full",
      of: [{ type: "object", name: "heroBadge", fields: [
        defineField({ name: "text", type: "localizedString" }),
        defineField({ name: "icon", type: "string", options: { list: ICON_OPTIONS as any } }),
      ], preview: { select: { title: "text.en" } } }],
      validation: (r) => r.max(3) }),
  ],
  preview: { select: { title: "heading.en.0.children.0.text", subtitle: "variant" } },
});

// richText
export const richText = defineType({
  name: "richText", title: "Rich text", type: "object",
  fields: [
    defineField({ name: "header", type: "sectionHeader" }),
    defineField({ name: "body", type: "localizedRichText", validation: (r) => r.required() }),
    defineField({ name: "background", type: "string", initialValue: "white",
      options: { list: ["white", "neutral"], layout: "radio" } }),
    defineField({ name: "width", type: "string", initialValue: "narrow",
      options: { list: ["narrow", "wide"], layout: "radio" } }),
  ],
});

// ctaBanner
const button = defineType({
  name: "ctaButton", title: "Button", type: "object",
  fields: [
    defineField({ name: "link", type: "link", validation: (r) => r.required() }),
    defineField({ name: "style", type: "string", initialValue: "primary",
      options: { list: ["primary", "outline"], layout: "radio" } }),
    defineField({ name: "icon", type: "string", options: { list: ICON_OPTIONS as any } }),
    defineField({ name: "showIfRegistrationOpen", type: "boolean", initialValue: false,
      description: "Only show this button when online registration is open (REGISTRATION_OPEN)." }),
  ],
  preview: { select: { title: "link.label.en", subtitle: "link.value" } },
});
export const ctaBanner = defineType({
  name: "ctaBanner", title: "Call to action", type: "object",
  fields: [
    defineField({ name: "heading", type: "localizedString", validation: (r) => r.required() }),
    defineField({ name: "subheading", type: "localizedText" }),
    defineField({ name: "icon", type: "string", options: { list: ICON_OPTIONS as any } }),
    defineField({ name: "buttons", type: "array", of: [{ type: "ctaButton" }], validation: (r) => r.max(2) }),
    defineField({ name: "background", type: "string", initialValue: "white",
      options: { list: ["white", "neutral", "primary"], layout: "radio" } }),
    defineField({ name: "showIfRegistrationOpen", type: "boolean", initialValue: false,
      description: "Hide the whole banner unless online registration is open." }),
  ],
});

// peopleGrid
export const peopleGrid = defineType({
  name: "peopleGrid", title: "People", type: "object",
  fields: [
    defineField({ name: "header", type: "sectionHeader" }),
    defineField({
      name: "groups", type: "array", validation: (r) => r.min(1),
      of: [{ type: "object", name: "peopleGroup", fields: [
        defineField({ name: "label", type: "localizedString" }),
        defineField({ name: "layout", type: "string", initialValue: "card",
          options: { layout: "radio", list: [
            { title: "Card (photo or initials, name, title)", value: "card" },
            { title: "Compact (one line)", value: "compact" },
            { title: "Contact (name, title, phone, 'Send a message')", value: "contact" },
          ] } }),
        defineField({ name: "people", type: "array", of: [{ type: "reference", to: [{ type: "person" }],
          options: { filter: "active == true" } }], validation: (r) => r.min(1) }),
      ], preview: { select: { title: "label.en", subtitle: "layout" } } }],
    }),
  ],
});
```

**PeopleGrid `contact` layout:** shows name, title, the org phone from `siteSettings` (not a per-person phone), and a "Send a message" link to `/contact`. **No email appears in any layout.** The `person` type has no email field and the GROQ projection is an allow-list.

### 3.2 What each block replaces today

| Block | Replaces | Variants used |
| --- | --- | --- |
| PageHero | `ScholarshipsHero`, `AboutHero`, `ContactHero`, `ResourcesHero`, `GetInvolvedHero`, `Hero` (home), events hero | `compact` (5 pages), `full` (home), `titleOnly` (events) |
| RichText | new (the dedication text, "Next cycle" blurbs, future prose) | n/a |
| CTABanner | `ScholarshipCTA`, `AboutCTA`, `GetInvolvedCTA`, `RegisterInfoSection` | `white`, `neutral`, `primary` + icon |
| PeopleGrid | `ScholarshipContacts` (`contact`), `BoardOfDirectors` (`card`, `compact`) | all three |

---

## 4. Queries (GROQ)

One file per page in `src/sanity/queries/`, plus shared pieces. Each query returns **both languages** (`title{en,es}`), never a single resolved language.

```
src/sanity/
  client.ts                 // read-only client, server-only
  fetch.ts                  // sanityFetch(): tags, fallback, error logging
  helpers/pick.ts           // pick(), isEmptyLocalized()
  queries/
    fragments.ts            // shared projections (see below)
    siteSettings.ts
    home.ts  about.ts  resources.ts  getInvolved.ts  contact.ts
    scholarships.ts         // scholarshipsPage + referenced scholarship (+ people for contacts)
  schemas/ ...
```

```ts
// queries/fragments.ts
import { groq } from "next-sanity";

export const seoFragment = groq`seo{ title, description, "ogImage": ogImage.asset->url }`;
export const linkFragment = groq`{ label, type, value }`;
export const personFragment = groq`
  _id, name, group, order, title, bio,
  "photo": photo{ "url": asset->url, alt, hotspot }`;   // allow-list: no other fields leave the dataset
export const sectionsFragment = groq`sections[]{
  _key, _type,
  _type == "pageHero"   => { variant, eyebrow, heading, subheading, buttons[]{ style, link${linkFragment} }, badges[]{ text, icon } },
  _type == "richText"   => { header, body, background, width },
  _type == "ctaBanner"  => { heading, subheading, icon, background, showIfRegistrationOpen,
                             buttons[]{ style, icon, showIfRegistrationOpen, link${linkFragment} } },
  _type == "peopleGrid" => { header, groups[]{ _key, label, layout, "people": people[]->[active == true]|order(order asc){ ${personFragment} } } }
}`;

// queries/scholarships.ts
export const scholarshipsPageQuery = groq`
  *[_type == "scholarshipsPage" && _id == "scholarshipsPage"][0]{
    ${seoFragment},
    ${sectionsFragment},
    "scholarship": featuredScholarship->{ title, memorialNote, status, amount, recipients, semester, deadline, essayPrompt, eligibility }
  }`;
```

Caching tags per query: a query lists the tags it depends on.

| Query | Tags |
| --- | --- |
| `siteSettings` | `siteSettings` |
| `scholarshipsPage` | `page:scholarships`, `scholarship`, `person`, `siteSettings` |
| (future) other pages | `page:<name>`, `person` where they reference people, `siteSettings` |

---

## 5. Fetching, caching, fallback

```ts
// src/sanity/fetch.ts  (server only: `import "server-only"`)
export async function sanityFetch<T>({ query, params = {}, tags, fallback }: {
  query: string; params?: Record<string, unknown>; tags: string[]; fallback: () => T;
}): Promise<{ data: T; fromFallback: boolean }> {
  try {
    const data = await client.fetch<T | null>(query, params, { next: { tags, revalidate: 3600 } });
    if (data == null) throw new Error("document not found");
    return { data, fromFallback: false };
  } catch (err) {
    console.error("[sanity] fetch failed, using dictionary fallback", { tags, message: (err as Error).message });
    return { data: fallback(), fromFallback: true };
  }
}
```

- Tag-based caching with a 1-hour `revalidate` safety net, so a missed webhook still self-heals.
- `/api/revalidate` (POST) verifies `SANITY_REVALIDATE_SECRET` (Sanity's `parseBody` signature check) and calls `revalidateTag()` for the tags that match the changed `_type` (table in Step 3 docs). It's the only write path; it touches no database.
- The public layout reads the locale cookie, so pages already render per request. The Sanity fetch is cached by the **data cache** (tags), independent of page rendering, so a request does not hit Sanity every time.
- **Fallback = the current dictionaries** for that page (the shape adapter builds the same props from `translation/*.ts`). A Sanity outage shows today's site. The error is logged.
- The client is **never** imported by a client component (`server-only` enforces it). No browser requests to `*.sanity.io` except inside the Studio.

---

## 6. Language: instant switching, no reload

```
Server component (page.tsx)           Client section components
  reads cookie locale                   read `locale` from LanguageContext
  fetches page (en AND es)   ──props──▶ pick(field, locale)  (es → en fallback)
  passes plain JSON
```

```ts
// src/sanity/helpers/pick.ts
import type { Lang } from "@/types";

type Localized<T> = { en?: T; es?: T } | null | undefined;

const isEmptyValue = (v: unknown): boolean => {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) {
    if (v.length === 0) return true;
    // portable text: empty if no block has any non-blank span text
    return v.every((b: any) => !b?.children?.some((c: any) => (c?.text ?? "").trim() !== ""));
  }
  return false;
};

/** The field in `locale`, falling back to English when the Spanish is missing or empty. */
export function pick<T>(field: Localized<T>, locale: Lang): T | undefined {
  if (!field) return undefined;
  const v = field[locale];
  return isEmptyValue(v) ? field.en : v;
}
```

- Switching language only changes `locale` in `LanguageContext`; client sections re-render from the props they already hold. **No fetch, no `router.refresh()` needed for Sanity content.** (The switcher still refreshes server-only pages as it does now.)
- **Correct HTML before hydration:** the section components render with the server's cookie locale. This needs `LanguageProvider` to take `initialLocale` (decision 2 above). Without it the server HTML is English for everyone, as it is today on client pages.
- Both languages are in the page payload, which roughly doubles the text bytes for that page. At this site's size (a few KB of text per page) that is negligible.
- **Portable text** is rendered with `@portabletext/react` using a fixed component map (`strong`, `em`, `emphasis`, `link`, bullet list). Unknown marks are dropped.

---

## 7. Studio, permissions, structure (Step 2 preview)

- Embedded Studio at `/admin/studio/[[...tool]]` (`NextStudio`, `basePath: "/admin/studio"`). Its bundle loads only on that route.
- New permission `canEditSiteContent` for `PRESIDENT`, `VICE_PRESIDENT`, `SECRETARY`, `TREASURER`, and admin. Enforced twice: **middleware** (extend `/api/session/board-check` to accept the permission) and the **studio page** (server-side `requirePermission`-style check, redirect if missing). The sidebar link is hidden without it.
- Studio has no access to Postgres: it's a static client talking to Sanity. Nothing in `sanity.config.ts` imports Prisma or `lib/db`.
- Structure: Site settings (singleton) → Pages (six singletons, fixed order: Home, About, Resources, Get Involved, Scholarships, Contact) → People → Scholarships. Singletons get fixed IDs, and `newDocumentOptions` + `actions` hide create/delete/duplicate for them.

---

## 8. Seed (Step 2 preview) and scope check

`scripts/seed-sanity.ts` writes, matching today's site:

- `siteSettings` from `lib/site.ts` + dictionaries.
- People: Teresita Fernandez de Robles (`president`, "President / Presidenta"); Lou Anne Fetters (`founder`); Rosamaria Coles, Felix Garcia, Yolanda Ortiz (`pastPresident`). No emails. No photos (none exist today; initials render as now). Jesus M. Terrazas and Luis Ostos are not created as people: they live in the scholarship's `memorialNote`.
- `scholarshipsPage` + one `scholarship` doc in `comingSoon`, matching the live page text.
- Idempotent (`createOrReplace` with fixed IDs). Uses a **write token that is only in the seed script's environment**, never in the app.

**Not in this phase:** Home/About/Resources/Get Involved/Contact rendering from Sanity; sponsorship tiers; resource entries; nav; draft/preview mode; image optimization beyond `urlFor`.

---

## 9. Risks I can already see

1. **Visual parity** for Scholarships requires `PageHero compact`, a scholarship card renderer, `PeopleGrid contact` and `CTABanner` to reproduce the current markup exactly. I'll port the existing JSX/classes unchanged and diff screenshots against the current build.
2. **`registrationOpen` is a build/runtime flag**, not Sanity data. Blocks only declare *whether* to depend on it; code evaluates it.
3. **Webhook secret and tokens:** the revalidate endpoint must reject unsigned requests; the read token (if the dataset is private) stays server-side.
4. **Sanity free-plan limits** (seats, API requests) are worth a look once officers are invited.
5. Header isn't sticky today because of `overflow-x-hidden` on the layout wrapper (seen while testing the language switch). Unrelated to Sanity, noted for later.

**STOP: awaiting your approval of this schema, the answers to section 0, and the Sanity project ID.**
