"use client";

import Link from "next/link";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { useEvents } from "@/context/EventsContext";
import { upcomingEventsTranslation } from "@/translation/homePage";

interface Props {
  lang: "en" | "es";
}

export default function UpcomingEvents({ lang }: Props) {
  const { upcomingEvents, loading } = useEvents();

  const t = upcomingEventsTranslation[lang];

  // Only show first 3 events on homepage
  const displayEvents = upcomingEvents.slice(0, 3);

  return (
    <section className="py-20 bg-white">
      <div className="container-max px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-neutral-900 mb-4">
            {t.title}
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">{t.noEvents}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayEvents.map((event) => (
              <EventCard key={event.id} event={event} lang={lang} t={t} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
          >
            {t.viewAll}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function EventCard({
  event,
  lang,
  t,
}: {
  event: any;
  lang: "en" | "es";
  t: any;
}) {
  const eventDate = new Date(event.eventDate);
  const spotsLeft =
    event.maxCapacity && event._count?.rsvps !== undefined
      ? event.maxCapacity - event._count.rsvps
      : null;
  const title = lang === "en" ? event.titleEn : event.titleEs;
  const description = lang === "en" ? event.descriptionEn : event.descriptionEs;

  return (
    <div className="bg-neutral-50 rounded-2xl overflow-hidden border border-neutral-200 hover:shadow-lg transition-all group">
      {/* Date Badge */}
      <div className="bg-gradient-to-br from-primary to-secondary p-6 text-white">
        <div className="text-center">
          <div className="text-4xl font-bold">{eventDate.getDate()}</div>
          <div className="text-sm font-semibold uppercase tracking-wide">
            {eventDate.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
              month: "short",
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-display font-bold text-neutral-900 text-xl mb-3 group-hover:text-primary transition-colors">
          {title}
        </h3>

        <div className="space-y-2 mb-4 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>
              {eventDate.toLocaleDateString(lang === "en" ? "en-US" : "es-ES", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          {spotsLeft !== null && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>
                {spotsLeft > 0 ? `${spotsLeft} ${t.spotsLeft}` : t.eventFull}
              </span>
            </div>
          )}
        </div>

        {description && (
          <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
            {description}
          </p>
        )}

        <Link
          href={`/events/${event.slug}`}
          className="block w-full text-center px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
        >
          {t.learnMore}
        </Link>
      </div>
    </div>
  );
}
