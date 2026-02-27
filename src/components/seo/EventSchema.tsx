interface EventSchemaProps {
  event: {
    titleEn: string;
    titleEs: string;
    descriptionEn: string;
    descriptionEs: string;
    eventDate: Date;
    location: string;
    imageUrl?: string;
    slug: string;
  };
  locale: "en" | "es";
}

export default function EventSchema({ event, locale }: EventSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: locale === "es" ? event.titleEs : event.titleEn,
    description: locale === "es" ? event.descriptionEs : event.descriptionEn,
    startDate: event.eventDate.toISOString(),
    endDate: new Date(
      event.eventDate.getTime() + 2 * 60 * 60 * 1000,
    ).toISOString(), // +2 hours
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.location,
      address: {
        "@type": "PostalAddress",
        addressLocality: "El Paso",
        addressRegion: "TX",
        addressCountry: "US",
      },
    },
    image: event.imageUrl || "https://hemo-el-paso.org/og-default.jpg",
    organizer: {
      "@type": "Organization",
      name: "Hemophilia Outreach of El Paso",
      url: "https://hemo-el-paso.org",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://hemo-el-paso.org/events/${event.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
