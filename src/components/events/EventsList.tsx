"use client";

import { Lang } from "@/types";
import { EventListItem } from "./EventsListItem";
import { Event } from "./PublicEventsDisplay";
interface Props {
  events: Event[];
  isPast: boolean;
  lang: Lang;
}

export function EventsList({ events, isPast, lang }: Props) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-200">
      {events.map((event) => (
        <EventListItem
          key={event.id}
          event={event}
          isPast={isPast}
          lang={lang}
        />
      ))}
    </div>
  );
}
