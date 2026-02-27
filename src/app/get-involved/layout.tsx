import { cookies } from "next/headers";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";

  const content = {
    en: {
      title: "Get Involved",
      description:
        "Join the Hemophilia Outreach of El Paso (HOEP) community as a volunteer, sponsor, or supporter. Make a difference in the lives of families affected by bleeding disorders. Explore volunteer opportunities and sponsorship tiers.",
      ogTitle: "Get Involved with HOEP - Volunteer & Sponsor",
      ogDescription:
        "Support families with bleeding disorders in El Paso. Become a volunteer, sponsor our events, or donate to make a meaningful impact in our community.",
    },
    es: {
      title: "Involúcrese",
      description:
        "Únase a la comunidad de la Hemophilia Outreach of El Paso (HOEP) como voluntario, patrocinador o colaborador. Haga una diferencia en las vidas de familias afectadas por trastornos hemorrágicos. Explore oportunidades de voluntariado y niveles de patrocinio.",
      ogTitle: "Involúcrese con HOEP - Voluntariado y Patrocinio",
      ogDescription:
        "Apoye a familias con trastornos hemorrágicos en El Paso. Conviértase en voluntario, patrocine nuestros eventos o done para tener un impacto significativo en nuestra comunidad.",
    },
  };

  const c = content[locale as "en" | "es"];

  return {
    title: c.title,
    description: c.description,

    openGraph: {
      title: c.ogTitle,
      description: c.ogDescription,
      url: "https://hemo-el-paso.org/get-involved",
      siteName: "Hemophilia Outreach of El Paso",
      locale: locale === "es" ? "es_MX" : "en_US",
      type: "website",
      images: [
        {
          url: "https://hemo-el-paso.org/images/og-get-involved.jpg",
          width: 1200,
          height: 630,
          alt: locale === "es" ? "Involúcrese - HOEP" : "Get Involved - HOEP",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: c.ogTitle,
      description: c.ogDescription,
      images: ["https://hemo-el-paso.org/images/og-get-involved.jpg"],
    },

    alternates: {
      canonical: "https://hemo-el-paso.org/get-involved",
      languages: {
        "en-US": "https://hemo-el-paso.org/get-involved",
        "es-MX": "https://hemo-el-paso.org/get-involved",
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

export default function GetInvolvedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
