"use client";

import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { useEvents } from "@/context/EventsContext";
import { upcomingEventsTranslation } from "@/translation/homePage";
import { EventCard } from "../events/EventCard";
import { Lang } from "@/types";

interface Props {
  locale: Lang;
}

export default function UpcomingEvents({ locale }: Props) {
  const { upcomingEvents, loading } = useEvents();

  const t = upcomingEventsTranslation[locale];

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
              <EventCard
                key={event.id}
                event={event}
                lang={locale}
                isPast={false}
              />
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
