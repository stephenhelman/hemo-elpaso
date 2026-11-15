import { prisma } from "@/lib/db";
import { withRsvpPeople } from "@/lib/rsvp/capacity";

import { getCoverUrls } from "@/lib/photos/public";
import { eventHasEnded } from "@/lib/rsvp/window";
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

  const withPeople = await withRsvpPeople(allEvents);
  // Past events show their cover photo (chosen cover, else the first approved photo) when they have one.
  const now = new Date();
  const covers = await getCoverUrls(withPeople.filter((e) => eventHasEnded(e, now)).map((e) => e.id));
  return <EventsPageContent events={withPeople.map((e) => ({ ...e, coverPhotoUrl: covers[e.id] ?? null }))} />;
}
