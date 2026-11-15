import "server-only";
import { cache } from "react";
import { siteUrl } from "@/lib/site";
import { sanityFetch } from "./fetch";
import { siteSettingsQuery, SITE_SETTINGS_TAGS } from "./queries/siteSettings";
import { scholarshipsPageQuery, SCHOLARSHIPS_TAGS } from "./queries/scholarships";
import { resourcesPageQuery, RESOURCES_TAGS } from "./queries/resources";
import { aboutPageQuery, ABOUT_TAGS } from "./queries/about";
import { getInvolvedPageQuery, GET_INVOLVED_TAGS } from "./queries/getInvolved";
import { contactPageQuery, CONTACT_TAGS } from "./queries/contact";
import { homePageQuery, HOME_TAGS } from "./queries/home";
import { siteSettingsFallback, scholarshipsPageFallback, resourcesPageFallback, aboutPageFallback, getInvolvedPageFallback, contactPageFallback, homePageFallback } from "./fallback";
import type { HomePageData, ContactPageData, GetInvolvedPageData, AboutPageData, ResourcesPageData, ScholarshipsPageData, SiteSettingsData } from "./types";

const defined = <T extends object>(o: T): Partial<T> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v != null)) as Partial<T>;

/** Sanity doc merged over the code fallback, field by field (a half-filled doc never blanks the site). */
export const getSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  const fb = siteSettingsFallback();
  const { data } = await sanityFetch<SiteSettingsData | null>({
    query: siteSettingsQuery,
    tags: SITE_SETTINGS_TAGS,
    fallback: () => null,
  });
  if (!data) return fb;
  const d = defined(data);
  return { ...fb, ...d, phone: { ...fb.phone, ...defined(data.phone ?? ({} as any)) } } as SiteSettingsData;
});

export const getScholarshipsPage = cache(async (): Promise<ScholarshipsPageData> => {
  const { data } = await sanityFetch<ScholarshipsPageData>({
    query: scholarshipsPageQuery,
    tags: SCHOLARSHIPS_TAGS,
    fallback: scholarshipsPageFallback,
  });
  return { ...data, sections: data.sections ?? [] };
});

/** Site-wide default share image: Sanity (Site settings > SEO) or, when unset or unreachable, src/app/opengraph-image.png. */
export async function getDefaultShareImage(): Promise<string> {
  return (await getSiteSettings()).seo?.ogImage ?? `${siteUrl()}/opengraph-image.png`;
}

export const getResourcesPage = cache(async (): Promise<ResourcesPageData> => {
  const { data } = await sanityFetch<ResourcesPageData>({
    query: resourcesPageQuery,
    tags: RESOURCES_TAGS,
    fallback: resourcesPageFallback,
  });
  return { ...data, sections: data.sections ?? [] };
});

export const getAboutPage = cache(async (): Promise<AboutPageData> => {
  const { data } = await sanityFetch<AboutPageData>({
    query: aboutPageQuery,
    tags: ABOUT_TAGS,
    fallback: aboutPageFallback,
  });
  return { ...data, sections: data.sections ?? [] };
});

export const getGetInvolvedPage = cache(async (): Promise<GetInvolvedPageData> => {
  const { data } = await sanityFetch<GetInvolvedPageData>({
    query: getInvolvedPageQuery,
    tags: GET_INVOLVED_TAGS,
    fallback: getInvolvedPageFallback,
  });
  return { ...data, sections: data.sections ?? [] };
});

export const getContactPage = cache(async (): Promise<ContactPageData> => {
  const { data } = await sanityFetch<ContactPageData>({
    query: contactPageQuery,
    tags: CONTACT_TAGS,
    fallback: contactPageFallback,
  });
  // A half-filled document never blanks the page: missing parts come from the dictionary copy.
  const fb = contactPageFallback();
  return { ...fb, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v != null)) } as ContactPageData;
});

export const getHomePage = cache(async (): Promise<HomePageData> => {
  const { data } = await sanityFetch<HomePageData>({
    query: homePageQuery,
    tags: HOME_TAGS,
    fallback: homePageFallback,
  });
  return { ...data, sections: data.sections ?? [] };
});
