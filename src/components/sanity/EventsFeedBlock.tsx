"use client";

import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { useEvents } from "@/context/EventsContext";
import { EventCard } from "@/components/events/EventCard";
import { upcomingEventsTranslation } from "@/translation/homePage";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import type { Section } from "@/sanity/types";
import { HeadingText } from "./RichText";

type Block = Extract<Section, { _type: "eventsFeed" }>;

/**
 * Upcoming events. Sanity controls the heading, the limit (1-6) and the "view all" link; the events come
 * from Postgres through the existing /api/events path (public fields only). Empty/loading text and the
 * button label are UI text and stay in code.
 */
export default function EventsFeedBlock({ block, locale }: { block: Block; locale: Lang }) {
  const { upcomingEvents, loading } = useEvents();
  const ui = upcomingEventsTranslation[locale];
  const limit = Math.min(6, Math.max(1, block.limit ?? 3));
  const displayEvents = upcomingEvents.slice(0, limit);
  const sub = pick(block.header?.subheading, locale);

  return (
    <section className="py-20 bg-white">
      <div className="container-max px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {block.header?.heading && (
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-neutral-900 mb-4">
              <HeadingText field={block.header.heading} locale={locale} />
            </h2>
          )}
          {sub && <p className="text-lg text-neutral-600 max-w-2xl mx-auto">{sub}</p>}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">{ui.noEvents}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayEvents.map((event) => (
              <EventCard key={event.id} event={event} lang={locale} isPast={false} />
            ))}
          </div>
        )}

        {block.showViewAllLink !== false && (
          <div className="text-center mt-12">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
            >
              {ui.viewAll}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
