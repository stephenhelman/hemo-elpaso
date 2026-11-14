import { notFound } from "next/navigation";
import { getLocaleCookie } from "@/lib/locale";

import { prisma } from "@/lib/db";
import { EventSlugPage } from "@/components/events/event-page/EventSlugPage";
import { SerializedEvent } from "@/lib/event-utils";
import EventSchema from "@/components/seo/EventSchema";
import type { Lang } from "@/types";
import { registrationState, activeHeadcount } from "@/lib/rsvp";

interface Props {
  params: { slug: string };
  searchParams: { from?: string };
}

// Rendered per request: the page reads the visitor's locale cookie and live RSVP counts, and events
// are created after deploy. (generateStaticParams made new slugs fail with DYNAMIC_SERVER_USAGE.)
export const dynamic = "force-dynamic";

export default async function EventPage({ params, searchParams }: Props) {
  const referrer = searchParams.from;
  const locale = (await getLocaleCookie()) as Lang;

  // Get event from database
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: {
      _count: { select: { rsvps: { where: { cancelledAt: null } } } },
    },
  });

  if (!event) notFound();

  // people (party sizes), same basis as the capacity check
  const currentRsvpCount = await activeHeadcount(event.id);

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
    recapPublishedAt: event.recapPublishedAt?.toISOString() ?? null,
  };

  return (
    <>
      <EventSchema
        event={{
          titleEn: event.titleEn,
          titleEs: event.titleEs,
          descriptionEn: event.descriptionEn ?? "",
          descriptionEs: event.descriptionEs ?? "",
          eventDate: event.eventDate,
          location: event.location,
          slug: event.slug,
        }}
        locale={locale}
      />
      <EventSlugPage
        referrer={referrer}
        event={serializedEvent}
        rsvpCount={currentRsvpCount}
        registration={await registrationState(event)}
        eventId={event.id}
        turnstileSiteKey={process.env.TURNSTILE_SITE_KEY ?? null}
      />
    </>
  );
}
