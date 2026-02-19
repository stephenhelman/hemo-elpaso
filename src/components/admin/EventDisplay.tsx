"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  List,
  Search,
  Calendar,
  Users,
  Pencil,
  ScanLine,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";
import EventRowWithQr from "./EventRowWithQr";

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

  return (
    <div className="space-y-6">
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
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              title="Table view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="text-sm text-neutral-500 mt-4">
          Showing{" "}
          {upcomingEvents.length + (showPastEvents ? pastEvents.length : 0)} of{" "}
          {events.length} events
        </p>
      </div>

      {/* Upcoming Events */}
      <div>
        <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">
          Upcoming Events ({upcomingEvents.length})
        </h2>

        {upcomingEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-400">
              No upcoming events match your filters
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <EventRowWithQr key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EventsTable events={upcomingEvents} />
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <button
            onClick={() => setShowPastEvents(!showPastEvents)}
            className="flex items-center gap-2 font-display font-bold text-neutral-900 text-xl mb-4 hover:text-primary transition-colors"
          >
            Past Events ({pastEvents.length})
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
              <EventsTable events={pastEvents} isPast />
            ))}
        </div>
      )}
    </div>
  );
}

function EventsTable({
  events,
  isPast,
}: {
  events: Event[];
  isPast?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Event
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                RSVPs
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {events.map((event) => (
              <EventTableRow key={event.id} event={event} isPast={isPast} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventTableRow({ event, isPast }: { event: Event; isPast?: boolean }) {
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
    <tr
      className={`hover:bg-neutral-50 transition-colors ${isPast ? "opacity-75" : ""}`}
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
        {eventDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
      <td className="px-6 py-4 text-sm text-neutral-900">
        <div className="flex items-center gap-2">
          <span className="font-medium">{event.titleEn}</span>
          {event.isPriority && <span className="text-xs">⭐</span>}
        </div>
        <div className="text-xs text-neutral-500 mt-1">
          {event.category.replace("_", " ")}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-neutral-600">
        <div className="max-w-xs truncate">{event.location}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
        {event._count.rsvps}
        {spotsLeft !== null && (
          <span className="text-neutral-500"> / {event.maxCapacity}</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[event.status]}`}
        >
          {event.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/events/${event.id}/polls`}
            className="p-1.5 rounded text-neutral-600 hover:bg-neutral-100 hover:text-purple-600 transition-colors"
            title="Manage Polls"
          >
            <BarChart3 className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/events/${event.id}/attendees`}
            className="p-1.5 rounded text-neutral-600 hover:bg-neutral-100 hover:text-blue-600 transition-colors"
            title="View Attendees"
          >
            <Users className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/checkin?event=${event.id}`}
            className="p-1.5 rounded text-neutral-600 hover:bg-neutral-100 hover:text-green-600 transition-colors"
            title="Check-In Scanner"
          >
            <ScanLine className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/events/${event.id}/edit`}
            className="p-1.5 rounded text-neutral-600 hover:bg-neutral-100 hover:text-primary transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}
