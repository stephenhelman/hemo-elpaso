import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import Section from "@/components/layout/Section";
import HoepCard from "@/components/ui/HoepCard";
import HoepBadge from "@/components/ui/HoepBadge";

interface UpcomingEventsProps {
  lang: "en" | "es";
}

const content = {
  en: {
    heading: "Upcoming Events",
    sub: "Join us at our next community gathering",
    viewAll: "View All Events",
    rsvp: "RSVP",
    noEvents: "No upcoming events. Check back soon!",
    upcoming: "Upcoming",
  },
  es: {
    heading: "Próximos Eventos",
    sub: "Únete a nuestra próxima reunión comunitaria",
    viewAll: "Ver Todos los Eventos",
    rsvp: "Confirmar Asistencia",
    noEvents: "No hay eventos próximos. ¡Vuelve pronto!",
    upcoming: "Próximo",
  },
};

// Placeholder events — will be replaced with real DB data
const placeholderEvents = [
  {
    id: "1",
    titleEn: "Spring Educational Dinner",
    titleEs: "Cena Educativa de Primavera",
    date: "March 15, 2025",
    location: "El Paso Community Center",
    slug: "spring-educational-dinner-2025",
  },
  {
    id: "2",
    titleEn: "Family Support Workshop",
    titleEs: "Taller de Apoyo Familiar",
    date: "April 5, 2025",
    location: "HOEP Office, El Paso",
    slug: "family-support-workshop-2025",
  },
  {
    id: "3",
    titleEn: "Annual Fundraiser Gala",
    titleEs: "Gala Anual de Recaudación",
    date: "May 20, 2025",
    location: "Hotel Paso del Norte",
    slug: "annual-fundraiser-gala-2025",
  },
];

export default function UpcomingEvents({ lang }: UpcomingEventsProps) {
  const t = content[lang];

  return (
    <Section background="neutral" id="events">
      <SectionHeader heading={t.heading} sub={t.sub} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {placeholderEvents.map((event) => (
          <EventPreviewCard
            key={event.id}
            event={event}
            lang={lang}
            rsvpLabel={t.rsvp}
            upcomingLabel={t.upcoming}
          />
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-primary text-primary font-display font-semibold hover:bg-primary hover:text-white transition-all duration-200 group"
        >
          {t.viewAll}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </Section>
  );
}

function SectionHeader({ heading, sub }: { heading: string; sub: string }) {
  return (
    <div className="text-center mb-12">
      <h2 className="font-display text-3xl font-bold text-neutral-900 mb-3">
        {heading}
      </h2>
      <p className="text-neutral-500 max-w-xl mx-auto">{sub}</p>
    </div>
  );
}

function EventPreviewCard({
  event,
  lang,
  rsvpLabel,
  upcomingLabel,
}: {
  event: (typeof placeholderEvents)[0];
  lang: "en" | "es";
  rsvpLabel: string;
  upcomingLabel: string;
}) {
  const title = lang === "en" ? event.titleEn : event.titleEs;

  return (
    <HoepCard hover className="flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <HoepBadge variant="primary">{upcomingLabel}</HoepBadge>
      </div>

      <h3 className="font-display font-semibold text-neutral-900 text-lg mb-4 leading-snug">
        {title}
      </h3>

      <div className="flex flex-col gap-2 mb-6 mt-auto">
        <EventMeta icon={<Calendar className="w-4 h-4" />} text={event.date} />
        <EventMeta
          icon={<MapPin className="w-4 h-4" />}
          text={event.location}
        />
      </div>

      <Link
        href={`/events/${event.slug}`}
        className="w-full text-center px-4 py-2.5 rounded-full bg-primary text-white text-sm font-semibold font-display hover:bg-primary-600 transition-colors"
      >
        {rsvpLabel}
      </Link>
    </HoepCard>
  );
}

function EventMeta({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-500">
      <span className="text-primary-400">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
