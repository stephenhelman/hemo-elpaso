"use client";

import { portalEventsPageTranslation } from "@/translation/portalPages";
import { Calendar } from "lucide-react";
import PortalEventsDisplay from "../PortalEventsDisplay";
import { Lang } from "@/types";

interface Props {
  myRsvps: any[];
  recommendedEvents: any[];
  allEvents: any[];
  locale: Lang;
}

export function PortalEventsContent({
  myRsvps,
  recommendedEvents,
  allEvents,
  locale,
}: Props) {
  const t = portalEventsPageTranslation[locale];
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
          {t.heading}
        </h1>
        <p className="text-neutral-500">{t.subtitle}</p>
      </div>

      {myRsvps.length === 0 &&
      recommendedEvents.length === 0 &&
      allEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-display font-bold text-neutral-900 mb-2">
            {t.noEvents}
          </h3>
          <p className="text-neutral-500">{t.noEventsDesc}</p>
        </div>
      ) : (
        <PortalEventsDisplay
          myRsvps={myRsvps}
          recommendedEvents={recommendedEvents}
          allEvents={allEvents}
          locale={locale}
        />
      )}
    </div>
  );
}
