"use client";

import { EventPageHero } from "./EventPageHero";
import { EventPageContent } from "./EventPageContent";
import { useLanguage } from "@/context/LanguageContext";
import { SerializedEvent } from "@/lib/event-utils";

interface Props {
  referrer: string | undefined;
  event: SerializedEvent;
  hasRsvp: boolean;
  rsvpId: string | undefined;
  isCheckedIn: boolean;
  isLoggedIn: boolean;
  rsvpCount: number;
}

export function EventSlugPage({
  referrer,
  event,
  hasRsvp,
  rsvpId,
  isCheckedIn,
  isLoggedIn,
  rsvpCount,
}: Props) {
  const { locale } = useLanguage();

  return (
    <div className="min-h-screen bg-neutral-50">
      <EventPageHero locale={locale} referrer={referrer} event={event} />
      <EventPageContent
        locale={locale}
        isCheckedIn={isCheckedIn}
        rsvpCount={rsvpCount}
        hasRsvp={hasRsvp}
        rsvpId={rsvpId}
        event={event}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
