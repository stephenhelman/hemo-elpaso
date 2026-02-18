"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  List,
  Search,
  Calendar,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";

interface Event {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string | null;
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
}

export default function PublicEventsDisplay({
  upcomingEvents,
  pastEvents,
}: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showPastEvents, setShowPastEvents] = useState(false);

  // Filter upcoming events
  const filteredUpcoming = useMemo(() => {
    return upcomingEvents.filter((event) => {
      const matchesSearch =
        event.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.descriptionEn?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || event.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [upcomingEvents, searchQuery, categoryFilter]);

  // Filter past events
  const filteredPast = useMemo(() => {
    return pastEvents.filter((event) => {
      const matchesSearch =
        event.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || event.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [pastEvents, searchQuery, categoryFilter]);

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            <option value="EDUCATION">Education</option>
            <option value="FAMILY_SUPPORT">Family Support</option>
            <option value="YOUTH">Youth</option>
            <option value="FUNDRAISING">Fundraising</option>
            <option value="MEDICAL_UPDATE">Medical Update</option>
            <option value="SOCIAL">Social</option>
          </select>

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
              title="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="text-sm text-neutral-500 mt-4">
          Showing {filteredUpcoming.length} upcoming event
          {filteredUpcoming.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Upcoming Events */}
      <div>
        <h2 className="font-display font-bold text-neutral-900 text-2xl mb-6">
          Upcoming Events
        </h2>

        {filteredUpcoming.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-400">
              No upcoming events match your search
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUpcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EventsList events={filteredUpcoming} />
        )}
      </div>

      {/* Past Events */}
      {filteredPast.length > 0 && (
        <div>
          <button
            onClick={() => setShowPastEvents(!showPastEvents)}
            className="flex items-center gap-2 font-display font-bold text-neutral-900 text-xl mb-6 hover:text-primary transition-colors"
          >
            Past Events ({filteredPast.length})
            {showPastEvents ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {showPastEvents &&
            (viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                {filteredPast.map((event) => (
                  <EventCard key={event.id} event={event} isPast />
                ))}
              </div>
            ) : (
              <div className="opacity-75">
                <EventsList events={filteredPast} isPast />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, isPast }: { event: Event; isPast?: boolean }) {
  const eventDate = new Date(event.eventDate);
  const spotsLeft = event.maxCapacity
    ? event.maxCapacity - event._count.rsvps
    : null;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-all group">
      {/* Date Badge */}
      <div className="bg-gradient-to-br from-primary to-secondary p-6 text-white">
        <div className="text-center">
          <div className="text-4xl font-bold">{eventDate.getDate()}</div>
          <div className="text-sm font-semibold uppercase tracking-wide">
            {eventDate.toLocaleDateString("en-US", { month: "short" })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-display font-bold text-neutral-900 text-xl mb-3 group-hover:text-primary transition-colors">
          {event.titleEn}
        </h3>

        <div className="space-y-2 mb-4 text-sm text-neutral-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>
              {eventDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          {!isPast && spotsLeft !== null && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>
                {spotsLeft > 0 ? `${spotsLeft} spots left` : "Event full"}
              </span>
            </div>
          )}
        </div>

        {event.descriptionEn && (
          <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
            {event.descriptionEn}
          </p>
        )}

        <Link
          href={`/events/${event.slug}`}
          className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
        >
          {isPast ? "View Details" : "Learn More & RSVP"}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function EventsList({ events, isPast }: { events: Event[]; isPast?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-200">
      {events.map((event) => (
        <EventListItem key={event.id} event={event} isPast={isPast} />
      ))}
    </div>
  );
}

function EventListItem({ event, isPast }: { event: Event; isPast?: boolean }) {
  const eventDate = new Date(event.eventDate);
  const spotsLeft = event.maxCapacity
    ? event.maxCapacity - event._count.rsvps
    : null;

  return (
    <div className="p-6 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start gap-6">
        {/* Date */}
        <div className="w-20 flex-shrink-0">
          <div className="text-center">
            <div className="text-3xl font-bold text-neutral-900">
              {eventDate.getDate()}
            </div>
            <div className="text-sm font-semibold text-neutral-600 uppercase">
              {eventDate.toLocaleDateString("en-US", { month: "short" })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-neutral-900 text-lg mb-2">
            {event.titleEn}
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600 mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {eventDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {event.location}
            </div>
            {!isPast && spotsLeft !== null && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {spotsLeft > 0 ? `${spotsLeft} spots left` : "Event full"}
              </div>
            )}
          </div>
          {event.descriptionEn && (
            <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
              {event.descriptionEn}
            </p>
          )}
        </div>

        {/* Action */}
        <Link
          href={`/events/${event.slug}`}
          className="flex-shrink-0 px-6 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
        >
          {isPast ? "Details" : "RSVP"}
        </Link>
      </div>
    </div>
  );
}
