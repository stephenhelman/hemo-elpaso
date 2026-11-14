import { getLocaleCookie } from "@/lib/locale";
import { getSiteSettings } from "@/sanity/data";
import NotFoundContent from "@/components/layout/NotFoundContent";
import type { Lang } from "@/types";

export const metadata = { title: "Not found | Página no encontrada", robots: { index: false } };

/** 404 for notFound() calls inside public pages (renders inside the site layout). */
export default async function PublicNotFound() {
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  const s = await getSiteSettings();
  return <NotFoundContent locale={locale} orgName={s.orgName} tagline={s.tagline} phone={s.phone} />;
}
