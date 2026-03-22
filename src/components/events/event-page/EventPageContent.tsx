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
} from "lucide-react";
import RsvpButton from "@/components/events/RsvpButton";
import FlyerPreview from "@/components/events/FlyerPreview";

import { eventSlugPageTranslation } from "@/translation/eventsPage";
import { formatEventDate } from "@/lib/event-utils";

import Link from "next/link";

interface Props {
  locale: Lang;
  isCheckedIn: boolean;
  hasRsvp: boolean;
  rsvpId: string | undefined;
  event: SerializedEvent;
  isLoggedIn: boolean;
  rsvpCount: number;
}

export function EventPageContent({
  locale,
  isCheckedIn,
  hasRsvp,
  rsvpId,
  event,
  isLoggedIn,
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

          {isUpcoming && hasRsvp && !isCheckedIn && (
            <div className="bg-white rounded-2xl border-2 border-primary/20 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-primary" />
                </div>
                <span className="text-primary font-semibold text-sm">
                  {locale === "es"
                    ? "¡Tienes una reservación!"
                    : "You're registered!"}
                </span>
              </div>
              <p className="text-neutral-600 text-sm mb-4">
                {locale === "es"
                  ? "Muestra tu código QR al llegar para registrarte rápidamente."
                  : "Show your QR code at the entrance for quick check-in."}
              </p>
              <Link
                href="/portal/dashboard"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                {locale === "es" ? "Ver mi código QR" : "View My QR Code"}
              </Link>
              <p className="text-xs text-neutral-400 text-center mt-2">
                {locale === "es"
                  ? "Disponible en tu portal de miembro"
                  : "Available in your member portal"}
              </p>
            </div>
          )}

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
          {isUpcoming && isLoggedIn && !isCheckedIn && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              {deadlinePassed && !hasRsvp ? (
                <div className="px-4 py-2 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200 text-sm font-semibold text-center">
                  {locale === "es"
                    ? "Registro cerrado"
                    : "Registration closed"}
                </div>
              ) : (
                <RsvpButton
                  eventId={event.id}
                  eventTitle={title}
                  hasRsvp={hasRsvp}
                  rsvpId={rsvpId}
                  maxCapacity={event.maxCapacity || undefined}
                  currentRsvps={rsvpCount}
                />
              )}
            </div>
          )}

          {/* Not logged in prompt */}
          {isUpcoming && !isLoggedIn && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <p className="text-neutral-600 text-sm mb-4">
                Sign in to RSVP for this event
              </p>
              <Link
                href={`/api/auth/login?returnTo=/events/${event.slug}`}
                className="block w-full text-center px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
              >
                Sign In
              </Link>
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
