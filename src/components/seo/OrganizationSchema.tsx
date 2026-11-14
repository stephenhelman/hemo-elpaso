import { siteUrl, contactEmail, SITE_PHONE, FACEBOOK_URL, FOUNDING_YEAR } from "@/lib/site";
export default function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "NonProfit",
    name: "Hemophilia Outreach of El Paso",
    alternateName: "HOEP",
    url: siteUrl(),
    logo: `${siteUrl()}/logo.png`,
    description:
      "Supporting individuals and families affected by bleeding disorders in the El Paso community since 1993.",
    foundingDate: String(FOUNDING_YEAR),
    address: {
      "@type": "PostalAddress",
      addressLocality: "El Paso",
      addressRegion: "TX",
      addressCountry: "US",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE_PHONE.schema,
      contactType: "Customer Service",
      email: contactEmail(),
      availableLanguage: ["English", "Spanish"],
    },
    sameAs: [
      FACEBOOK_URL,
    ],
    areaServed: {
      "@type": "Place",
      name: "El Paso, Texas and surrounding areas",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
