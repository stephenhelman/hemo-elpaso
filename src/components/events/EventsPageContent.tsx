"use client";

import { eventsPageTranslation } from "@/translation/eventsPage";
import PublicEventsDisplay from "@/components/events/PublicEventsDisplay";
import { Calendar } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  events: any[];
}

export function EventsPageContent({ events }: Props) {
  const now = new Date();
  const { locale } = useLanguage();
  const t = eventsPageTranslation[locale];

  const upcomingEvents = events.filter((e) => new Date(e.eventDate) >= now);
  const pastEvents = events.filter((e) => new Date(e.eventDate) < now);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
              {t.title}
            </h1>
            <p className="text-xl text-neutral-300">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Events Display */}
      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center max-w-2xl mx-auto">
            <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-neutral-900 mb-2">
              {t.emptyTitle}
            </h3>
            <p className="text-neutral-500">{t.emptySubtitle}</p>
          </div>
        ) : (
          <PublicEventsDisplay
            upcomingEvents={upcomingEvents}
            pastEvents={pastEvents}
            lang={locale}
          />
        )}
      </div>
    </div>
  );
}
