import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import { XCircle } from "lucide-react";
import Link from "next/link";
import LiveEventTabs from "@/components/events/live/LiveEventTabs";

interface Props {
  params: { slug: string };
  searchParams: { session?: string };
}

export default async function LiveEventPage({ params, searchParams }: Props) {
  const session = await getSession();
  const sponsorSessionToken = searchParams.session;
  const lang = (await getLocaleCookie()) as "en" | "es";

  if (!session?.user && !sponsorSessionToken) {
    redirect(`/api/auth/login?returnTo=/events/${params.slug}/live`);
  }

  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: {
      presentation: true,
      itineraryItems: { orderBy: { sequenceOrder: "asc" } },
      announcements: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
      },
      polls: {
        where: { active: true },
        include: { options: true, responses: true },
      },
      questions: {
        orderBy: [{ upvotes: "desc" }, { createdAt: "asc" }],
      },
      photos: {
        where: { approved: true },
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  if (!event) notFound();

  if (!event.liveEnabled) {
    return <LiveNotEnabled eventSlug={params.slug} lang={lang} />;
  }

  let patientId: string | null = null;
  let patientName: string | undefined;
  let sessionToken: string;
  let attendeeRole: string;

  if (sponsorSessionToken) {
    const checkIn = await prisma.checkIn.findFirst({
      where: {
        eventId: event.id,
        sessionToken: sponsorSessionToken,
        attendeeRole: "sponsor",
        sessionExpiresAt: { gt: new Date() },
      },
      include: { patient: { include: { contactProfile: true } } },
    });

    if (!checkIn) {
      return (
        <NotCheckedIn
          eventTitle={event.titleEn}
          eventSlug={params.slug}
          lang={lang}
        />
      );
    }

    patientId = checkIn.patient.id;
    patientName = checkIn.patient.contactProfile
      ? `${checkIn.patient.contactProfile.firstName} ${checkIn.patient.contactProfile.lastName}`
      : "Sponsor";
    sessionToken = checkIn.sessionToken;
    attendeeRole = "sponsor";
  } else {
    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session!.user.sub },
      include: { contactProfile: true },
    });

    if (!patient) redirect("/register");

    const checkIn = await prisma.checkIn.findFirst({
      where: {
        eventId: event.id,
        patientId: patient.id,
        sessionExpiresAt: { gt: new Date() },
      },
    });

    if (!checkIn) {
      return (
        <NotCheckedIn
          eventTitle={event.titleEn}
          eventSlug={params.slug}
          lang={lang}
        />
      );
    }

    patientId = patient.id;
    patientName = patient.contactProfile
      ? `${patient.contactProfile.firstName} ${patient.contactProfile.lastName}`
      : undefined;
    sessionToken = checkIn.sessionToken;
    attendeeRole = checkIn.attendeeRole;
  }

  return (
    <LiveEventTabs
      event={{
        id: event.id,
        slug: event.slug,
        titleEn: event.titleEn,
        titleEs: event.titleEs,
        presentation: event.presentation
          ? {
              currentSlide: event.presentation.currentSlide,
              totalSlides: event.presentation.totalSlides,
              slideUrls: event.presentation.slideUrls,
              isLive: event.presentation.isLive,
            }
          : null,
        itinerary: event.itineraryItems,
        announcements: event.announcements,
        activePolls: event.polls.map((p) => ({
          ...p,
          options: p.options,
          responses: p.responses,
        })),
        questions: event.questions,
        photos: event.photos,
      }}
      attendee={{
        patientId,
        patientName,
        sessionToken,
        attendeeRole,
      }}
      lang={lang}
    />
  );
}

function NotCheckedIn({
  eventTitle,
  eventSlug,
  lang,
}: {
  eventTitle: string;
  eventSlug: string;
  lang: "en" | "es";
}) {
  const isEs = lang === "es";
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
          {isEs ? "Registro requerido" : "Check-In Required"}
        </h1>
        <p className="text-neutral-600 mb-6">
          {isEs
            ? `Necesitas registrarte en la entrada para acceder a las funciones en vivo de ${eventTitle}.`
            : `You need to check in at the event entrance to access live features for ${eventTitle}.`}
        </p>
        <Link
          href={`/events/${eventSlug}`}
          className="block w-full px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
        >
          {isEs ? "Volver al Evento" : "Back to Event Page"}
        </Link>
      </div>
    </div>
  );
}

function LiveNotEnabled({
  eventSlug,
  lang,
}: {
  eventSlug: string;
  lang: "en" | "es";
}) {
  const isEs = lang === "es";
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-neutral-600" />
        </div>
        <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
          {isEs ? "Funciones en vivo no activas" : "Live Features Not Active"}
        </h1>
        <p className="text-neutral-600 mb-6">
          {isEs
            ? "Las funciones en vivo no están habilitadas para este evento."
            : "Live event features are not currently enabled for this event."}
        </p>
        <Link
          href={`/events/${eventSlug}`}
          className="block w-full px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
        >
          {isEs ? "Volver al Evento" : "Back to Event Page"}
        </Link>
      </div>
    </div>
  );
}
