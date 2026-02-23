import { cookies } from "next/headers";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";

  const content = {
    en: {
      title: "Resources",
      description:
        "Access educational resources, connect with national hemophilia organizations, find local healthcare providers, and discover support services for families affected by bleeding disorders in El Paso, Texas.",
      ogTitle: "Hemophilia Resources - HOEP",
      ogDescription:
        "Comprehensive resources for families with bleeding disorders: educational materials, treatment centers, national organizations, financial assistance, and local support services in El Paso.",
    },
    es: {
      title: "Recursos",
      description:
        "Acceda a recursos educativos, conéctese con organizaciones nacionales de hemofilia, encuentre proveedores de atención médica locales y descubra servicios de apoyo para familias afectadas por trastornos hemorrágicos en El Paso, Texas.",
      ogTitle: "Recursos de Hemofilia - HOEP",
      ogDescription:
        "Recursos completos para familias con trastornos hemorrágicos: materiales educativos, centros de tratamiento, organizaciones nacionales, asistencia financiera y servicios de apoyo local en El Paso.",
    },
  };

  const c = content[locale as "en" | "es"];

  return {
    title: c.title,
    description: c.description,

    openGraph: {
      title: c.ogTitle,
      description: c.ogDescription,
      url: "https://hemo-el-paso.org/resources",
      siteName: "Hemophilia Organization of El Paso",
      locale: locale === "es" ? "es_MX" : "en_US",
      type: "website",
      images: [
        {
          url: "https://hemo-el-paso.org/images/og-resources.jpg",
          width: 1200,
          height: 630,
          alt: locale === "es" ? "Recursos - HOEP" : "Resources - HOEP",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: c.ogTitle,
      description: c.ogDescription,
      images: ["https://hemo-el-paso.org/images/og-resources.jpg"],
    },

    alternates: {
      canonical: "https://hemo-el-paso.org/resources",
      languages: {
        "en-US": "https://hemo-el-paso.org/resources",
        "es-MX": "https://hemo-el-paso.org/resources",
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

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
