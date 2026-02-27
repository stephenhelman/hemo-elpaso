import { Inter, Poppins } from "next/font/google";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import "./globals.css";
import SiteLayout from "@/components/layout/SiteLayout";
import OrganizationSchema from "@/components/seo/OrganizationSchema";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";

  const content = {
    en: {
      title: "Hemophilia Outreach of El Paso",
      description:
        "Supporting individuals and families affected by bleeding disorders in the El Paso community since 1993. Educational events, financial assistance, and community support for hemophilia and bleeding disorders.",
      ogTitle: "HOEP - Hemophilia Outreach of El Paso",
      ogDescription:
        "Building a stronger community for families affected by bleeding disorders in El Paso, Texas. Educational events, support groups, and financial assistance.",
    },
    es: {
      title: "Hemophilia Outreach of El Paso",
      description:
        "Apoyando a individuos y familias afectadas por trastornos hemorrágicos en la comunidad de El Paso desde 1993. Eventos educativos, asistencia financiera y apoyo comunitario para hemofilia y trastornos hemorrágicos.",
      ogTitle: "HOEP - Hemophilia Outreach of El Paso",
      ogDescription:
        "Construyendo una comunidad más fuerte para familias afectadas por trastornos hemorrágicos en El Paso, Texas. Eventos educativos, grupos de apoyo y asistencia financiera.",
    },
  };

  const c = content[locale as "en" | "es"];

  return {
    metadataBase: new URL("https://hemo-el-paso.org"),

    title: {
      default: c.title,
      template:
        locale === "es"
          ? "%s | Hemophilia Outreach of El Paso"
          : "%s | Hemophilia Outreach of El Paso",
    },

    description: c.description,

    keywords:
      locale === "es"
        ? [
            "hemofilia",
            "trastornos hemorrágicos",
            "El Paso",
            "comunidad",
            "apoyo",
            "eventos educativos",
            "asistencia financiera",
          ]
        : [
            "hemophilia",
            "bleeding disorders",
            "El Paso",
            "community",
            "support",
            "educational events",
            "financial assistance",
          ],

    authors: [{ name: "Hemophilia Outreach of El Paso" }],

    openGraph: {
      type: "website",
      locale: locale === "es" ? "es_MX" : "en_US",
      url: "https://hemo-el-paso.org",
      siteName:
        locale === "es"
          ? "Hemophilia Outreach of El Paso"
          : "Hemophilia Outreach of El Paso",
      title: c.ogTitle,
      description: c.ogDescription,
      images: [
        {
          url: "/images/og-default.jpg",
          width: 1200,
          height: 630,
          alt: locale === "es" ? "HOEP Logo" : "HOEP Logo",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: c.ogTitle,
      description: c.ogDescription,
      images: ["/images/og-default.jpg"],
    },

    alternates: {
      canonical: "https://hemo-el-paso.org",
      languages: {
        "en-US": "https://hemo-el-paso.org",
        "es-MX": "https://hemo-el-paso.org",
      },
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    verification: {
      // google: 'your-google-verification-code', // Add when you set up Search Console
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get locale for dynamic lang attribute
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <OrganizationSchema />
      </head>
      <body className={`${inter.variable} ${poppins.variable}`}>
        <SiteLayout>{children}</SiteLayout>
      </body>
    </html>
  );
}
