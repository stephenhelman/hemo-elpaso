import { prisma } from "@/lib/db";
import { Metadata } from "next";
import { EventsPageContent } from "@/components/events/EventsPageContent";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Upcoming and past events hosted by Hemophilia Outreach of El Paso.",
};

export default async function EventsPage() {
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
