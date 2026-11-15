import { getDefaultShareImage, getSiteSettings } from "@/sanity/data";
import { getLocaleCookie } from "../../lib/locale";
import { siteUrl } from "@/lib/site";
import { registrationOpen } from "@/lib/registration";
import type { Metadata } from "next";
import "@/app/globals.css";
import SiteLayout from "@/components/layout/SiteLayout";
import OrganizationSchema from "@/components/seo/OrganizationSchema";
import SiteAnalytics from "@/components/analytics/SiteAnalytics";
import { inter, poppins, bonum } from "@/lib/fonts";
import { Lang } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  const site = siteUrl();
  const locale = (await getLocaleCookie()) as Lang;

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
  // Site-wide default share image from Sanity; when absent, Next serves src/app/opengraph-image.png.
  const og = await getDefaultShareImage();

  return {
    metadataBase: new URL(site),

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
      url: `${site}`,
      siteName:
        locale === "es"
          ? "Hemophilia Outreach of El Paso"
          : "Hemophilia Outreach of El Paso",
      title: c.ogTitle,
      description: c.ogDescription,
      ...(og ? { images: [{ url: og, width: 1200, height: 630, alt: c.ogTitle }] } : {}),
    },

    twitter: {
      card: "summary_large_image",
      title: c.ogTitle,
      description: c.ogDescription,
      ...(og ? { images: [og] } : {}),
    },

    alternates: {
      canonical: `${site}`,
      languages: {
        "en-US": `${site}`,
        "es-MX": `${site}`,
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
  const locale = (await getLocaleCookie()) as Lang;
  const settings = await getSiteSettings();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <OrganizationSchema />
      </head>
      <body className={`${inter.variable} ${poppins.variable} ${bonum.variable}`}>
        <SiteLayout
          registrationOpen={registrationOpen()}
          initialLocale={locale === "es" ? "es" : "en"}
          siteInfo={{
            orgName: settings.orgName,
            tagline: settings.tagline,
            phone: settings.phone,
            facebookUrl: settings.facebookUrl,
            facebookLabel: settings.facebookLabel,
            locationLabel: settings.locationLabel,
            contactNote: settings.contactNote,
            footerSponsors: settings.footerSponsors ?? [],
          }}
        >{children}</SiteLayout>
        <SiteAnalytics />
      </body>
    </html>
  );
}
