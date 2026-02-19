"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, Loader2 } from "lucide-react";
import {
  getStatusConfig,
  shouldShowNextBadge,
  shouldShowNowBadge,
  ItineraryStatus,
} from "@/lib/itinerary-status";

interface ItineraryItem {
  id: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  status: ItineraryStatus;
  location: string | null;
  sequenceOrder: number;
}

interface Props {
  eventId: string;
  lang: "en" | "es";
}

export default function LiveItinerary({ eventId, lang }: Props) {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItinerary();
    const interval = setInterval(fetchItinerary, 15000); // Every 15 seconds
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchItinerary = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/itinerary`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch itinerary:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-3" />
        <p className="text-neutral-400 text-sm">Loading schedule...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const t = {
    en: {
      title: "Event Schedule",
      now: "Now",
      next: "Coming Up",
      location: "Location",
    },
    es: {
      title: "Programa del Evento",
      now: "Ahora",
      next: "Próximamente",
      location: "Ubicación",
    },
  }[lang];

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
      <h3 className="font-display font-bold text-white text-lg mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        {t.title}
      </h3>

      <div className="space-y-4">
        {items.map((item, index) => {
          const title = lang === "en" ? item.titleEn : item.titleEs;
          const description =
            lang === "en" ? item.descriptionEn : item.descriptionEs;
          const startTime = new Date(item.startTime);
          const config = getStatusConfig(item.status);

          return (
            <div
              key={item.id}
              className={`flex gap-4 p-4 rounded-lg transition-all ${config.bgClass} ${config.borderClass}`}
            >
              <div className="flex-shrink-0 pt-1">{config.icon}</div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h4 className={`text-white ${config.textStyle}`}>{title}</h4>

                  {/* Badge Logic */}
                  {shouldShowNowBadge(item.status) && (
                    <span className="px-2 py-0.5 rounded-full bg-primary-500 text-white text-xs font-semibold">
                      {t.now}
                    </span>
                  )}

                  {shouldShowNextBadge(items, index) && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                      {t.next}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-neutral-400 mb-2">
                  <span>
                    {startTime.toLocaleTimeString(lang, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  {item.duration && <span>• {item.duration} min</span>}
                  {item.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.location}
                    </span>
                  )}
                </div>

                {description && (
                  <p className={`text-sm text-neutral-300 ${config.textStyle}`}>
                    {description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
