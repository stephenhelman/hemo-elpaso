"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Calendar, MapPin, Users, ArrowRight, Check } from "lucide-react";
import type { Lang } from "@/types";
import type { Event } from "./PublicEventsDisplay";
import DateBadge from "@/components/ui/DateBadge";

// ─── Translations ────────────────────────────────────────────────────────────
const t = {
  en: {
    learnMore: "Learn More & RSVP",
    spotsLeft: "spots left",
    eventFull: "Event Full",
    noLimit: "Open Attendance",
    quickRsvp: "Quick RSVP",
    confirm: "Confirm",
    cancel: "Cancel",
    rsvped: "RSVP'd!",
    rsvpFailed: "Failed — try again",
    viewDetails: "View details",
    confirmPrompt: "RSVP for this event?",
  },
  es: {
    learnMore: "Más Información y RSVP",
    spotsLeft: "lugares restantes",
    eventFull: "Evento lleno",
    noLimit: "Asistencia abierta",
    quickRsvp: "RSVP Rápido",
    confirm: "Confirmar",
    cancel: "Cancelar",
    rsvped: "¡Registrado!",
    rsvpFailed: "Error — intente de nuevo",
    viewDetails: "Ver detalles",
    confirmPrompt: "¿RSVP para este evento?",
  },
};

// ─── Shared panel shell ───────────────────────────────────────────────────────
interface PanelProps {
  event: Event | null;
  lang: Lang;
  onClose: () => void;
  children: (event: Event) => React.ReactNode;
}

function SlidePanel({ event, lang: _lang, onClose, children }: PanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (event) {
      // Tiny delay so the enter transition fires
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [event]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!event) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${visible ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-neutral-900"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {children(event)}
        </div>
      </div>
    </>
  );
}

// ─── Public variant (no RSVP — just info + link) ─────────────────────────────
export function PublicEventSlidePanel({
  event,
  lang,
  onClose,
}: {
  event: Event | null;
  lang: Lang;
  onClose: () => void;
}) {
  const tr = t[lang];

  return (
    <SlidePanel event={event} lang={lang} onClose={onClose}>
      {(ev) => {
        const eventDate = new Date(ev.eventDate);
        const spotsLeft = ev.maxCapacity ? ev.maxCapacity - ev._count.rsvps : null;
        const title = lang === "es" ? ev.titleEs : ev.titleEn;
        const description = lang === "es" ? ev.descriptionEs : ev.descriptionEn;

        return (
          <div className="space-y-5">
            <DateBadge date={eventDate} variant="primary" size="md" />

            <h2 className="font-display font-bold text-neutral-900 text-xl leading-tight">
              {title}
            </h2>

            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  {eventDate.toLocaleDateString(lang === "es" ? "es-MX" : "en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{ev.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary flex-shrink-0" />
                <span>
                  {spotsLeft === null
                    ? tr.noLimit
                    : spotsLeft <= 0
                      ? tr.eventFull
                      : `${spotsLeft} ${tr.spotsLeft}`}
                </span>
              </div>
            </div>

            {description && (
              <p className="text-sm text-neutral-600 leading-relaxed line-clamp-6">
                {description}
              </p>
            )}

            <Link
              href={`/events/${ev.slug}`}
              className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
            >
              {tr.learnMore}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        );
      }}
    </SlidePanel>
  );
}

// ─── Portal variant (delegates RSVP to parent modal) ─────────────────────────
export function PortalEventSlidePanel({
  event,
  lang,
  onClose,
  alreadyRsvpd = false,
  onRsvpClick,
}: {
  event: Event | null;
  lang: Lang;
  onClose: () => void;
  alreadyRsvpd?: boolean;
  onRsvpClick?: () => void;
}) {
  const tr = t[lang];

  return (
    <SlidePanel event={event} lang={lang} onClose={onClose}>
      {(ev) => {
        const eventDate = new Date(ev.eventDate);
        const spotsLeft = ev.maxCapacity ? ev.maxCapacity - ev._count.rsvps : null;
        const isFull = spotsLeft !== null && spotsLeft <= 0;
        const title = lang === "es" ? ev.titleEs : ev.titleEn;
        const description = lang === "es" ? ev.descriptionEs : ev.descriptionEn;

        return (
          <div className="space-y-5">
            <DateBadge date={eventDate} variant="primary" size="md" />

            <h2 className="font-display font-bold text-neutral-900 text-xl leading-tight">
              {title}
            </h2>

            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>
                  {eventDate.toLocaleDateString(lang === "es" ? "es-MX" : "en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{ev.location}</span>
              </div>
              {!isFull && spotsLeft !== null && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{spotsLeft} {tr.spotsLeft}</span>
                </div>
              )}
            </div>

            {description && (
              <p className="text-sm text-neutral-600 leading-relaxed line-clamp-4">
                {description}
              </p>
            )}

            {/* RSVP action */}
            <div className="pt-2 space-y-2">
              {alreadyRsvpd ? (
                <span className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-50 text-green-700 font-semibold text-sm border border-green-200">
                  <Check className="w-4 h-4" />
                  {tr.rsvped}
                </span>
              ) : !isFull && onRsvpClick ? (
                <button
                  onClick={() => { onRsvpClick(); onClose(); }}
                  className="w-full px-4 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-600 transition-colors"
                >
                  {tr.quickRsvp}
                </button>
              ) : null}

              <Link
                href={`/events/${ev.slug}?from=portal`}
                className="flex items-center justify-center gap-1 w-full px-4 py-2.5 rounded-full border border-neutral-200 text-neutral-700 font-semibold text-sm hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
              >
                {tr.viewDetails}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        );
      }}
    </SlidePanel>
  );
}
