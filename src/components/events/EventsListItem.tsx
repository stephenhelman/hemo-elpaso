"use client";

import { Event } from "@/components/events/PublicEventsDisplay";
import { Lang } from "@/types";
import { Calendar, MapPin, Users } from "lucide-react";
import { eventsActionTranslation } from "@/translation/eventsPage";
import { formatEventDate } from "@/lib/event-utils";

import Link from "next/link";

interface Props {
  event: Event;
  isPast: boolean;
  lang: Lang;
}

export function EventListItem({ event, isPast, lang }: Props) {
  const eventDate = formatEventDate(event.eventDate, lang);
  const spotsLeft = event.maxCapacity
    ? event.maxCapacity - event._count.rsvps
    : null;
  const titleLang = lang === "en" ? "titleEn" : "titleEs";
  const descriptionLang = lang === "en" ? "descriptionEn" : "descriptionEs";
  const t = eventsActionTranslation[lang];

  return (
    <div className="p-6 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start gap-6">
        {/* Date */}
        <div className="w-20 flex-shrink-0">
          <div className="text-center">
            <div className="text-3xl font-bold text-neutral-900">
              {eventDate.day}
            </div>
            <div className="text-sm font-semibold text-neutral-600 uppercase">
              {eventDate.month}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-neutral-900 text-lg mb-2">
            {event[titleLang]}
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600 mb-3">
            <div className="flex items-center gap-2 capitalize">
              <Calendar className="w-4 h-4" />
              {eventDate.full}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {event.location}
            </div>
            {!isPast && spotsLeft !== null && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {spotsLeft > 0 ? `${spotsLeft} ${t.spots}` : t.max}
              </div>
            )}
          </div>
          {event[descriptionLang] && (
            <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
              {event[descriptionLang]}
            </p>
          )}
        </div>

        {/* Action */}
        <Link
          href={`/events/${event.slug}`}
          className="flex-shrink-0 px-6 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
        >
          {isPast ? t.past : t.rsvp}
        </Link>
      </div>
    </div>
  );
}
