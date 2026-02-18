import { prisma } from "@/lib/db";
import Link from "next/link";
import { Calendar, MapPin, Users, Plus, Pencil, Trash2 } from "lucide-react";
import { formatEventDate } from "@/lib/event-utils";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: {
      eventDate: "desc",
    },
    include: {
      _count: {
        select: { rsvps: true },
      },
    },
  });

  const upcoming = events.filter((e) => new Date(e.eventDate) >= new Date());
  const past = events.filter((e) => new Date(e.eventDate) < new Date());

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Events
          </h1>
          <p className="text-neutral-500">
            Manage all events, RSVPs, and attendance.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </Link>
      </div>

      {/* Upcoming Events */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">
          Upcoming Events ({upcoming.length})
        </h2>
        {upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
            <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-400 text-sm mb-4">No upcoming events</p>
            <Link
              href="/admin/events/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First Event
            </Link>
          </div>
        )}
      </div>

      {/* Past Events */}
      {past.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">
            Past Events ({past.length})
          </h2>
          <div className="space-y-3">
            {past.map((event) => (
              <EventRow key={event.id} event={event} isPast />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventRow({ event, isPast }: { event: any; isPast?: boolean }) {
  const eventDate = new Date(event.eventDate);
  const rsvpCount = event._count.rsvps;
  const spotsLeft = event.maxCapacity ? event.maxCapacity - rsvpCount : null;

  const statusColors: Record<string, string> = {
    draft: "bg-neutral-100 text-neutral-600",
    published: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
  };

  return (
    <div
      className={`bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-sm transition-all ${
        isPast ? "opacity-75" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Date Badge */}
          <div className="w-16 h-16 rounded-xl bg-primary-50 flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-xs text-primary-600 font-semibold">
              {eventDate
                .toLocaleDateString("en-US", { month: "short" })
                .toUpperCase()}
            </span>
            <span className="text-2xl font-bold text-primary">
              {eventDate.getDate()}
            </span>
          </div>

          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-neutral-900 text-lg truncate">
                {event.titleEn}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[event.status]}`}
              >
                {event.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-neutral-500 mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatEventDate(event.eventDate, "en").full}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {rsvpCount} RSVPs
                {spotsLeft !== null && ` (${spotsLeft} spots left)`}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">
                {event.category.replace("_", " ")}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">
                {event.targetAudience}
              </span>
              {event.isPriority && (
                <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                  ⭐ Priority
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/admin/events/${event.id}/edit`}
            className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-primary transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <Link
            href={`/events/${event.slug}`}
            target="_blank"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary hover:bg-primary-50 transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
