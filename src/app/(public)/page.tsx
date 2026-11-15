import type { Metadata } from "next";
import { getHomePage } from "@/sanity/data";
import { getLocaleCookie } from "@/lib/locale";
import { pick } from "@/sanity/helpers/pick";
import PageSections from "@/components/sanity/PageSections";

/** Home-page title/description from Sanity when set (the site-wide values in the layout are the fallback). */
export async function generateMetadata(): Promise<Metadata> {
  const page = await getHomePage();
  const lang = ((await getLocaleCookie()) as string) === "es" ? "es" : "en";
  const title = pick(page.seo?.title, lang);
  const description = pick(page.seo?.description, lang);
  return {
    ...(title ? { title: { absolute: title } } : {}),
    ...(description ? { description } : {}),
  };
}

/**
 * Rendered from Sanity (homePage), with today's dictionary copy as the fallback. The events themselves come
 * from Postgres via the events context; the registration band is hidden while REGISTRATION_OPEN is false.
 * The old components in components/home/* are kept as reference.
 */
export default async function Home() {
  const data = await getHomePage();
  return <PageSections sections={data.sections} />;
}
