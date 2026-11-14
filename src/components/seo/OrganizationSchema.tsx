import { siteUrl, contactEmail } from "@/lib/site";
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
    foundingDate: "1993",
    address: {
      "@type": "PostalAddress",
      addressLocality: "El Paso",
      addressRegion: "TX",
      addressCountry: "US",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-915-621-8291",
      contactType: "Customer Service",
      email: contactEmail(),
      availableLanguage: ["English", "Spanish"],
    },
    sameAs: [
      "https://facebook.com/HOEPElPaso", // Update with real links
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
