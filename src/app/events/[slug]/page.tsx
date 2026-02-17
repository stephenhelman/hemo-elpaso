import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  Share2,
  CheckCircle,
  FileImage,
  Download,
} from "lucide-react";
import Section from "@/components/layout/Section";
import HoepCard from "@/components/ui/HoepCard";
import { getEventBySlug, placeholderEvents } from "@/lib/placeholder-events";
import { formatEventDate, getStatusLabel } from "@/lib/event-utils";
import { Lang } from "@/types";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return placeholderEvents.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props) {
  const event = getEventBySlug(params.slug);
  if (!event) return {};
  return {
    title: event.titleEn,
    description: event.descriptionEn,
  };
}

export default function EventPage({ params }: Props) {
  const event = getEventBySlug(params.slug);
  if (!event) notFound();

  const lang = "en" as Lang;
  const title = lang === "en" ? event.titleEn : event.titleEs;
  const desc = lang === "en" ? event.descriptionEn : event.descriptionEs;
  const date = formatEventDate(event.eventDate, lang);
  const status = getStatusLabel(event.status, lang);

  const t = {
    en: {
      back: "All Events",
      details: "Event Details",
      date: "Date & Time",
      location: "Location",
      capacity: "Capacity",
      rsvpBy: "RSVP Deadline",
      rsvp: "Reserve Your Spot",
      rsvpSub: "Free to attend. Space is limited.",
      name: "Full Name",
      email: "Email Address",
      adults: "Number of Adults",
      children: "Number of Children",
      submit: "Confirm RSVP",
      photos: "Event Photos",
      noPhotos: "Photos will be posted after the event.",
      share: "Share Event",
      spots: `${event.maxAttendees} spots available`,
      past: "This event has already taken place.",
      viewPhotos: "View Photos Below",
    },
    es: {
      back: "Todos los Eventos",
      details: "Detalles del Evento",
      date: "Fecha y Hora",
      location: "Ubicación",
      capacity: "Capacidad",
      rsvpBy: "Fecha Límite de Confirmación",
      rsvp: "Reserve Su Lugar",
      rsvpSub: "Entrada gratuita. El espacio es limitado.",
      name: "Nombre Completo",
      email: "Correo Electrónico",
      adults: "Número de Adultos",
      children: "Número de Niños",
      submit: "Confirmar Asistencia",
      photos: "Fotos del Evento",
      noPhotos: "Las fotos se publicarán después del evento.",
      share: "Compartir Evento",
      spots: `${event.maxAttendees} lugares disponibles`,
      past: "Este evento ya tuvo lugar.",
      viewPhotos: "Ver Fotos Abajo",
    },
  }[lang];

  const isUpcoming = event.status === "published";
  const isPast = event.status === "completed";

  return (
    <>
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 py-20">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary-500/10 -translate-y-1/2 translate-x-1/3" />
        <div className="container-max px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Back link */}
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {t.back}
          </Link>

          {/* Status badge */}
          <div className="mb-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                isUpcoming
                  ? "bg-primary-500/20 text-primary-300 border border-primary-500/30"
                  : "bg-neutral-500/20 text-neutral-300 border border-neutral-500/30"
              }`}
            >
              {status}
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-[1.2] mb-6 max-w-3xl">
            {title}
          </h1>

          {/* Quick meta */}
          <div className="flex flex-wrap gap-4">
            <QuickMeta
              icon={<Calendar className="w-4 h-4" />}
              text={date.full}
            />
            <QuickMeta icon={<Clock className="w-4 h-4" />} text={date.time} />
            <QuickMeta
              icon={<MapPin className="w-4 h-4" />}
              text={event.location.split(",")[0]}
            />
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-neutral-50 to-transparent" />
      </div>

      {/* Content */}
      <Section background="neutral">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <HoepCard>
              <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">
                {t.details}
              </h2>
              <p className="text-neutral-600 leading-relaxed">{desc}</p>
            </HoepCard>

            {/* Past event notice */}
            {isPast && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-100 border border-neutral-200">
                <CheckCircle className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-neutral-600">{t.past}</p>
                  <p className="text-sm text-neutral-400">{t.viewPhotos}</p>
                </div>
              </div>
            )}

            {/* Photo Gallery placeholder */}
            <HoepCard>
              <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">
                {t.photos}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {isPast ? (
                  // Placeholder photo grid
                  Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center"
                    >
                      <span className="text-neutral-300 text-xs">
                        Photo {i + 1}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-neutral-400 text-sm">{t.noPhotos}</p>
                  </div>
                )}
              </div>
            </HoepCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Event details card */}
            <HoepCard>
              <h3 className="font-display font-bold text-neutral-900 mb-4">
                {t.details}
              </h3>
              <div className="space-y-4">
                <DetailRow
                  icon={<Calendar className="w-4 h-4" />}
                  label={t.date}
                  value={`${date.full} at ${date.time}`}
                />
                <DetailRow
                  icon={<MapPin className="w-4 h-4" />}
                  label={t.location}
                  value={event.location}
                />
                {event.maxAttendees && (
                  <DetailRow
                    icon={<Users className="w-4 h-4" />}
                    label={t.capacity}
                    value={t.spots}
                  />
                )}
                {event.rsvpDeadline && isUpcoming && (
                  <DetailRow
                    icon={<Clock className="w-4 h-4" />}
                    label={t.rsvpBy}
                    value={formatEventDate(event.rsvpDeadline, lang).full}
                  />
                )}
              </div>
            </HoepCard>
            {/* Flyer */}
            {isUpcoming && (
              <HoepCard padding="none" className="overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100">
                  <h3 className="font-display font-bold text-neutral-900 text-sm">
                    {lang === "en" ? "Event Flyer" : "Volante del Evento"}
                  </h3>
                </div>
                {/* Flyer image slot */}
                <div className="aspect-[8.5/11] bg-neutral-50 flex flex-col items-center justify-center gap-3 p-6">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
                    <FileImage className="w-6 h-6 text-neutral-300" />
                  </div>
                  <p className="text-xs text-neutral-400 text-center">
                    {lang === "en"
                      ? "Flyer coming soon"
                      : "Volante próximamente"}
                  </p>
                </div>
                {/* Download button */}
                <div className="px-5 py-4 border-t border-neutral-100">
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-neutral-200 text-neutral-400 text-sm font-medium cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {lang === "en" ? "Download Flyer" : "Descargar Volante"}
                  </button>
                </div>
              </HoepCard>
            )}

            {/* RSVP form */}
            {isUpcoming && (
              <HoepCard className="bg-primary-500 border-primary-600">
                <h3 className="font-display font-bold text-white mb-1">
                  {t.rsvp}
                </h3>
                <p className="text-primary-100 text-sm mb-5">{t.rsvpSub}</p>
                <RsvpForm lang={lang} t={t} />
              </HoepCard>
            )}

            {/* Share */}
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-neutral-200 text-neutral-600 text-sm font-medium hover:border-primary hover:text-primary transition-colors">
              <Share2 className="w-4 h-4" />
              {t.share}
            </button>
          </div>
        </div>
      </Section>
    </>
  );
}

function QuickMeta({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-neutral-300 text-sm">
      <span className="text-primary-400">{icon}</span>
      {text}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="text-primary-500 flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm text-neutral-700 leading-snug">{value}</p>
      </div>
    </div>
  );
}

function RsvpForm({ lang, t }: { lang: Lang; t: Record<string, string> }) {
  return (
    <form className="space-y-3">
      <input
        type="text"
        placeholder={t.name}
        className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-primary-200 text-sm focus:outline-none focus:border-white/40 transition-colors"
      />
      <input
        type="email"
        placeholder={t.email}
        className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-primary-200 text-sm focus:outline-none focus:border-white/40 transition-colors"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          placeholder={t.adults}
          min="1"
          defaultValue="1"
          className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-primary-200 text-sm focus:outline-none focus:border-white/40 transition-colors"
        />
        <input
          type="number"
          placeholder={t.children}
          min="0"
          defaultValue="0"
          className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-primary-200 text-sm focus:outline-none focus:border-white/40 transition-colors"
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-3 rounded-lg bg-white text-primary font-display font-bold text-sm hover:bg-primary-50 transition-colors"
      >
        {t.submit}
      </button>
    </form>
  );
}
