import type { Localized } from "./helpers/pick";

type PT = any[]; // portable text blocks

export type LinkData = { label: Localized; type: "internal" | "external" | "phone" | "email"; value: string };
export type SectionHeaderData = { eyebrow?: Localized; heading?: Localized<PT>; subheading?: Localized; align?: "left" | "center" } | null;

export type PersonData = {
  _id: string;
  name: string;
  group: string;
  order?: number;
  office?: Localized;
  title?: Localized;
  bio?: Localized<PT>;
  photo?: { url?: string | null; alt?: Localized } | null;
};

export type ResourceItem = {
  _id: string;
  name: string;
  nameEs?: string | null;
  abbreviation?: string | null;
  category: string;
  kicker?: Localized | null;
  summary?: Localized | null;
  body?: Localized<PT> | null;
  facts?: Localized[] | null;
  address?: string | null;
  phone?: { display?: string | null; e164?: string | null } | null;
  meta?: { label?: Localized | null; value?: Localized | null }[] | null;
  link?: { label?: Localized | null; type?: string | null; value?: string | null } | null;
  accent?: string | null;
  icon?: string | null;
  order?: number | null;
};

export type Section =
  | { _key: string; _type: "pageHero"; decoration?: "one" | "two"; variant?: "full" | "compact" | "titleOnly"; eyebrow?: Localized; heading?: Localized<PT>; subheading?: Localized;
      buttons?: { style?: string; link: LinkData }[]; badges?: { text: Localized; icon?: string }[] }
  | { _key: string; _type: "richText"; header?: SectionHeaderData; body?: Localized<PT>; background?: "white" | "neutral"; width?: "narrow" | "wide" }
  | { _key: string; _type: "ctaBanner"; heading?: Localized; subheading?: Localized; icon?: string; background?: "white" | "neutral" | "primary";
      showIfRegistrationOpen?: boolean; buttons?: { style?: string; icon?: string; showIfRegistrationOpen?: boolean; link: LinkData }[] }
  | { _key: string; _type: "resourceList"; header?: SectionHeaderData; category: string; layout?: "rich" | "org" | "provider" | "program" | "linkCard";
      columns?: number; items?: ResourceItem[] }
  | { _key: string; _type: "peopleGrid"; header?: SectionHeaderData; layout?: "card" | "compact" | "contact"; people?: PersonData[] };

export type SeoData = { title?: Localized; description?: Localized; ogImage?: string | null } | null;

export type ScholarshipData = {
  title?: Localized;
  memorialNote?: Localized;
  status?: "comingSoon" | "open" | "closed";
  amount?: number | null;
  recipients?: number | null;
  semester?: Localized;
  deadline?: string | null; // YYYY-MM-DD
  essayPrompt?: Localized;
  eligibility?: { title?: Localized; body?: Localized }[];
} | null;

export type ScholarshipsPageData = { seo?: SeoData; sections: Section[]; scholarship?: ScholarshipData };

export type ResourcesPageData = { seo?: SeoData; sections: Section[] };

export type SiteSettingsData = {
  orgName: string;
  tagline?: Localized;
  phone: { display: string; e164: string };
  facebookUrl: string;
  facebookLabel?: Localized;
  locationLabel?: Localized;
  contactNote?: Localized;
  footerText?: Localized;
  seo?: SeoData;
};
