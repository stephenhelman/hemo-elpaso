"use client";

import { useState, useMemo } from "react";
import type { Lang } from "@/types";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import dynamic from "next/dynamic";

import { ViewToggle, type ViewMode } from "../ui/ViewToggle";
import { EventFilterOptions } from "./EventFilterOptions";
import { EventsSearchBar } from "./EventSearchBar";
import { EventsList } from "./EventsList";
import { Select } from "../form/Select";
import { EventsShowingCaption } from "./EventsShowingCaption";
import { EventsGrid } from "./EventsGrid";
import { PublicEventSlidePanel } from "./EventSlidePanel";
import { eventsActionTranslation } from "@/translation/eventsPage";
import { eventTopicEnum } from "@/translation/enumConfig";

// FullCalendar is client-only — dynamic import prevents SSR issues
const EventsCalendar = dynamic(
  () => import("./EventsCalendar").then((m) => ({ default: m.EventsCalendar })),
  { ssr: false },
);

export interface Event {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  eventDate: Date;
  location: string;
  category: string;
  maxCapacity: number | null;
  isPriority: boolean;
  _count: {
    rsvps: number;
  };
}

interface Props {
  upcomingEvents: Event[];
  pastEvents: Event[];
  lang: Lang;
}

export default function PublicEventsDisplay({
  upcomingEvents,
  pastEvents,
  lang,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const t = eventsActionTranslation[lang];

  const filteredUpcoming = useMemo(() => {
    return upcomingEvents.filter((event) => {
      const titleLang = lang === "en" ? "titleEn" : "titleEs";
      const descriptionLang = lang === "en" ? "descriptionEn" : "descriptionEs";
      const matchesSearch =
        event[titleLang].toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event[descriptionLang]?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [upcomingEvents, searchQuery, categoryFilter, lang]);

  const filteredPast = useMemo(() => {
    return pastEvents.filter((event) => {
      const matchesSearch =
        event.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [pastEvents, searchQuery, categoryFilter]);

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <EventsSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            lang={lang}
          />
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            classNames="px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <EventFilterOptions lang={lang} enumVals={eventTopicEnum} allVal="topic" />
          </Select>
          <ViewToggle lang={lang} setViewMode={setViewMode} viewMode={viewMode} />
        </div>
        <EventsShowingCaption length={filteredUpcoming.length} lang={lang} />
      </div>

      {viewMode === "calendar" ? (
        /* ── Calendar view — shows all filtered events together ── */
        <EventsCalendar
          events={filteredUpcoming}
          pastEvents={filteredPast}
          lang={lang}
          onEventClick={setSelectedEvent}
        />
      ) : (
        <>
          {/* ── Upcoming Events ── */}
          <div>
            <h2 className="font-display font-bold text-neutral-900 text-2xl mb-6">
              {t.upcomingEvents}
            </h2>
            {filteredUpcoming.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-400">{t.noEvents}</p>
              </div>
            ) : viewMode === "grid" ? (
              <EventsGrid events={filteredUpcoming} isPast={false} lang={lang} />
            ) : (
              <EventsList events={filteredUpcoming} lang={lang} isPast={false} />
            )}
          </div>

          {/* ── Past Events ── */}
          {filteredPast.length > 0 && (
            <div>
              <button
                onClick={() => setShowPastEvents(!showPastEvents)}
                className="flex items-center gap-2 font-display font-bold text-neutral-900 text-xl mb-6 hover:text-primary transition-colors"
              >
                {t.pastEvents} ({filteredPast.length})
                {showPastEvents ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {showPastEvents &&
                (viewMode === "grid" ? (
                  <div className="opacity-75">
                    <EventsGrid events={filteredPast} isPast={true} lang={lang} />
                  </div>
                ) : (
                  <div className="opacity-75">
                    <EventsList events={filteredPast} isPast lang={lang} />
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* Slide panel — click any calendar chip to open */}
      <PublicEventSlidePanel
        event={selectedEvent}
        lang={lang}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
