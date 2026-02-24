"use client";

import { useState, useMemo } from "react";
import {
  LayoutGrid,
  List,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import EventRowWithQr from "./EventRowWithQr";
import { EventRowActions } from "./EventRowActions";
import InviteSponsorButton from "./InviteSponsorButton";
import ExportButton from "@/components/ui/ExportButton";
import { adminEventsTranslation } from "@/translation/adminPages";
import { useLanguage } from "@/context/LanguageContext";
import { Select } from "../form/Select";
import { EventFilterOptions } from "../events/EventFilterOptions";
import { eventStatusEnum, eventTopicEnum } from "@/translation/enumConfig";

interface Event {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  eventDate: Date;
  location: string;
  status: string;
  category: string;
  maxCapacity: number | null;
  isPriority: boolean;
  _count: {
    rsvps: number;
  };
}

interface Props {
  events: Event[];
}

export default function EventsDisplay({ events }: Props) {
  const { locale } = useLanguage();
  const t = adminEventsTranslation[locale];

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showPastEvents, setShowPastEvents] = useState(false);

  const now = new Date();

  // Filter and sort events
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const filtered = events.filter((event) => {
      const matchesSearch =
        event.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || event.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    const upcoming = filtered
      .filter((e) => new Date(e.eventDate) >= now)
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
      );

    const past = filtered
      .filter((e) => new Date(e.eventDate) < now)
      .sort(
        (a, b) =>
          new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
      );

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events, searchQuery, statusFilter, categoryFilter]);

  const exportRows = [...upcomingEvents, ...pastEvents].map((event) => [
    locale === "es" ? event.titleEs : event.titleEn,
    new Date(event.eventDate).toLocaleDateString(),
    event.location,
    t.statusLabels[event.status as keyof typeof t.statusLabels] ?? event.status,
    t.categoryLabels[event.category as keyof typeof t.categoryLabels] ??
      event.category.replace(/_/g, " "),
    event._count.rsvps,
    event.maxCapacity ?? t.unlimited,
    event.isPriority ? t.yes : t.no,
  ]);

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            classNames="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <EventFilterOptions
              lang={locale}
              enumVals={eventStatusEnum}
              allVal="status"
            />
          </Select>

          {/* Category Filter */}
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            classNames="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <EventFilterOptions
              lang={locale}
              enumVals={eventTopicEnum}
              allVal="topic"
            />
          </Select>

          {/* Export */}
          <ExportButton
            headers={[
              t.csvHeaders.title,
              t.csvHeaders.date,
              t.csvHeaders.location,
              t.csvHeaders.status,
              t.csvHeaders.category,
              t.csvHeaders.rsvps,
              t.csvHeaders.capacity,
              t.csvHeaders.priority,
            ]}
            rows={exportRows}
            filename={`events-${new Date().toISOString().split("T")[0]}.csv`}
          />

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-primary shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded transition-colors ${
                viewMode === "table"
                  ? "bg-white text-primary shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
              title="Table view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="text-sm text-neutral-500 mt-4">
          {t.showing(
            upcomingEvents.length + (showPastEvents ? pastEvents.length : 0),
            events.length,
          )}
        </p>
      </div>

      {/* Upcoming Events */}
      <div>
        <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">
          {t.upcomingEvents(upcomingEvents.length)}
        </h2>

        {upcomingEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-400">{t.noUpcomingMatch}</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <EventRowWithQr key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EventsTable events={upcomingEvents} t={t} />
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <button
            onClick={() => setShowPastEvents(!showPastEvents)}
            className="flex items-center gap-2 font-display font-bold text-neutral-900 text-xl mb-4 hover:text-primary transition-colors"
          >
            {t.pastEvents(pastEvents.length)}
            {showPastEvents ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {showPastEvents &&
            (viewMode === "grid" ? (
              <div className="space-y-3">
                {pastEvents.map((event) => (
                  <EventRowWithQr key={event.id} event={event} isPast />
                ))}
              </div>
            ) : (
              <EventsTable events={pastEvents} isPast t={t} />
            ))}
        </div>
      )}
    </div>
  );
}

type TranslationType = (typeof adminEventsTranslation)["en"];

function EventsTable({
  events,
  isPast,
  t,
}: {
  events: Event[];
  isPast?: boolean;
  t: TranslationType;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                {t.tableHeaders.date}
              </th>
              <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                {t.tableHeaders.event}
              </th>
              <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                {t.tableHeaders.location}
              </th>
              <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                {t.tableHeaders.rsvps}
              </th>
              <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                {t.tableHeaders.status}
              </th>
              <th className="px-3 py-3 md:px-6 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                {t.tableHeaders.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {events.map((event) => (
              <EventTableRow
                key={event.id}
                event={event}
                isPast={isPast}
                t={t}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventTableRow({
  event,
  isPast,
  t,
}: {
  event: Event;
  isPast?: boolean;
  t: TranslationType;
}) {
  const [showSponsorInvite, setShowSponsorInvite] = useState(false);
  const eventDate = new Date(event.eventDate);
  const spotsLeft = event.maxCapacity
    ? event.maxCapacity - event._count.rsvps
    : null;

  const statusColors: Record<string, string> = {
    draft: "bg-neutral-100 text-neutral-600",
    published: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
  };

  return (
    <>
      <tr
        className={`hover:bg-neutral-50 transition-colors ${isPast ? "opacity-75" : ""}`}
      >
        <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm text-neutral-900">
          {eventDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </td>
        <td className="px-3 py-3 md:px-6 md:py-4 text-sm text-neutral-900">
          <div className="flex items-center gap-2">
            <span className="font-medium">{event.titleEn}</span>
            {event.isPriority && <span className="text-xs">⭐</span>}
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            {t.categoryLabels[
              event.category as keyof typeof t.categoryLabels
            ] ?? event.category.replace("_", " ")}
          </div>
        </td>
        <td className="px-3 py-3 md:px-6 md:py-4 text-sm text-neutral-600">
          <div className="max-w-xs truncate">{event.location}</div>
        </td>
        <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm text-neutral-900">
          {event._count.rsvps}
          {spotsLeft !== null && (
            <span className="text-neutral-500"> / {event.maxCapacity}</span>
          )}
        </td>
        <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[event.status]}`}
          >
            {t.statusLabels[event.status as keyof typeof t.statusLabels] ??
              event.status}
          </span>
        </td>
        <td className="px-3 py-3 md:px-6 md:py-4 whitespace-nowrap">
          <EventRowActions
            event={event}
            setShowSponsorInvite={setShowSponsorInvite}
          />
        </td>
      </tr>
      {showSponsorInvite && (
        <InviteSponsorButton
          eventId={event.id}
          isOpen={showSponsorInvite}
          onClose={() => setShowSponsorInvite(false)}
        />
      )}
    </>
  );
}
