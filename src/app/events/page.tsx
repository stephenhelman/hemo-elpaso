import { prisma } from "@/lib/db";
import { EventsPageContent } from "@/components/events/EventsPageContent";

export default async function EventsPage() {
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

  return <EventsPageContent events={allEvents} />;
}
