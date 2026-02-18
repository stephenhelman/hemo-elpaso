import { notFound } from "next/navigation";
import { formatEventDate, getStatusLabel } from "@/lib/event-utils";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  FileImage,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Lang } from "@/types";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import RsvpButton from "@/components/events/RsvpButton";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const events = await prisma.event.findMany({
    select: { slug: true },
  });
  return events.map((event) => ({ slug: event.slug }));
}

export default async function EventPage({ params }: Props) {
  const lang: Lang = "en";

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

  const session = await getSession();
  let hasRsvp = false;
  let rsvpId: string | undefined;
  let isCheckedIn = false;
  const currentRsvpCount = event._count.rsvps;

  // If user is logged in, check if they have RSVP'd and if they're checked in
  if (session?.user) {
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
    }
  }

  const title = lang === "en" ? event.titleEn : event.titleEs;
  const desc = lang === "en" ? event.descriptionEn : event.descriptionEs;
  const date = formatEventDate(event.eventDate, lang);
  const status = getStatusLabel(event.status, lang);

  const t = {
    en: {
      backToEvents: "Back to Events",
      eventDetails: "Event Details",
      quickInfo: "Quick Info",
      dateTime: "Date & Time",
      location: "Location",
      capacity: "Capacity",
      rsvpDeadline: "RSVP Deadline",
      description: "Description",
      eventFlyer: "Event Flyer",
      flyerPlaceholder: "Event flyer will be available soon",
      downloadFlyer: "Download Flyer",
      photoGallery: "Photo Gallery",
      photosWillBePosted: "Photos will be posted after the event",
      pastEventNotice: "This event has already taken place.",
      viewPhotos: "View Photos",
      rsvp: "RSVP",
      share: "Share",
      spots: "spots",
      unlimited: "Unlimited",
    },
    es: {
      backToEvents: "Volver a Eventos",
      eventDetails: "Detalles del Evento",
      quickInfo: "Información Rápida",
      dateTime: "Fecha y Hora",
      location: "Ubicación",
      capacity: "Capacidad",
      rsvpDeadline: "Fecha Límite de RSVP",
      description: "Descripción",
      eventFlyer: "Volante del Evento",
      flyerPlaceholder: "El volante del evento estará disponible pronto",
      downloadFlyer: "Descargar Volante",
      photoGallery: "Galería de Fotos",
      photosWillBePosted: "Las fotos se publicarán después del evento",
      pastEventNotice: "Este evento ya ha tenido lugar.",
      viewPhotos: "Ver Fotos",
      rsvp: "RSVP",
      share: "Compartir",
      spots: "lugares",
      unlimited: "Ilimitado",
    },
  }[lang];

  const isUpcoming = event.status === "published";
  const isPast = event.status === "completed";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 py-12">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-primary-300 hover:text-primary-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToEvents}
          </Link>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold border border-primary-400/30">
                  {status}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                {title}
              </h1>

              {/* Quick Meta */}
              <div className="flex flex-wrap gap-4 text-neutral-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-400" />
                  <span className="text-sm">{date.full}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-400" />
                  <span className="text-sm">{date.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-400" />
                  <span className="text-sm">{event.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-max px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Details Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">
                {t.eventDetails}
              </h2>
              <div className="prose prose-neutral max-w-none">
                <p className="text-neutral-600 leading-relaxed whitespace-pre-line">
                  {desc}
                </p>
              </div>
            </div>

            {/* Past Event Notice */}
            {isPast && (
              <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-4">
                <p className="text-neutral-600 text-sm">{t.pastEventNotice}</p>
              </div>
            )}

            {/* Photo Gallery Placeholder */}
            {isPast && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">
                  {t.photoGallery}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center"
                    >
                      <FileImage className="w-8 h-8 text-neutral-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isPast && (
              <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-4 text-center">
                <p className="text-neutral-500 text-sm">
                  {t.photosWillBePosted}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info Card */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h3 className="font-display font-bold text-neutral-900 mb-4">
                {t.quickInfo}
              </h3>
              <div className="space-y-4">
                <InfoRow
                  icon={<Calendar className="w-4 h-4" />}
                  label={t.dateTime}
                  value={`${date.full} at ${date.time}`}
                />
                <InfoRow
                  icon={<MapPin className="w-4 h-4" />}
                  label={t.location}
                  value={event.location}
                />
                <InfoRow
                  icon={<Users className="w-4 h-4" />}
                  label={t.capacity}
                  value={
                    event.maxCapacity
                      ? `${currentRsvpCount}/${event.maxCapacity} ${t.spots}`
                      : t.unlimited
                  }
                />
                {event.rsvpDeadline && (
                  <InfoRow
                    icon={<Clock className="w-4 h-4" />}
                    label={t.rsvpDeadline}
                    value={formatEventDate(event.rsvpDeadline, lang).full}
                  />
                )}
              </div>
            </div>

            {/* Event Flyer Placeholder */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h3 className="font-display font-bold text-neutral-900 mb-4">
                {t.eventFlyer}
              </h3>
              <div className="aspect-[8.5/11] rounded-xl bg-neutral-100 border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center p-6 text-center">
                <FileImage className="w-12 h-12 text-neutral-400 mb-3" />
                <p className="text-sm text-neutral-500">{t.flyerPlaceholder}</p>
              </div>
            </div>

            {/* Join Live Event Button - Only if checked in and live enabled */}
            {isCheckedIn && event.liveEnabled && (
              <div className="bg-white rounded-2xl border-2 border-green-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-700 text-sm font-semibold">
                    You're Checked In!
                  </span>
                </div>
                <Link
                  href={`/events/${event.slug}/live`}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-lg transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Join Live Event
                </Link>
                <p className="text-xs text-neutral-500 text-center mt-2">
                  Access live polls, Q&A, and event updates
                </p>
              </div>
            )}

            {/* RSVP Button */}
            {isUpcoming && session?.user && !isCheckedIn && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <RsvpButton
                  eventId={event.id}
                  eventTitle={title}
                  hasRsvp={hasRsvp}
                  rsvpId={rsvpId}
                  maxCapacity={event.maxCapacity || undefined}
                  currentRsvps={currentRsvpCount}
                />
              </div>
            )}

            {/* Not logged in prompt */}
            {isUpcoming && !session?.user && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <p className="text-neutral-600 text-sm mb-4">
                  Sign in to RSVP for this event
                </p>
                <Link
                  href="/api/auth/login"
                  className="block w-full text-center px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Share Button */}
            <button className="w-full px-4 py-2 rounded-full border-2 border-neutral-300 text-neutral-700 font-semibold hover:border-primary hover:text-primary transition-colors">
              {t.share}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-500 font-medium">{label}</p>
        <p className="text-sm text-neutral-900 font-medium">{value}</p>
      </div>
    </div>
  );
}
