import type { Localized } from "./helpers/pick";

type PT = any[]; // portable text blocks

export type LinkData = { label: Localized; type: "internal" | "external" | "phone" | "email"; value: string };
export type SectionHeaderData = { eyebrow?: Localized; heading?: Localized<PT>; subheading?: Localized; align?: "left" | "center"; subWidth?: "narrow" | "wide" } | null;

export type PersonData = {
  _id: string;
  name: string;
  group: string;
  order?: number;
  office?: Localized;
  title?: Localized;
  bio?: Localized<PT>;
  photo?: { v?: string | null; alt?: Localized } | null;
};

export type SponsorData = {
  _id: string;
  name: string;
  website?: string | null;
  description?: Localized | null;
  sinceYear?: number | null;
  order?: number | null;
  active?: boolean | null; // only present for editor-picked sponsors (see visibleSponsors)
  logo?: { v?: string | null; alt?: Localized } | null;
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

/** An external conference (another organization's event). The last three fields are computed per request, never stored. */
export type ConferenceItem = {
  _id: string;
  name?: Localized;
  slug?: string | null;
  organizer?: string | null;
  summary?: Localized;
  startDate?: string | null; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  venue?: string | null;
  city?: string | null;
  state?: string | null;
  attendanceMode?: "inPerson" | "virtual" | "hybrid" | null;
  websiteUrl?: string | null;
  registrationUrl?: string | null;
  registrationOpensAt?: string | null; // ISO instant
  registrationClosesAt?: string | null; // ISO instant
  travelAssistance?: boolean | null;
  travelAssistanceNote?: Localized;
  travelAssistanceDeadline?: string | null; // YYYY-MM-DD
  travelAssistanceLink?: { type?: string | null; value?: string | null } | null;
  anchor?: string | null;
  registration?: "upcoming" | "open" | "closed" | null;
  travelOpen?: boolean;
};

/** Raw announcement content (lib/announcements turns it into what the browser gets). */
export type AnnouncementData = {
  _id: string;
  title?: Localized;
  text?: Localized;
  buttonLabel?: Localized;
  order?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  target?: {
    kind?: "page" | "event" | "conference" | "external" | null;
    page?: string | null;
    eventSlug?: string | null;
    url?: string | null;
    conference?: { _id: string; active?: boolean | null; slug?: string | null; organizer?: string | null; endDate?: string | null } | null;
  } | null;
};
/** A conference with "Announce when registration opens". */
export type AnnouncingConferenceData = Pick<
  ConferenceItem,
  "_id" | "slug" | "name" | "organizer" | "startDate" | "endDate" | "registrationOpensAt" | "registrationClosesAt"
> & { announcementTitle?: Localized; announcementText?: Localized };
export type AnnouncementsData = {
  announcements: AnnouncementData[] | null;
  conferences: AnnouncingConferenceData[] | null;
  hasConferenceSection: boolean | null;
};

export type Section =
  | { _key: string; _type: "pageHero"; decoration?: "one" | "two"; width?: "narrow" | "wide"; variant?: "full" | "compact" | "titleOnly"; eyebrow?: Localized; heading?: Localized<PT>; subheading?: Localized;
      buttons?: { style?: string; link: LinkData }[]; badges?: { text: Localized; icon?: string }[] }
  | { _key: string; _type: "richText"; header?: SectionHeaderData; body?: Localized<PT>; background?: "white" | "neutral"; width?: "narrow" | "wide" }
  | { _key: string; _type: "ctaBanner"; heading?: Localized; subheading?: Localized; icon?: string; background?: "white" | "neutral" | "primary";
      showIfRegistrationOpen?: boolean; buttons?: { _type?: string; style?: string; icon?: string; showIfRegistrationOpen?: boolean; link: LinkData }[] }
  | { _key: string; _type: "statsRow"; header?: SectionHeaderData;
      stats?: { _key?: string; source?: "manual" | "yearsOfService"; value?: number | null; suffix?: string | null; label?: Localized; animate?: boolean | null }[] }
  | { _key: string; _type: "eventsFeed"; header?: SectionHeaderData; limit?: number | null; showViewAllLink?: boolean | null }
  | { _key: string; _type: "textWithAside"; eyebrow?: Localized; heading?: Localized<PT>; body?: Localized<PT>; credit?: PersonData | null; creditTitle?: Localized;
      aside?: "foundingYear" | "pastPresidents" | "both"; foundedLabel?: Localized; foundedCaption?: Localized; pastPresidentsHeading?: Localized;
      pastPresidents?: { _id: string; name: string }[] }
  | { _key: string; _type: "cardGrid"; header?: SectionHeaderData; variant?: "emojiCard" | "iconCircle" | "iconSquareLink"; columns?: number;
      background?: "white" | "neutral"; continuesPrevious?: boolean;
      cards?: { _key?: string; icon?: string | null; emoji?: string | null; title?: Localized; body?: Localized; accent?: string | null;
                link?: { label?: Localized; type?: string; value?: string } | null }[] }
  | { _key: string; _type: "featuredPerson"; eyebrow?: Localized; subtitle?: Localized; quote?: Localized; body?: Localized<PT>; badges?: Localized[]; background?: "dark"; person?: PersonData | null }
  | { _key: string; _type: "resourceList"; header?: SectionHeaderData; category: string; layout?: "rich" | "org" | "provider" | "program" | "linkCard";
      columns?: number; items?: ResourceItem[] }
  | { _key: string; _type: "conferenceList"; header?: SectionHeaderData; background?: "white" | "neutral"; items?: ConferenceItem[] }
  | { _key: string; _type: "sponsorStrip"; header?: SectionHeaderData; mode?: "allActive" | "selected"; layout?: "grid" | "row"; showNames?: boolean; sponsors?: SponsorData[] | null }
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

export type HomePageData = { seo?: SeoData; sections: Section[] };

export type GetInvolvedPageData = { seo?: SeoData; sections: Section[] };

export type ContactPageData = {
  seo?: SeoData;
  hero?: Extract<Section, { _type: "pageHero" }> | null;
  formHeading?: Localized;
  formSubheading?: Localized;
  mapHeader?: SectionHeaderData;
};

export type AboutPageData = { seo?: SeoData; sections: Section[] };

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
  footerSponsors?: SponsorData[] | null;
  seo?: SeoData;
};
