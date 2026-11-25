import { notFound } from "next/navigation";
import { getLocaleCookie } from "@/lib/locale";

import { prisma } from "@/lib/db";
import { publicEventSelect } from "@/lib/events/public-select";
import { EventSlugPage } from "@/components/events/event-page/EventSlugPage";
import { SerializedEvent } from "@/lib/event-utils";
import EventSchema from "@/components/seo/EventSchema";
import type { Lang } from "@/types";
import { getSponsorsByIds } from "@/sanity/sponsors";
import SponsoredBy from "@/components/sanity/SponsoredBy";
import { registrationState, activeHeadcount } from "@/lib/rsvp";
import { isFeatureEnabled } from "@/lib/features";
import { eventRsvpView } from "@/lib/review/event-view";

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
    select: publicEventSelect,
  });

  // Drafts are not public.
  if (!event || event.status === "draft") notFound();

  const sponsors = await getSponsorsByIds(event.sponsorSanityIds ?? []);

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
    flyerEnAlt: event.flyerEnAlt,
    flyerEsAlt: event.flyerEsAlt,
    eventDate: event.eventDate.toISOString(),
    location: event.location,
    maxCapacity: event.maxCapacity,
    rsvpDeadline: event.rsvpDeadline?.toISOString() ?? null,
    status: event.status,
    category: event.category,
    language: event.language,
    isPriority: event.isPriority,
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
        rsvpView={await eventRsvpView(event.id)}
        eventId={event.id}
        turnstileSiteKey={process.env.TURNSTILE_SITE_KEY ?? null}
        // The recording line shows only on events marked recorded, and only while the "recordings" toggle is on.
        notices={{ recorded: event.isRecorded && (await isFeatureEnabled("recordings")), captions: await isFeatureEnabled("live_captions") }}
      />
      <SponsoredBy sponsors={sponsors} locale={locale} />
    </>
  );
}
