import { cookies } from "next/headers";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";

  const content = {
    en: {
      title: "Events",
      description:
        "Discover upcoming educational dinners, support groups, and community events hosted by Hemophilia Organization of El Paso (HOEP). Join us to connect with families, learn about bleeding disorders, and build community.",
      ogTitle: "HOEP Events - Educational Dinners & Support Groups",
      ogDescription:
        "Join our community events in El Paso. Educational dinners, support groups, family gatherings, and more for families affected by bleeding disorders.",
    },
    es: {
      title: "Eventos",
      description:
        "Descubra las próximas cenas educativas, grupos de apoyo y eventos comunitarios organizados por la Organización de Hemofilia de El Paso (HOEP). Únase a nosotros para conectarse con familias, aprender sobre trastornos hemorrágicos y construir comunidad.",
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
      url: "https://hemo-el-paso.org/events",
      siteName: "Hemophilia Organization of El Paso",
      locale: locale === "es" ? "es_MX" : "en_US",
      type: "website",
      images: [
        {
          url: "https://hemo-el-paso.org/images/og-events.jpg",
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
      images: ["https://hemo-el-paso.org/images/og-events.jpg"],
    },

    alternates: {
      canonical: "https://hemo-el-paso.org/events",
      languages: {
        "en-US": "https://hemo-el-paso.org/events",
        "es-MX": "https://hemo-el-paso.org/events",
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
