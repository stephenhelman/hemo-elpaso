import { notFound, redirect } from "next/navigation";
import { getLocaleCookie } from "@/lib/locale";
import { ensurePatientExists } from "@/lib/ensure-patient";

import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { EventSlugPage } from "@/components/events/event-page/EventSlugPage";
import { SerializedEvent } from "@/lib/event-utils";
import EventSchema from "@/components/seo/EventSchema";

interface Props {
  params: { slug: string };
  searchParams: { from?: string };
}

export async function generateStaticParams() {
  const events = await prisma.event.findMany({
    select: { slug: true },
  });
  return events.map((event) => ({ slug: event.slug }));
}

export default async function EventPage({ params, searchParams }: Props) {
  const referrer = searchParams.from;
  const locale = (await getLocaleCookie()) as Lang;

  // Get event from database
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: {
      _count: {
        select: { rsvps: true },
      },
    },
  });

  if (!event) notFound();

  const currentRsvpCount = event._count.rsvps;

  const serializedEvent: SerializedEvent = {
    id: event.id,
    slug: event.slug,
    titleEn: event.titleEn,
    titleEs: event.titleEs,
    descriptionEn: event.descriptionEn,
    descriptionEs: event.descriptionEs,
    flyerEnUrl: event.flyerEnUrl,
    flyerEsUrl: event.flyerEsUrl,
    eventDate: event.eventDate.toISOString(),
    location: event.location,
    maxCapacity: event.maxCapacity,
    rsvpDeadline: event.rsvpDeadline?.toISOString() ?? null,
    status: event.status,
    category: event.category,
    targetAudience: event.targetAudience,
    language: event.language,
    isPriority: event.isPriority,
    liveEnabled: event.liveEnabled,
    createdBy: event.createdBy,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };

  const session = await getSession();

  let hasRsvp = false;
  let rsvpId: string | undefined;
  let isCheckedIn = false;
  let isLoggedIn = false;

  // If user is logged in, ensure a Patient row exists then check RSVP/check-in state
  if (session?.user) {
    const stub = await ensurePatientExists(
      session.user.sub,
      session.user.email,
    );

    // Gate: if registration is not complete, send them to finish it and come back
    if (!stub.registrationCompletedAt && !stub.contactProfile) {
      redirect(`/register?callbackUrl=/events/${params.slug}`);
    }

    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (patient) {
      const rsvp = await prisma.rsvp.findFirst({
        where: {
          patientId: patient.id,
          eventId: event.id,
        },
      });

      if (rsvp) {
        hasRsvp = true;
        rsvpId = rsvp.id;
      }

      // Check if patient is checked in
      const checkIn = await prisma.checkIn.findFirst({
        where: {
          patientId: patient.id,
          eventId: event.id,
        },
      });

      isCheckedIn = !!checkIn;
      isLoggedIn = true;
    }
  }

  return (
    <>
      <EventSchema event={event} locale={locale} />
      <EventSlugPage
        referrer={referrer}
        event={serializedEvent}
        hasRsvp={hasRsvp}
        isCheckedIn={isCheckedIn}
        rsvpId={rsvpId}
        isLoggedIn={isLoggedIn}
        rsvpCount={currentRsvpCount}
      />
    </>
  );
}
