import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import EventsDisplay from "@/components/admin/EventDisplay";

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

      <EventsDisplay events={events} />
    </div>
  );
}
