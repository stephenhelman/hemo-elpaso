import Link from "next/link";
import { MapPin, Users, Clock, ArrowRight } from "lucide-react";
import { Event, Lang } from "@/types";
import { formatEventDate, getStatusLabel } from "@/lib/event-utils";
import HoepCard from "@/components/ui/HoepCard";

interface EventCardProps {
  event: Event;
  lang: Lang;
}

const statusStyles: Record<string, string> = {
  published: "bg-primary-50 text-primary-700 border-primary-200",
  live: "bg-accent/10 text-accent-dark border-accent/20",
  completed: "bg-neutral-100 text-neutral-500 border-neutral-200",
  cancelled: "bg-neutral-100 text-neutral-400 border-neutral-200",
};

export default function EventCard({ event, lang }: EventCardProps) {
  const title = lang === "en" ? event.titleEn : event.titleEs;
  const date = formatEventDate(event.eventDate, lang);
  const status = getStatusLabel(event.status, lang);

  return (
    <HoepCard hover padding="none" className="flex flex-col overflow-hidden">
      {/* Date strip */}
      <div className="flex items-center gap-4 bg-neutral-50 border-b border-neutral-100 px-5 py-3">
        <div className="text-center flex-shrink-0">
          <p className="font-display font-bold text-primary text-2xl leading-none">
            {date.day}
          </p>
          <p className="text-neutral-500 text-xs uppercase tracking-wide">
            {date.month}
          </p>
        </div>
        <div className="w-px h-8 bg-neutral-200" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-neutral-500 truncate">{date.full}</p>
          <p className="text-xs font-medium text-neutral-700">{date.time}</p>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${
            statusStyles[event.status] ?? statusStyles.completed
          }`}
        >
          {status}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-display font-bold text-neutral-900 text-lg leading-snug mb-3">
          {title}
        </h3>

        <div className="space-y-2 mb-4">
          <EventMeta
            icon={<MapPin className="w-3.5 h-3.5" />}
            text={event.location.split(",")[0]}
          />
          {event.maxAttendees && (
            <EventMeta
              icon={<Users className="w-3.5 h-3.5" />}
              text={
                lang === "en"
                  ? `Up to ${event.maxAttendees} attendees`
                  : `Hasta ${event.maxAttendees} asistentes`
              }
            />
          )}
          {event.rsvpDeadline && event.status === "published" && (
            <EventMeta
              icon={<Clock className="w-3.5 h-3.5" />}
              text={
                lang === "en"
                  ? `RSVP by ${formatEventDate(event.rsvpDeadline, lang).short}`
                  : `Confirmar antes del ${formatEventDate(event.rsvpDeadline, lang).short}`
              }
            />
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto">
          <Link
            href={`/events/${event.slug}`}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-display font-semibold transition-colors group ${
              event.status === "published"
                ? "bg-primary text-white hover:bg-primary-600"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {event.status === "published"
              ? lang === "en"
                ? "RSVP Now"
                : "Confirmar Asistencia"
              : lang === "en"
                ? "View Photos"
                : "Ver Fotos"}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </HoepCard>
  );
}

function EventMeta({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-500">
      <span className="text-primary-400 flex-shrink-0">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}
