import { Lang } from "@/types";
import { Event } from "./PublicEventsDisplay";
import { EventCard } from "./EventCard";

interface Props {
  events: Event[];
  lang: Lang;
  isPast: boolean;
}

export function EventsGrid({ events, lang, isPast }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} lang={lang} isPast={isPast} />
      ))}
    </div>
  );
}
