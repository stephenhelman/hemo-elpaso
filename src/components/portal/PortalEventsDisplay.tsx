"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  LayoutGrid,
  List,
  CalendarDays,
  Search,
  Calendar,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
} from "lucide-react";
import QrCodeDisplay from "./QrCodeDisplay";
import EmptyState from "@/components/ui/EmptyState";
import DateBadge from "@/components/ui/DateBadge";
import InfoRow from "@/components/ui/InfoRow";
import { PortalEventSlidePanel } from "@/components/events/EventSlidePanel";
import RsvpModal from "@/components/portal/RsvpModal";
import { Lang } from "@/types";
import type { FamilyMember } from "@/types/family";
import { portalEventsDisplayTranslation } from "@/translation/portalPages";
import type { Event as PublicEvent } from "@/components/events/PublicEventsDisplay";

// FullCalendar is client-only
const EventsCalendar = dynamic(
  () => import("@/components/events/EventsCalendar").then((m) => ({ default: m.EventsCalendar })),
  { ssr: false },
);

type ViewMode = "grid" | "table" | "calendar";

interface Event {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  descriptionEn?: string | null;
  descriptionEs?: string | null;
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

interface RSVP {
  id: string;
  eventId: string;
  attendeeCount: number;
  familyMembershipIds: string[];
  event: Event;
}

interface Props {
  myRsvps: RSVP[];
  recommendedEvents: Event[];
  allEvents: Event[];
  familyMemberships: FamilyMember[];
  locale: Lang;
}

export default function PortalEventsDisplay({
  myRsvps,
  recommendedEvents,
  allEvents,
  familyMemberships,
  locale,
}: Props) {
  const t = portalEventsDisplayTranslation[locale];
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAllEvents, setShowAllEvents] = useState(true);
  const [expandedQr, setExpandedQr] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Lifted RSVP state — one modal serves all entry points
  const [rsvpingEvent, setRsvpingEvent] = useState<Event | null>(null);
  const [rsvpdEventIds, setRsvpdEventIds] = useState<Set<string>>(
    new Set(myRsvps.map((r) => r.eventId)),
  );
  const [changingRsvp, setChangingRsvp] = useState<{ event: Event; rsvpId: string; selectedIds: string[] } | null>(null);

  const now = new Date();

  const filteredAllEvents = useMemo(() => {
    return allEvents.filter((event) => {
      const matchesSearch =
        event.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
      return matchesSearch && matchesCategory && new Date(event.eventDate) >= now;
    });
  }, [allEvents, searchQuery, categoryFilter]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === "calendar") setShowAllEvents(true);
  };

  const handleRsvpClick = (event: Event) => {
    setSelectedEvent(null); // close slide panel if open
    setRsvpingEvent(event);
  };

  const handleRsvpSuccess = (eventId: string) => {
    setRsvpdEventIds((prev) => new Set([...prev, eventId]));
  };

  const handleRsvpChange = (rsvp: RSVP) => {
    setChangingRsvp({
      event: rsvp.event,
      rsvpId: rsvp.id,
      selectedIds: rsvp.familyMembershipIds,
    });
  };

  const handleRsvpChangeSuccess = (_eventId: string, _newAttendeeCount?: number) => {
    setChangingRsvp(null);
  };

  return (
    <div className="space-y-8">
      {/* My Upcoming Events */}
      {myRsvps.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-neutral-900 text-2xl mb-4">
            {t.myUpcoming} ({myRsvps.length})
          </h2>
          <div className="space-y-4">
            {myRsvps.map((rsvp) => (
              <MyEventCard
                key={rsvp.id}
                rsvp={rsvp}
                expanded={expandedQr === rsvp.id}
                onToggleQr={() => setExpandedQr(expandedQr === rsvp.id ? null : rsvp.id)}
                onChangeRsvp={() => handleRsvpChange(rsvp)}
                t={t}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Events */}
      {recommendedEvents.length > 0 && viewMode !== "calendar" && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="font-display font-bold text-neutral-900 text-2xl">
              {t.recommendedForYou} ({recommendedEvents.length})
            </h2>
          </div>
          <div className={viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-3"}>
            {recommendedEvents.map((event) =>
              viewMode === "grid" ? (
                <EventCard
                  key={event.id}
                  event={event}
                  t={t}
                  locale={locale}
                  alreadyRsvpd={rsvpdEventIds.has(event.id)}
                  onRsvpClick={() => handleRsvpClick(event)}
                />
              ) : (
                <EventTableRow
                  key={event.id}
                  event={event}
                  t={t}
                  locale={locale}
                  alreadyRsvpd={rsvpdEventIds.has(event.id)}
                  onRsvpClick={() => handleRsvpClick(event)}
                />
              ),
            )}
          </div>
        </div>
      )}

      {/* Browse All Events */}
      <div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowAllEvents(!showAllEvents)}
              className="flex items-center gap-2 font-display font-bold text-neutral-900 text-xl hover:text-primary transition-colors"
            >
              {t.browseAll} ({filteredAllEvents.length})
              {showAllEvents ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange("grid")}
                className={`p-2 rounded transition-colors ${viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-neutral-600 hover:text-neutral-900"}`}
                title="Grid view"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleViewModeChange("table")}
                className={`p-2 rounded transition-colors ${viewMode === "table" ? "bg-white text-primary shadow-sm" : "text-neutral-600 hover:text-neutral-900"}`}
                title="List view"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleViewModeChange("calendar")}
                className={`p-2 rounded transition-colors ${viewMode === "calendar" ? "bg-white text-primary shadow-sm" : "text-neutral-600 hover:text-neutral-900"}`}
                title="Calendar view"
              >
                <CalendarDays className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters — hidden in calendar mode */}
          {showAllEvents && viewMode !== "calendar" && (
            <div className="flex flex-col sm:flex-row gap-4">
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
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">{t.allCategories}</option>
                <option value="EDUCATION">{t.education}</option>
                <option value="FAMILY_SUPPORT">{t.familySupport}</option>
                <option value="YOUTH">{t.youth}</option>
                <option value="FUNDRAISING">{t.fundraising}</option>
                <option value="MEDICAL_UPDATE">{t.medicalUpdate}</option>
                <option value="SOCIAL">{t.social}</option>
              </select>
            </div>
          )}
        </div>

        {showAllEvents &&
          (filteredAllEvents.length === 0 && viewMode !== "calendar" ? (
            <EmptyState icon={Calendar} title={t.noEventsFound} description={t.noEventsMatch} />
          ) : viewMode === "calendar" ? (
            <EventsCalendar
              events={filteredAllEvents as unknown as PublicEvent[]}
              lang={locale}
              onEventClick={(e) => setSelectedEvent(e as unknown as Event)}
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAllEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  t={t}
                  locale={locale}
                  alreadyRsvpd={rsvpdEventIds.has(event.id)}
                  onRsvpClick={() => handleRsvpClick(event)}
                />
              ))}
            </div>
          ) : (
            <EventsTable
              events={filteredAllEvents}
              t={t}
              locale={locale}
              rsvpdEventIds={rsvpdEventIds}
              onRsvpClick={handleRsvpClick}
            />
          ))}
      </div>

      {/* Slide panel for calendar event clicks */}
      <PortalEventSlidePanel
        event={selectedEvent as unknown as PublicEvent | null}
        lang={locale}
        onClose={() => setSelectedEvent(null)}
        alreadyRsvpd={selectedEvent ? rsvpdEventIds.has(selectedEvent.id) : false}
        onRsvpClick={selectedEvent ? () => handleRsvpClick(selectedEvent) : undefined}
      />

      {/* Family-picker RSVP modal */}
      <RsvpModal
        event={rsvpingEvent}
        familyMembers={familyMemberships}
        locale={locale}
        onClose={() => setRsvpingEvent(null)}
        onSuccess={handleRsvpSuccess}
      />

      {/* Change RSVP modal */}
      <RsvpModal
        event={changingRsvp?.event ?? null}
        familyMembers={familyMemberships}
        locale={locale}
        mode="change"
        rsvpId={changingRsvp?.rsvpId}
        initialSelectedIds={changingRsvp?.selectedIds}
        onClose={() => setChangingRsvp(null)}
        onSuccess={handleRsvpChangeSuccess}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MyEventCard({
  rsvp,
  expanded,
  onToggleQr,
  onChangeRsvp,
  t,
  locale,
}: {
  rsvp: RSVP;
  expanded: boolean;
  onToggleQr: () => void;
  onChangeRsvp: () => void;
  t: (typeof portalEventsDisplayTranslation)["en"];
  locale: Lang;
}) {
  const event = rsvp.event;
  const eventDate = new Date(event.eventDate);

  return (
    <div className="bg-white rounded-2xl border-2 border-primary-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <DateBadge date={eventDate} variant="primary" size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 text-lg mb-2">
              {locale === "es" ? event.titleEs : event.titleEn}
            </h3>
            <div className="space-y-1 text-sm text-neutral-600 mb-3">
              <InfoRow icon={Calendar}>
                {eventDate.toLocaleDateString(locale === "es" ? "es-MX" : "en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </InfoRow>
              <InfoRow icon={MapPin}>{event.location}</InfoRow>
              <InfoRow icon={Users}>{rsvp.attendeeCount}</InfoRow>
            </div>
            <div className="flex gap-2">
              <Link href={`/events/${event.slug}?from=portal`} className="text-sm text-primary hover:underline">
                {t.viewDetails}
              </Link>
              <button onClick={onToggleQr} className="text-sm text-primary hover:underline">
                {expanded ? t.hideQr : t.showQr}
              </button>
              <button onClick={onChangeRsvp} className="text-sm text-primary hover:underline">
                {t.changeRsvp}
              </button>
            </div>
          </div>
        </div>
        {expanded && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            <QrCodeDisplay
              rsvpId={rsvp.id}
              eventTitle={locale === "es" ? event.titleEs : event.titleEn}
              compact={true}
              locale={locale}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  t,
  locale,
  alreadyRsvpd,
  onRsvpClick,
}: {
  event: Event;
  t: (typeof portalEventsDisplayTranslation)["en"];
  locale: Lang;
  alreadyRsvpd: boolean;
  onRsvpClick: () => void;
}) {
  const eventDate = new Date(event.eventDate);
  const spotsLeft = event.maxCapacity ? event.maxCapacity - event._count.rsvps : null;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 hover:shadow-md transition-all">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <DateBadge date={eventDate} variant="neutral" size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 mb-2">
              {locale === "es" ? event.titleEs : event.titleEn}
            </h3>
            <div className="space-y-1 text-sm text-neutral-600 mb-3">
              <InfoRow icon={MapPin} iconClassName="w-3.5 h-3.5">
                <span className="line-clamp-1">{event.location}</span>
              </InfoRow>
              {spotsLeft !== null && (
                <InfoRow icon={Users} iconClassName="w-3.5 h-3.5">
                  {spotsLeft} {t.spotsLeft}
                </InfoRow>
              )}
            </div>

            <div className="flex items-center gap-2">
              {alreadyRsvpd ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-semibold border border-green-200">
                  <Check className="w-3.5 h-3.5" />
                  {t.rsvped}
                </span>
              ) : (
                <button
                  onClick={onRsvpClick}
                  className="inline-block px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
                >
                  {t.quickRsvp}
                </button>
              )}
              <Link
                href={`/events/${event.slug}?from=portal`}
                className="text-sm text-neutral-500 hover:text-neutral-700 hover:underline"
              >
                {t.viewDetails}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventsTable({
  events,
  t,
  locale,
  rsvpdEventIds,
  onRsvpClick,
}: {
  events: Event[];
  t: (typeof portalEventsDisplayTranslation)["en"];
  locale: Lang;
  rsvpdEventIds: Set<string>;
  onRsvpClick: (event: Event) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="md:hidden divide-y divide-neutral-200">
        {events.map((event) => (
          <EventMobileCard
            key={event.id}
            event={event}
            t={t}
            locale={locale}
            alreadyRsvpd={rsvpdEventIds.has(event.id)}
            onRsvpClick={() => onRsvpClick(event)}
          />
        ))}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">{t.tableDate}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">{t.tableEvent}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">{t.tableLocation}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">{t.tableAvailability}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">{t.tableAction}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {events.map((event) => (
              <EventTableRow
                key={event.id}
                event={event}
                t={t}
                locale={locale}
                alreadyRsvpd={rsvpdEventIds.has(event.id)}
                onRsvpClick={() => onRsvpClick(event)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventMobileCard({
  event,
  t,
  locale,
  alreadyRsvpd,
  onRsvpClick,
}: {
  event: Event;
  t: (typeof portalEventsDisplayTranslation)["en"];
  locale: Lang;
  alreadyRsvpd: boolean;
  onRsvpClick: () => void;
}) {
  const eventDate = new Date(event.eventDate);
  const spotsLeft = event.maxCapacity ? event.maxCapacity - event._count.rsvps : null;

  return (
    <div className="p-4 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-neutral-100 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-xs text-neutral-600 font-semibold leading-none">
            {eventDate.toLocaleDateString(locale === "es" ? "es-MX" : "en-US", { month: "short" }).toUpperCase()}
          </span>
          <span className="text-lg font-bold text-neutral-900 leading-none">{eventDate.getDate()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900 text-sm mb-1">
            {locale === "es" ? event.titleEs : event.titleEn}
          </p>
          <div className="flex items-center gap-1 text-xs text-neutral-500 mb-1">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          {spotsLeft !== null && (
            <div className="flex items-center gap-1 text-xs text-neutral-500 mb-2">
              <Users className="w-3 h-3" />
              <span>{spotsLeft} {t.spotsLeft}</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-1">
            {alreadyRsvpd ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 font-semibold">
                <Check className="w-3 h-3" />
                {t.rsvped}
              </span>
            ) : (
              <button onClick={onRsvpClick} className="text-xs text-primary hover:underline font-semibold">
                {t.quickRsvp}
              </button>
            )}
            <Link href={`/events/${event.slug}?from=portal`} className="text-xs text-neutral-400 hover:underline">
              {t.viewDetails}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventTableRow({
  event,
  t,
  locale,
  alreadyRsvpd,
  onRsvpClick,
}: {
  event: Event;
  t: (typeof portalEventsDisplayTranslation)["en"];
  locale: Lang;
  alreadyRsvpd: boolean;
  onRsvpClick: () => void;
}) {
  const eventDate = new Date(event.eventDate);
  const spotsLeft = event.maxCapacity ? event.maxCapacity - event._count.rsvps : null;

  return (
    <tr className="hover:bg-neutral-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
        {eventDate.toLocaleDateString(locale === "es" ? "es-MX" : "en-US", { month: "short", day: "numeric" })}
      </td>
      <td className="px-6 py-4 text-sm font-medium text-neutral-900">
        {locale === "es" ? event.titleEs : event.titleEn}
      </td>
      <td className="px-6 py-4 text-sm text-neutral-600">
        <div className="max-w-xs truncate">{event.location}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
        {spotsLeft !== null ? `${spotsLeft} ${t.spotsLeft}` : t.unlimited}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {alreadyRsvpd ? (
          <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
            <Check className="w-3.5 h-3.5" />
            {t.rsvped}
          </span>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={onRsvpClick} className="text-primary hover:underline font-medium">
              {t.quickRsvp}
            </button>
            <Link href={`/events/${event.slug}?from=portal`} className="text-neutral-400 hover:underline text-xs">
              {t.viewDetails}
            </Link>
          </div>
        )}
      </td>
    </tr>
  );
}
