import { cookies } from "next/headers";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";

  const content = {
    en: {
      title: "Contact Us",
      description:
        "Get in touch with Hemophilia Organization of El Paso (HOEP). We are here to help families affected by bleeding disorders. Reach out for support, questions, or to get involved in our community.",
      ogTitle: "Contact HOEP - We're Here to Help",
      ogDescription:
        "Connect with our team for support, resources, or information about hemophilia and bleeding disorders in El Paso, Texas.",
    },
    es: {
      title: "Contáctenos",
      description:
        "Comuníquese con la Organización de Hemofilia de El Paso (HOEP). Estamos aquí para ayudar a familias afectadas por trastornos hemorrágicos. Contáctenos para apoyo, preguntas o para involucrarse en nuestra comunidad.",
      ogTitle: "Contacte a HOEP - Estamos Aquí para Ayudar",
      ogDescription:
        "Conéctese con nuestro equipo para apoyo, recursos o información sobre hemofilia y trastornos hemorrágicos en El Paso, Texas.",
    },
  };

  const c = content[locale as "en" | "es"];

  return {
    title: c.title,
    description: c.description,

    openGraph: {
      title: c.ogTitle,
      description: c.ogDescription,
      url: "https://hemo-el-paso.org/contact",
      siteName: "Hemophilia Organization of El Paso",
      locale: locale === "es" ? "es_MX" : "en_US",
      type: "website",
      images: [
        {
          url: "https://hemo-el-paso.org/images/og-contact.jpg",
          width: 1200,
          height: 630,
          alt: locale === "es" ? "Contáctenos - HOEP" : "Contact Us - HOEP",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: c.ogTitle,
      description: c.ogDescription,
      images: ["https://hemo-el-paso.org/images/og-contact.jpg"],
    },

    alternates: {
      canonical: "https://hemo-el-paso.org/contact",
      languages: {
        "en-US": "https://hemo-el-paso.org/contact",
        "es-MX": "https://hemo-el-paso.org/contact",
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

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
