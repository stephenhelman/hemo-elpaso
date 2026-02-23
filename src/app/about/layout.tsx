import { cookies } from "next/headers";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";

  const content = {
    en: {
      title: "About Us",
      description:
        "Learn about Hemophilia Organization of El Paso (HOEP), founded in 1993 by Lou Anne Fetters to support families affected by bleeding disorders in the El Paso community.",
      ogTitle: "About HOEP - Supporting Families Since 1993",
      ogDescription:
        "Discover our mission to provide support, education, and resources for families affected by hemophilia and bleeding disorders in El Paso, Texas.",
    },
    es: {
      title: "Sobre Nosotros",
      description:
        "Conozca la Organización de Hemofilia de El Paso (HOEP), fundada en 1993 por Lou Anne Fetters para apoyar a familias afectadas por trastornos hemorrágicos en la comunidad de El Paso.",
      ogTitle: "Sobre HOEP - Apoyando Familias Desde 1993",
      ogDescription:
        "Descubra nuestra misión de brindar apoyo, educación y recursos para familias afectadas por hemofilia y trastornos hemorrágicos en El Paso, Texas.",
    },
  };

  const c = content[locale as "en" | "es"];

  return {
    title: c.title,
    description: c.description,

    openGraph: {
      title: c.ogTitle,
      description: c.ogDescription,
      url: "https://hemo-el-paso.org/about",
      siteName: "Hemophilia Organization of El Paso",
      locale: locale === "es" ? "es_MX" : "en_US",
      type: "website",
      images: [
        {
          url: "https://hemo-el-paso.org/images/og-about.jpg",
          width: 1200,
          height: 630,
          alt: locale === "es" ? "Equipo de HOEP" : "HOEP Team",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: c.ogTitle,
      description: c.ogDescription,
      images: ["https://hemo-el-paso.org/images/og-about.jpg"],
    },

    alternates: {
      canonical: "https://hemo-el-paso.org/about",
      languages: {
        "en-US": "https://hemo-el-paso.org/about",
        "es-MX": "https://hemo-el-paso.org/about",
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
