import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PortalEventsContent } from "@/components/portal/events/PortalEventsContent";
import { getLocaleCookie } from "@/lib/locale";
import { Lang } from "@/types";

export default async function PortalEventsPage() {
  const session = await getSession();
  const locale = (await getLocaleCookie()) as Lang;

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!patient) {
    redirect("/portal/register");
  }

  const now = new Date();

  // Get patient's RSVPs
  const myRsvps = await prisma.rsvp.findMany({
    where: {
      patientId: patient.id,
      event: {
        eventDate: { gte: now },
        status: "published",
      },
    },
    include: {
      event: {
        include: {
          _count: {
            select: { rsvps: true },
          },
        },
      },
    },
    orderBy: {
      event: {
        eventDate: "asc",
      },
    },
  });

  // Get recommended events (not already RSVP'd)
  const myRsvpEventIds = myRsvps.map((r) => r.eventId);

  const recommendedEvents = await prisma.event.findMany({
    where: {
      status: "published",
      eventDate: { gte: now },
      id: { notIn: myRsvpEventIds },
      // Add targeting logic here if needed
    },
    include: {
      _count: {
        select: { rsvps: true },
      },
    },
    orderBy: {
      eventDate: "asc",
    },
    take: 6,
  });

  // Get all published upcoming events
  const allEvents = await prisma.event.findMany({
    where: {
      status: "published",
      eventDate: { gte: now },
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

  return (
    <PortalEventsContent
      myRsvps={myRsvps}
      recommendedEvents={recommendedEvents}
      allEvents={allEvents}
      locale={locale}
    />
  );
}
