"use client";

import { Calendar } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import Section from "@/components/layout/Section";
import { upcomingEvents, pastEvents } from "@/lib/placeholder-events";
import { Lang } from "@/types";
import { useLang } from "@/context/LanguageContext";

export default function EventsPage() {
  const { lang } = useLang();

  return (
    <>
      <EventsHero lang={lang} />
      <UpcomingEventsSection lang={lang} />
      <PastEventsSection lang={lang} />
    </>
  );
}

function EventsHero({ lang }: { lang: Lang }) {
  const t = {
    en: {
      eyebrow: "Community Gatherings",
      heading: "Events & Programs",
      sub: "From educational dinners to family celebrations — our events bring the El Paso bleeding disorders community together.",
    },
    es: {
      eyebrow: "Reuniones Comunitarias",
      heading: "Eventos y Programas",
      sub: "Desde cenas educativas hasta celebraciones familiares — nuestros eventos unen a la comunidad de trastornos hemorrágicos de El Paso.",
    },
  }[lang];

  return (
    <div className="relative bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 py-24">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary-500/10 -translate-y-1/2 translate-x-1/3" />
      <div className="container-max px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-0.5 bg-primary-400" />
            <span className="text-primary-400 text-sm font-semibold tracking-widest uppercase">
              {t.eyebrow}
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-[1.2] mb-6">
            {t.heading}
          </h1>
          <p className="text-lg text-neutral-300 leading-relaxed">{t.sub}</p>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-neutral-50 to-transparent" />
    </div>
  );
}

function UpcomingEventsSection({ lang }: { lang: Lang }) {
  const t = {
    en: {
      heading: "Upcoming Events",
      sub: "Reserve your spot at our next community gathering",
      empty: "No upcoming events scheduled. Check back soon!",
    },
    es: {
      heading: "Próximos Eventos",
      sub: "Reserve su lugar en nuestra próxima reunión comunitaria",
      empty: "No hay eventos próximos programados. ¡Vuelva pronto!",
    },
  }[lang];

  return (
    <Section background="neutral">
      <SectionHeader heading={t.heading} sub={t.sub} />
      {upcomingEvents.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} lang={lang} />
          ))}
        </div>
      )}
    </Section>
  );
}

function PastEventsSection({ lang }: { lang: Lang }) {
  const t = {
    en: {
      heading: "Past Events",
      sub: "A look back at our community gatherings",
    },
    es: {
      heading: "Eventos Pasados",
      sub: "Un vistazo a nuestras reuniones comunitarias",
    },
  }[lang];

  return (
    <Section background="white">
      <SectionHeader heading={t.heading} sub={t.sub} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pastEvents.map((event) => (
          <EventCard key={event.id} event={event} lang={lang} />
        ))}
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
      <p className="text-neutral-400">{message}</p>
    </div>
  );
}
