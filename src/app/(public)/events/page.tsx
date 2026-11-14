import { prisma } from "@/lib/db";
import { withRsvpPeople } from "@/lib/rsvp/capacity";

import { publicEventSelect } from "@/lib/events/public-select";
import { EventsPageContent } from "@/components/events/EventsPageContent";

// Note: the public layout reads the locale cookie, so this route renders per request
// regardless; revalidate only takes effect if that ever changes.
export const revalidate = 60;

export default async function EventsPage() {
  const allEvents = await prisma.event.findMany({
    where: {
      status: "published",
    },
    select: publicEventSelect,
    orderBy: {
      eventDate: "asc",
    },
  });

  return <EventsPageContent events={await withRsvpPeople(allEvents)} />;
}
