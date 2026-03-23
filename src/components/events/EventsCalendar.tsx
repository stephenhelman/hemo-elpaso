"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import type { Lang } from "@/types";
import type { Event } from "./PublicEventsDisplay";

const CATEGORY_COLORS: Record<string, string> = {
  EDUCATION: "#3b82f6",
  SOCIAL: "#8b5cf6",
  FUNDRAISING: "#f59e0b",
  ADVOCACY: "#ef4444",
  YOUTH: "#10b981",
  FAMILY_SUPPORT: "#ec4899",
  MEDICAL_UPDATE: "#06b6d4",
  FINANCIAL_ASSISTANCE: "#f97316",
};

interface Props {
  events: Event[];
  pastEvents?: Event[];
  lang: Lang;
  onEventClick: (event: Event) => void;
}

export function EventsCalendar({ events, pastEvents = [], lang, onEventClick }: Props) {
  const toCalendarEvent = (e: Event, isPast = false) => ({
    id: e.id,
    title: lang === "es" ? e.titleEs : e.titleEn,
    date: new Date(e.eventDate).toISOString().split("T")[0],
    backgroundColor: isPast ? "#9ca3af" : (CATEGORY_COLORS[e.category] ?? "#6b7280"),
    borderColor: "transparent",
    textColor: "#ffffff",
    extendedProps: { event: e },
  });

  const calendarEvents = [
    ...events.map((e) => toCalendarEvent(e, false)),
    ...pastEvents.map((e) => toCalendarEvent(e, true)),
  ];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <style>{`
        .fc .fc-toolbar-title { font-size: 1.1rem; font-weight: 700; }
        .fc .fc-button { font-size: 0.8rem; padding: 0.25rem 0.6rem; }
        .fc .fc-button-primary { background-color: var(--color-primary, #7c3aed); border-color: var(--color-primary, #7c3aed); }
        .fc .fc-button-primary:hover { background-color: var(--color-primary-600, #6d28d9); border-color: var(--color-primary-600, #6d28d9); }
        .fc .fc-button-primary:not(:disabled):active,
        .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: var(--color-primary-700, #5b21b6); border-color: var(--color-primary-700, #5b21b6); }
        .fc .fc-daygrid-event { cursor: pointer; border-radius: 4px; padding: 1px 4px; }
        .fc .fc-event-title { font-size: 0.75rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fc-day-today { background-color: #faf5ff !important; }
      `}</style>
      <div className="p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          eventClick={(info) => onEventClick(info.event.extendedProps.event as Event)}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          height="auto"
          locales={[esLocale]}
          locale={lang}
          dayMaxEvents={3}
          eventDisplay="block"
          fixedWeekCount={false}
        />
      </div>
    </div>
  );
}
