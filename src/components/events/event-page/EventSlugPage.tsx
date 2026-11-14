"use client";

import { EventPageHero } from "./EventPageHero";
import { EventPageContent } from "./EventPageContent";
import { useLanguage } from "@/context/LanguageContext";
import { SerializedEvent } from "@/lib/event-utils";

interface Props {
  referrer: string | undefined;
  event: SerializedEvent;
  rsvpCount: number;
}

export function EventSlugPage({
  referrer,
  event,
  rsvpCount,
}: Props) {
  const { locale } = useLanguage();

  return (
    <div className="min-h-screen bg-neutral-50">
      <EventPageHero locale={locale} referrer={referrer} event={event} />
      <EventPageContent
        locale={locale}
        rsvpCount={rsvpCount}
        event={event}
      />
    </div>
  );
}
