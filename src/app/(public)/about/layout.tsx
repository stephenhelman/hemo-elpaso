import { getDefaultShareImage, getAboutPage } from "@/sanity/data";
import { pick } from "@/sanity/helpers/pick";
import { getLocaleCookie } from "@/lib/locale";
import { siteUrl } from "@/lib/site";
import type { Metadata } from "next";
import type { Lang } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteUrl();
  const locale = (await getLocaleCookie()) as Lang;

  const content = {
    en: {
      title: "About Us",
      description:
        "Learn about Hemophilia Outreach of El Paso (HOEP), founded in 1993 by Lou Anne Fetters to support families affected by bleeding disorders in the El Paso community.",
      ogTitle: "About HOEP - Supporting Families Since 1993",
      ogDescription:
        "Discover our mission to provide support, education, and resources for families affected by hemophilia and bleeding disorders in El Paso, Texas.",
    },
    es: {
      title: "Sobre Nosotros",
      description:
        "Conozca la Hemophilia Outreach of El Paso (HOEP), fundada en 1993 por Lou Anne Fetters para apoyar a familias afectadas por trastornos hemorrágicos en la comunidad de El Paso.",
      ogTitle: "Sobre HOEP - Apoyando Familias Desde 1993",
      ogDescription:
        "Descubra nuestra misión de brindar apoyo, educación y recursos para familias afectadas por hemofilia y trastornos hemorrágicos en El Paso, Texas.",
    },
  };

  const c = content[locale as "en" | "es"];
  // Site-wide default share image from Sanity; when absent, Next serves src/app/opengraph-image.png.
  const defaultOg = await getDefaultShareImage();
  // Page-level SEO from Sanity wins; the dictionary copy above is the fallback.
  const page = await getAboutPage();
  const lang = locale === "es" ? "es" : "en";
  const seoTitle = pick(page.seo?.title, lang);
  const seoDesc = pick(page.seo?.description, lang);
  const og = page.seo?.ogImage ?? defaultOg;

  return {
    title: seoTitle ?? c.title,
    description: seoDesc ?? c.description,

    openGraph: {
      title: c.ogTitle,
      description: seoDesc ?? c.ogDescription,
      url: `${site}/about`,
      siteName: "Hemophilia Outreach of El Paso",
      locale: locale === "es" ? "es_MX" : "en_US",
      type: "website",
      ...(og ? { images: [{ url: og, width: 1200, height: 630, alt: c.ogTitle }] } : {}),
    },

    twitter: {
      card: "summary_large_image",
      title: c.ogTitle,
      description: c.ogDescription,
      ...(og ? { images: [og] } : {}),
    },

    alternates: {
      canonical: `${site}/about`,
      languages: {
        "en-US": `${site}/about`,
        "es-MX": `${site}/about`,
      },
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
