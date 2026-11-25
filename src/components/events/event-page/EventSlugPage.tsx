"use client";

import { EventPageHero } from "./EventPageHero";
import { EventPageContent } from "./EventPageContent";
import { useLanguage } from "@/context/LanguageContext";
import { SerializedEvent } from "@/lib/event-utils";
import type { EventRsvpView } from "@/lib/review/event-view";

interface Props {
  referrer: string | undefined;
  event: SerializedEvent;
  rsvpCount: number;
  registration: "open" | "full" | "closed" | "disabled";
  rsvpView: EventRsvpView;
  eventId: string;
  turnstileSiteKey: string | null;
  notices: { recorded: boolean; captions: boolean };
}

export function EventSlugPage({
  referrer,
  event,
  rsvpCount,
  registration,
  rsvpView,
  eventId,
  turnstileSiteKey,
  notices,
}: Props) {
  const { locale } = useLanguage();

  return (
    <div className="min-h-screen bg-neutral-50">
      <EventPageHero locale={locale} referrer={referrer} event={event} />
      <EventPageContent
        locale={locale}
        rsvpCount={rsvpCount}
        event={event}
        registration={registration}
        rsvpView={rsvpView}
        eventId={eventId}
        turnstileSiteKey={turnstileSiteKey}
        notices={notices}
      />
    </div>
  );
}
