import { getLocaleCookie } from "@/lib/locale";
import { siteUrl } from "@/lib/site";
import type { Metadata } from "next";
import type { Lang } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteUrl();
  const locale = (await getLocaleCookie()) as Lang;

  const content = {
    en: {
      title: "Scholarships",
      description:
        "The Jesus M. Terrazas and Luis Ostos Memorial Scholarship, offered by Hemophilia Outreach of El Paso (HOEP) to students affected by bleeding disorders. The next cycle is coming soon.",
      ogTitle: "Memorial Scholarships for Students with Bleeding Disorders",
      ogDescription:
        "The Jesus M. Terrazas and Luis Ostos Memorial Scholarship supports students with hemophilia and bleeding disorders in El Paso, Texas. The next cycle is coming soon.",
    },
    es: {
      title: "Becas",
      description:
        "La Beca Conmemorativa Jesus M. Terrazas y Luis Ostos, ofrecida por Hemophilia Outreach of El Paso (HOEP) a estudiantes afectados por trastornos hemorrágicos. El próximo ciclo llegará pronto.",
      ogTitle:
        "Becas Conmemorativas para Estudiantes con Trastornos Hemorrágicos",
      ogDescription:
        "La Beca Conmemorativa Jesus M. Terrazas y Luis Ostos apoya a estudiantes con hemofilia y trastornos hemorrágicos en El Paso, Texas. El próximo ciclo llegará pronto.",
    },
  };

  const c = content[locale as "en" | "es"];

  return {
    title: c.title,
    description: c.description,

    openGraph: {
      title: c.ogTitle,
      description: c.ogDescription,
      url: `${site}/scholarships`,
      siteName: "Hemophilia Outreach of El Paso",
      locale: locale === "es" ? "es_MX" : "en_US",
      type: "website",
      images: [
        {
          url: `${site}/images/og-scholarships.jpg`,
          width: 1200,
          height: 630,
          alt: locale === "es" ? "Becas - HOEP" : "Scholarships - HOEP",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: c.ogTitle,
      description: c.ogDescription,
      images: [`${site}/images/og-scholarships.jpg`],
    },

    alternates: {
      canonical: `${site}/scholarships`,
      languages: {
        "en-US": `${site}/scholarships`,
        "es-MX": `${site}/scholarships`,
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

export default function ScholarshipsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
