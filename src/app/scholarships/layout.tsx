import { cookies } from "next/headers";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";

  const content = {
    en: {
      title: "Scholarships",
      description:
        "Apply for the Jesus M. Terrazas and Luis Ostos Memorial Scholarship, awarded by Hemophilia Organization of El Paso (HOEP) to students affected by bleeding disorders. Learn about eligibility, application requirements, and deadlines.",
      ogTitle: "Memorial Scholarships for Students with Bleeding Disorders",
      ogDescription:
        "The Jesus M. Terrazas and Luis Ostos Memorial Scholarship supports students with hemophilia and bleeding disorders in El Paso, Texas. Apply today to receive financial assistance for your education.",
    },
    es: {
      title: "Becas",
      description:
        "Solicite la Beca Conmemorativa Jesus M. Terrazas y Luis Ostos, otorgada por la Organización de Hemofilia de El Paso (HOEP) a estudiantes afectados por trastornos hemorrágicos. Conozca los requisitos de elegibilidad, solicitud y fechas límite.",
      ogTitle:
        "Becas Conmemorativas para Estudiantes con Trastornos Hemorrágicos",
      ogDescription:
        "La Beca Conmemorativa Jesus M. Terrazas y Luis Ostos apoya a estudiantes con hemofilia y trastornos hemorrágicos en El Paso, Texas. Solicite hoy para recibir asistencia financiera para su educación.",
    },
  };

  const c = content[locale as "en" | "es"];

  return {
    title: c.title,
    description: c.description,

    openGraph: {
      title: c.ogTitle,
      description: c.ogDescription,
      url: "https://hemo-el-paso.org/scholarships",
      siteName: "Hemophilia Organization of El Paso",
      locale: locale === "es" ? "es_MX" : "en_US",
      type: "website",
      images: [
        {
          url: "https://hemo-el-paso.org/images/og-scholarships.jpg",
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
      images: ["https://hemo-el-paso.org/images/og-scholarships.jpg"],
    },

    alternates: {
      canonical: "https://hemo-el-paso.org/scholarships",
      languages: {
        "en-US": "https://hemo-el-paso.org/scholarships",
        "es-MX": "https://hemo-el-paso.org/scholarships",
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
