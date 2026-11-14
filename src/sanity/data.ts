import "server-only";
import { cache } from "react";
import { siteUrl } from "@/lib/site";
import { sanityFetch } from "./fetch";
import { siteSettingsQuery, SITE_SETTINGS_TAGS } from "./queries/siteSettings";
import { scholarshipsPageQuery, SCHOLARSHIPS_TAGS } from "./queries/scholarships";
import { siteSettingsFallback, scholarshipsPageFallback } from "./fallback";
import type { ScholarshipsPageData, SiteSettingsData } from "./types";

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
