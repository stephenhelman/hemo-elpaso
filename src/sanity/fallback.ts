import { footerTranslation } from "@/translation/layoutPage";
import { contactInfoTranslation } from "@/translation/contactPage";
import {
  scholarshipHeroTranslation,
  scholarshipCardTranslation,
  scholarshipContactsTranslation,
  scholarshipCTATranslation,
} from "@/translation/scholarshipsPage";
import { boardOfDirectors } from "@/translation/aboutPage";
import { FACEBOOK_LABEL, FACEBOOK_URL, SITE_PHONE } from "@/lib/site";
import { localizedPt } from "./helpers/pt";
import { resourceItems, resourcesSections } from "./resourcesSource";
import { aboutSections, aboutFallbackRefs } from "./aboutSource";
import type { AboutPageData, ResourcesPageData, ScholarshipsPageData, SiteSettingsData } from "./types";

/** Used when Sanity is unreachable. Mirrors the code constants and dictionaries. */
export function siteSettingsFallback(): SiteSettingsData {
  const f = footerTranslation;
  const c = contactInfoTranslation;
  return {
    orgName: "Hemophilia Outreach of El Paso",
    tagline: { en: f.en.tagline, es: f.es.tagline },
    phone: { display: SITE_PHONE.display, e164: SITE_PHONE.e164 },
    facebookUrl: FACEBOOK_URL,
    facebookLabel: { ...FACEBOOK_LABEL },
    locationLabel: { en: c.en.addrVal, es: c.es.addrVal },
    contactNote: { en: c.en.note, es: c.es.note },
    footerText: { en: f.en.rights, es: f.es.rights },
    seo: null,
  };
}

/** Today's Scholarships page, expressed as Sanity-shaped data. */
export function scholarshipsPageFallback(): ScholarshipsPageData {
  const h = scholarshipHeroTranslation;
  const card = scholarshipCardTranslation;
  const con = scholarshipContactsTranslation;
  const cta = scholarshipCTATranslation;
  const president = boardOfDirectors.officers[0];
  return {
    seo: null,
    scholarship: {
      title: { en: card.en.heading, es: card.es.heading },
      memorialNote: { en: card.en.in_memory, es: card.es.in_memory },
      status: "comingSoon",
    },
    sections: [
      {
        _key: "hero",
        _type: "pageHero",
        variant: "compact",
        eyebrow: { en: h.en.eyebrow, es: h.es.eyebrow },
        heading: localizedPt(h.en.heading, h.es.heading),
        subheading: { en: h.en.sub, es: h.es.sub },
      },
      {
        _key: "contacts",
        _type: "peopleGrid",
        layout: "contact",
        header: {
          eyebrow: { en: con.en.eyebrow, es: con.es.eyebrow },
          heading: localizedPt(con.en.heading, con.es.heading),
          subheading: { en: con.en.sub, es: con.es.sub },
          align: "center",
        },
        people: [
          {
            _id: "fallback-president",
            name: president.name,
            group: "officer",
            office: { en: president.titleEn, es: president.titleEs },
          },
        ],
      },
      {
        _key: "cta",
        _type: "ctaBanner",
        background: "white",
        icon: "bell",
        heading: { en: cta.en.heading, es: cta.es.heading },
        subheading: { en: cta.en.sub, es: cta.es.sub },
        buttons: [
          {
            _type: "ctaButton",
            style: "primary",
            icon: "bell",
            showIfRegistrationOpen: true,
            link: { type: "internal", value: "/register-info", label: { en: cta.en.cta1, es: cta.es.cta1 } },
          },
          {
            _type: "ctaButton",
            style: "outline",
            icon: "arrowRight",
            link: { type: "internal", value: "/contact", label: { en: cta.en.cta2, es: cta.es.cta2 } },
          },
        ],
      },
    ],
  };
}

/** Today's Resources page, expressed as Sanity-shaped data (resource lists filled in). */
export function resourcesPageFallback(): ResourcesPageData {
  const items = resourceItems();
  return {
    seo: null,
    sections: resourcesSections().map((s: any) =>
      s._type === "resourceList"
        ? { ...s, items: items.filter((i) => i.category === s.category).sort((a, b) => (a.order ?? 100) - (b.order ?? 100)) }
        : s,
    ),
  };
}

/** Today's About page, expressed as Sanity-shaped data. */
export function aboutPageFallback(): AboutPageData {
  return { seo: null, sections: aboutSections(aboutFallbackRefs()) as any };
}
