"use client";

import BackButton from "@/components/events/BackButton";
import { Lang } from "@/types";
import { Calendar, MapPin, Clock } from "lucide-react";
import {
  formatEventDate,
  getStatusLabel,
  SerializedEvent,
} from "@/lib/event-utils";

interface Props {
  referrer: string | undefined;
  locale: Lang;
  event: SerializedEvent;
}

export function EventPageHero({ referrer, locale, event }: Props) {
  const title = locale === "en" ? event.titleEn : event.titleEs;
  const date = formatEventDate(event.eventDate, locale);
  const status = getStatusLabel(event.status, locale);
  return (
    <div className="bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 py-12">
      <div className="container-max px-4 sm:px-6 lg:px-8">
        <BackButton referrer={referrer} lang={locale} />

        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold border border-primary-400/30">
                {status}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
              {title}
            </h1>

            {/* Quick Meta */}
            <div className="flex flex-wrap gap-4 text-neutral-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-400" />
                <span className="text-sm capitalize">{date.full}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-400" />
                <span className="text-sm">{date.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span className="text-sm">{event.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
