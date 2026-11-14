import { getLocaleCookie } from "@/lib/locale";
import { siteUrl } from "@/lib/site";
import type { Metadata } from "next";
import type { Lang } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteUrl();
  const locale = (await getLocaleCookie()) as Lang;

  const content = {
    en: {
      title: "Events",
      description:
        "Discover upcoming educational dinners, support groups, and community events hosted by Hemophilia Outreach of El Paso (HOEP). Join us to connect with families, learn about bleeding disorders, and build community.",
      ogTitle: "HOEP Events - Educational Dinners & Support Groups",
      ogDescription:
        "Join our community events in El Paso. Educational dinners, support groups, family gatherings, and more for families affected by bleeding disorders.",
    },
    es: {
      title: "Eventos",
      description:
        "Descubra las próximas cenas educativas, grupos de apoyo y eventos comunitarios organizados por la Hemophilia Outreach of El Paso (HOEP). Únase a nosotros para conectarse con familias, aprender sobre trastornos hemorrágicos y construir comunidad.",
      ogTitle: "Eventos de HOEP - Cenas Educativas y Grupos de Apoyo",
      ogDescription:
        "Únase a nuestros eventos comunitarios en El Paso. Cenas educativas, grupos de apoyo, reuniones familiares y más para familias afectadas por trastornos hemorrágicos.",
    },
  };

  const c = content[locale as "en" | "es"];

  return {
    title: c.title,
    description: c.description,

    openGraph: {
      title: c.ogTitle,
      description: c.ogDescription,
      url: `${site}/events`,
      siteName: "Hemophilia Outreach of El Paso",
      locale: locale === "es" ? "es_MX" : "en_US",
      type: "website",
      images: [
        {
          url: `${site}/images/og-events.jpg`,
          width: 1200,
          height: 630,
          alt:
            locale === "es"
              ? "Eventos Comunitarios de HOEP"
              : "HOEP Community Events",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: c.ogTitle,
      description: c.ogDescription,
      images: [`${site}/images/og-events.jpg`],
    },

    alternates: {
      canonical: `${site}/events`,
      languages: {
        "en-US": `${site}/events`,
        "es-MX": `${site}/events`,
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

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
