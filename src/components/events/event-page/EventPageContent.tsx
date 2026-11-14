"use client";

import { Lang } from "@/types";
import { SerializedEvent } from "@/lib/event-utils";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  FileImage,
  Sparkles,
  QrCode,
  BookOpen,
  Building2,
} from "lucide-react";
import Image from "next/image";
import FlyerPreview from "@/components/events/FlyerPreview";

import { eventSlugPageTranslation } from "@/translation/eventsPage";
import { formatEventDate } from "@/lib/event-utils";

import Link from "next/link";

interface Props {
  locale: Lang;
  event: SerializedEvent;
  rsvpCount: number;
}

export function EventPageContent({
  locale,
  event,
  rsvpCount,
}: Props) {
  const t = eventSlugPageTranslation[locale];
  const isUpcoming = event.status === "published";
  const isPast = event.status === "completed";
  const deadlinePassed =
    !!event.rsvpDeadline && new Date(event.rsvpDeadline) < new Date();
  const title = locale === "en" ? event.titleEn : event.titleEs;
  const description =
    locale === "en" ? event.descriptionEn : event.descriptionEs;
  const date = formatEventDate(event.eventDate, locale);

  return (
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
                {description}
              </p>
            </div>
          </div>

          {/* Past Event Notice */}
          {isPast && (
            <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-4">
              <p className="text-neutral-600 text-sm">{t.pastEventNotice}</p>
            </div>
          )}

          {/* Recap or Photo Gallery Placeholder */}
          {isPast && event.recapPublishedAt ? (
            <div className="bg-white rounded-2xl border border-primary-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-neutral-900 text-xl">
                    {locale === "es" ? "Resumen del Evento" : "Event Recap"}
                  </h2>
                  <p className="text-sm text-neutral-500">
                    {locale === "es"
                      ? "Lee el resumen completo con fotos."
                      : "Read the full recap with photos."}
                  </p>
                </div>
              </div>
              <Link
                href={`/events/${event.slug}/recap`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-600 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                {locale === "es" ? "Leer Resumen" : "Read Recap"}
              </Link>
            </div>
          ) : isPast ? (
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
          ) : null}

          {!isPast && (
            <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-4 text-center">
              <p className="text-neutral-500 text-sm">{t.photosWillBePosted}</p>
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
                    ? `${rsvpCount}/${event.maxCapacity} ${t.spots}`
                    : t.unlimited
                }
              />
              {event.rsvpDeadline && (
                <InfoRow
                  icon={<Clock className="w-4 h-4" />}
                  label={t.rsvpDeadline}
                  value={formatEventDate(event.rsvpDeadline, locale).full}
                />
              )}
            </div>
          </div>

          <FlyerPreview
            flyerEnUrl={event.flyerEnUrl}
            flyerEsUrl={event.flyerEsUrl}
            lang={locale}
          />

          {/* RSVP placeholder — replaced by the tokenized RSVP flow in Phase 4 */}
          {isUpcoming && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              {deadlinePassed ? (
                <div className="px-4 py-2 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200 text-sm font-semibold text-center">
                  {locale === "es"
                    ? "Registro cerrado"
                    : "Registration closed"}
                </div>
              ) : (
                <>
                  <p className="font-display font-bold text-neutral-900 mb-1">
                    {locale === "es"
                      ? "RSVP próximamente"
                      : "RSVP coming soon"}
                  </p>
                  <p className="text-neutral-600 text-sm mb-4">
                    {locale === "es"
                      ? "Para reservar tu lugar, contáctanos."
                      : "To reserve your spot, call or contact us."}
                  </p>
                  <Link
                    href="/contact"
                    className="block w-full text-center px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
                  >
                    {locale === "es" ? "Contáctanos" : "Contact Us"}
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Share Button */}
          {/* <button className="w-full px-4 py-2 rounded-full border-2 border-neutral-300 text-neutral-700 font-semibold hover:border-primary hover:text-primary transition-colors">
              {t.share}
            </button> */}
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
        <p className="text-sm text-neutral-900 font-medium capitalize">
          {value}
        </p>
      </div>
    </div>
  );
}
