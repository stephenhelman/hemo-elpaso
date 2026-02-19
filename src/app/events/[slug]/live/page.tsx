import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  BarChart3,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import LivePoll from "@/components/events/live/LivePoll";

interface Props {
  params: { slug: string };
}

export default async function LiveEventPage({ params }: Props) {
  const session = await getSession();

  // Must be logged in
  if (!session?.user) {
    redirect(`/api/auth/login?returnTo=/events/${params.slug}/live`);
  }

  // Get event
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
  });

  if (!event) {
    notFound();
  }

  // Check if live features are enabled
  if (!event.liveEnabled) {
    return <LiveNotEnabled eventSlug={params.slug} />;
  }

  // Get patient
  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true, profile: true },
  });

  if (!patient) {
    redirect("/register");
  }

  // Check if patient is checked in to THIS event
  const checkIn = await prisma.checkIn.findFirst({
    where: {
      eventId: event.id,
      patientId: patient.id,
    },
  });

  if (!checkIn) {
    return <NotCheckedIn eventTitle={event.titleEn} eventSlug={params.slug} />;
  }

  // Patient is checked in! Show live event features
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
            {event.titleEn}
          </h1>

          <div className="flex items-center gap-2 text-primary-300">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">
              You're checked in as {patient.profile?.firstName}{" "}
              {patient.profile?.lastName}
            </span>
          </div>
        </div>
        {/* Live Polls Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-400" />
            </div>
            <h2 className="font-display font-bold text-white text-2xl">
              Live Polls
            </h2>
          </div>

          <LivePoll eventId={event.id} sessionToken={checkIn.sessionToken} />
        </div>
        {/* Other Features Coming Soon */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Placeholder: Sponsor Questions */}
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Sponsor Q&A"
            description="Submit questions for our sponsors and partners"
            status="Coming Soon"
          />

          {/* Placeholder: Photo Gallery */}
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Photo Gallery"
            description="View and share photos from tonight's event"
            status="Coming Soon"
          />

          {/* Placeholder: Event Feed */}
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Event Updates"
            description="Real-time announcements and schedule changes"
            status="Coming Soon"
          />
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

function FeatureCard({
  icon,
  title,
  description,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
          {icon}
        </div>
        <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold">
          {status}
        </span>
      </div>
      <h3 className="font-display font-bold text-white text-lg mb-2">
        {title}
      </h3>
      <p className="text-neutral-400 text-sm">{description}</p>
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
