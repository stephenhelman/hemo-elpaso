import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import PublicEventsDisplay from "@/components/events/PublicEventsDisplay";
import { Calendar } from "lucide-react";

export default async function EventsPage() {
  const now = new Date();
  const cookieStore = cookies();
  const lang = (cookieStore.get("language")?.value as "en" | "es") || "en";

  // Get all published events
  const allEvents = await prisma.event.findMany({
    where: {
      status: "published",
    },
    include: {
      _count: {
        select: { rsvps: true },
      },
    },
    orderBy: {
      eventDate: "asc",
    },
  });

  const upcomingEvents = allEvents.filter((e) => new Date(e.eventDate) >= now);
  const pastEvents = allEvents.filter((e) => new Date(e.eventDate) < now);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 py-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-white mb-4">
              Events & Programs
            </h1>
            <p className="text-xl text-neutral-300">
              Join us for educational programs, family activities, and community
              support events
            </p>
          </div>
        </div>
      </div>

      {/* Events Display */}
      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center max-w-2xl mx-auto">
            <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-neutral-900 mb-2">
              No Events Scheduled
            </h3>
            <p className="text-neutral-500">
              Check back soon for upcoming events and programs!
            </p>
          </div>
        ) : (
          <PublicEventsDisplay
            upcomingEvents={upcomingEvents}
            pastEvents={pastEvents}
            lang={lang}
          />
        )}
      </div>
    </div>
  );
}
