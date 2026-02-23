"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatEventDate } from "@/lib/event-utils";
import { Lang } from "@/types";

interface Props {
  event: any;
  locale: Lang;
}

export function RecommendedEventCard({ event, locale }: Props) {
  const eventDate = formatEventDate(event.eventDate, locale);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="flex items-start gap-4 p-4 rounded-xl bg-white border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all group"
    >
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-xs text-white font-semibold">
          {eventDate.month}
        </span>
        <span className="text-2xl font-bold text-white">{eventDate.day}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">
            {event.titleEn}
          </h3>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex-shrink-0">
            <Sparkles className="w-3 h-3" />
            {event.matchScore}%
          </div>
        </div>
        <p className="text-sm text-neutral-500 mb-2 line-clamp-1">
          {event.descriptionEn}
        </p>
        {event.matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.matchReasons.slice(0, 2).map((reason: string, i: number) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 text-xs font-medium"
              >
                ✓ {reason}
              </span>
            ))}
          </div>
        )}
      </div>
      <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
    </Link>
  );
}
