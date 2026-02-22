import { Lang } from "@/types";
import { Event } from "./PublicEventsDisplay";
import Link from "next/link";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { eventsActionTranslation } from "@/translation/eventsPage";
import { formatEventDate } from "@/lib/event-utils";

interface Props {
  event: Event;
  lang: Lang;
  isPast: boolean;
}

export function EventCard({ event, lang, isPast }: Props) {
  const titleLang = lang === "en" ? "titleEn" : "titleEs";
  const descriptionLang = lang === "en" ? "descriptionEn" : "descriptionEs";
  const eventDate = formatEventDate(event.eventDate, lang);
  const spotsLeft = event.maxCapacity
    ? event.maxCapacity - event._count.rsvps
    : null;
  const t = eventsActionTranslation[lang];
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-all group">
      {/* Date Badge */}
      <div className="bg-gradient-to-br from-primary to-secondary p-6 text-white">
        <div className="text-center">
          <div className="text-4xl font-bold">{eventDate.day}</div>
          <div className="text-sm font-semibold uppercase tracking-wide">
            {eventDate.month}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col gap-1">
        <h3 className="font-display font-bold text-neutral-900 text-xl mb-3 group-hover:text-primary transition-colors truncate">
          {event[titleLang]}
        </h3>

        <div className="space-y-2 mb-4 text-sm text-neutral-600">
          <div className="flex items-center gap-2 capitalize">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{eventDate.full}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          {spotsLeft !== null ? (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>{spotsLeft > 0 ? `${spotsLeft} ${t.spots}` : t.max}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>{t.noLimit}</span>
            </div>
          )}
        </div>

        {event[descriptionLang] && (
          <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
            {event[descriptionLang]}
          </p>
        )}

        <Link
          href={`/events/${event.slug}`}
          className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
        >
          {isPast ? t.past : t.rsvp}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
