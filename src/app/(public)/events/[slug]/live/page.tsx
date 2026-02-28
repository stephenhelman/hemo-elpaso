import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { getLocaleCookie } from "@/lib/locale";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  BarChart3,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import LivePoll from "@/components/events/live/LivePoll";
import QandA from "@/components/events/live/QandA";
import Announcements from "@/components/events/live/Announcements";
import LiveItinerary from "@/components/events/live/LiveItinerary";
import PhotoGallery from "@/components/events/live/PhotoGallery";

interface Props {
  params: { slug: string };
  searchParams: { session?: string };
}

export default async function LiveEventPage({ params, searchParams }: Props) {
  const session = await getSession();
  const sponsorSessionToken = searchParams.session;
  const lang = await getLocaleCookie();

  // Must be logged in
  if (!session?.user && !sponsorSessionToken) {
    redirect(`/api/auth/login?returnTo=/events/${params.slug}/live`);
  }

  // Get event
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
  });

  if (!event) {
    notFound();
  }

  const title = lang === "en" ? event.titleEn : event.titleEs;

  // Check if live features are enabled
  if (!event.liveEnabled) {
    return <LiveNotEnabled eventSlug={params.slug} />;
  }
  let patient;
  let checkIn;
  let patientName;

  if (sponsorSessionToken) {
    // Sponsor access via magic link
    checkIn = await prisma.checkIn.findFirst({
      where: {
        eventId: event.id,
        sessionToken: sponsorSessionToken,
        attendeeRole: "sponsor",
      },
      include: {
        patient: {
          include: {
            contactProfile: true,
          },
        },
      },
    });

    if (!checkIn) {
      return (
        <NotCheckedIn eventTitle={event.titleEn} eventSlug={params.slug} />
      );
    }

    patient = checkIn.patient;
    patientName = patient.contactProfile
      ? `${patient.contactProfile.firstName} ${patient.contactProfile.lastName}`
      : "Sponsor";
  } else {
    // Regular patient access via Auth0
    patient = await prisma.patient.findUnique({
      where: { auth0Id: session!.user.sub },
      select: {
        id: true,
        contactProfile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!patient) {
      redirect("/register");
    }

    checkIn = await prisma.checkIn.findFirst({
      where: {
        eventId: event.id,
        patientId: patient.id,
      },
      select: {
        sessionToken: true,
        attendeeRole: true,
      },
    });

    if (!checkIn) {
      return (
        <NotCheckedIn eventTitle={event.titleEn} eventSlug={params.slug} />
      );
    }

    patientName = patient.contactProfile
      ? `${patient.contactProfile.firstName} ${patient.contactProfile.lastName}`
      : undefined;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/events/${params.slug}`}
            className="inline-flex items-center gap-2 text-primary-300 hover:text-primary-200 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Event
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 text-sm font-semibold">
              LIVE NOW
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
            {title}
          </h1>

          <div className="flex items-center gap-2 text-primary-300">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">
              {checkIn.attendeeRole === "sponsor"
                ? `Sponsor Access: ${patientName}`
                : `You're checked in as ${patientName}`}
            </span>
          </div>
        </div>
        <Announcements eventId={event.id} lang={lang} />
        <div className="mb-8">
          <LiveItinerary eventId={event.id} lang={lang} />
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-400" />
            </div>
            <h2 className="font-display font-bold text-white text-2xl">
              Live Polls
            </h2>
          </div>

          <LivePoll
            eventId={event.id}
            sessionToken={checkIn.sessionToken}
            lang={lang}
          />
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="font-display font-bold text-white text-2xl">
              Q&A with Sponsors
            </h2>
          </div>

          <QandA
            eventId={event.id}
            sessionToken={checkIn.sessionToken}
            patientId={patient.id}
            patientName={patientName}
            lang={lang}
            attendeeRole={checkIn.attendeeRole}
          />
        </div>
        <div className="mb-8">
          <PhotoGallery eventId={event.id} />
        </div>
        {/* Demo Message */}
        <div className="mt-8 bg-primary-900/50 border border-primary-500/30 rounded-2xl p-6 text-center">
          <Sparkles className="w-12 h-12 text-primary-400 mx-auto mb-3" />
          <h3 className="text-xl font-display font-bold text-white mb-2">
            Live Features Activated!
          </h3>
          <p className="text-primary-200 text-sm">
            This page demonstrates gated access. Only checked-in attendees can
            see this content. Live polls, sponsor questions, and photo galleries
            will be added next.
          </p>
        </div>
        ;
      </div>
    </div>
  );
}

function NotCheckedIn({
  eventTitle,
  eventSlug,
}: {
  eventTitle: string;
  eventSlug: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
          Check-In Required
        </h1>
        <p className="text-neutral-600 mb-6">
          You need to check in at the event entrance to access live features for{" "}
          <strong>{eventTitle}</strong>.
        </p>
        <div className="space-y-3">
          <p className="text-sm text-neutral-500">
            Please show your QR code to staff at the check-in desk.
          </p>
          <Link
            href={`/events/${eventSlug}`}
            className="block w-full px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
          >
            Back to Event Page
          </Link>
        </div>
      </div>
    </div>
  );
}

function LiveNotEnabled({ eventSlug }: { eventSlug: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-neutral-600" />
        </div>
        <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
          Live Features Not Active
        </h1>
        <p className="text-neutral-600 mb-6">
          Live event features are not currently enabled for this event.
        </p>
        <Link
          href={`/events/${eventSlug}`}
          className="block w-full px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
        >
          Back to Event Page
        </Link>
      </div>
    </div>
  );
}
