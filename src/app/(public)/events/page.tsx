import { prisma } from "@/lib/db";
import { withRsvpPeople } from "@/lib/rsvp/capacity";

import { EventsPageContent } from "@/components/events/EventsPageContent";

export default async function EventsPage() {
  const allEvents = await prisma.event.findMany({
    where: {
      status: "published",
    },
    include: {
      _count: {
        select: { rsvps: { where: { cancelledAt: null } } },
      },
    },
    orderBy: {
      eventDate: "asc",
    },
  });

  return <EventsPageContent events={await withRsvpPeople(allEvents)} />;
}
