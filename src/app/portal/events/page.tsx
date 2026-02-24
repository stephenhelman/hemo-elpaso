import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import PortalEventsDisplay from "@/components/portal/PortalEventsDisplay";
import { Calendar } from "lucide-react";
import { Lang } from "@/types";
import { portalEventsPageTranslation } from "@/translation/portalPages";

export default async function PortalEventsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    include: {
      profile: true,
    },
  });

  if (!patient) {
    redirect("/portal/register");
  }

  const locale = ((await cookies()).get("locale")?.value as Lang) || "en";
  const t = portalEventsPageTranslation[locale];

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
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
          {t.heading}
        </h1>
        <p className="text-neutral-500">{t.subtitle}</p>
      </div>

      {myRsvps.length === 0 &&
      recommendedEvents.length === 0 &&
      allEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-display font-bold text-neutral-900 mb-2">
            {t.noEvents}
          </h3>
          <p className="text-neutral-500">{t.noEventsDesc}</p>
        </div>
      ) : (
        <PortalEventsDisplay
          myRsvps={myRsvps}
          recommendedEvents={recommendedEvents}
          allEvents={allEvents}
          locale={locale}
        />
      )}
    </div>
  );
}
