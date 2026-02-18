import { prisma } from "@/lib/db";
import Link from "next/link";
import { Calendar, Plus } from "lucide-react";
import EventRowWithQr from "@/components/admin/EventRowWithQr";

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
              <EventRowWithQr key={event.id} event={event} />
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
              <EventRowWithQr key={event.id} event={event} isPast />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
