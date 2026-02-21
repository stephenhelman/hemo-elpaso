"use client";

import { useState } from "react";
import { Calendar, MapPin, Users, QrCode } from "lucide-react";
import { formatEventDate } from "@/lib/event-utils";
import EventAccessQr from "./EventAccessQr";
import InviteSponsorButton from "./InviteSponsorButton";
import { EventRowActions } from "./EventRowActions";

interface Props {
  event: any;
  isPast?: boolean;
}

export default function EventRowWithQr({ event, isPast }: Props) {
  const [showAccessQr, setShowAccessQr] = useState(false);
  const [showSponsorInvite, setShowSponsorInvite] = useState(false);
  const eventDate = new Date(event.eventDate);
  const rsvpCount = event._count.rsvps;
  const spotsLeft = event.maxCapacity ? event.maxCapacity - rsvpCount : null;

  const statusColors: Record<string, string> = {
    draft: "bg-neutral-100 text-neutral-600",
    published: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-blue-100 text-blue-700",
  };

  const Tags = () => (
    <div className="flex flex-wrap gap-1.5">
      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">
        {event.category.replace(/_/g, " ")}
      </span>
      {event.targetAudience && (
        <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">
          {event.targetAudience}
        </span>
      )}
      {event.isPriority && (
        <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
          ⭐ Priority
        </span>
      )}
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-xl border border-neutral-200 hover:shadow-sm transition-all">
        <div className="p-4 md:p-5">
          {/* ── Mobile layout ── */}
          <div className="sm:hidden">
            {/* Header row: date badge + actions */}
            <div className="flex items-center justify-between mb-3">
              <div className={`w-14 h-14 rounded-xl bg-primary-50 flex flex-col items-center justify-center flex-shrink-0 ${isPast ? "opacity-60" : ""}`}>
                <span className="text-xs text-primary-600 font-semibold leading-none mb-0.5">
                  {eventDate
                    .toLocaleDateString("en-US", { month: "short" })
                    .toUpperCase()}
                </span>
                <span className="text-2xl font-bold text-primary leading-none">
                  {eventDate.getDate()}
                </span>
              </div>
              <EventRowActions
                event={event}
                setShowSponsorInvite={setShowSponsorInvite}
              />
            </div>

            {/* Content — dimmed for past events */}
            <div className={isPast ? "opacity-60" : ""}>
            {/* Title + status */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-neutral-900">{event.titleEn}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[event.status]}`}
              >
                {event.status}
              </span>
            </div>

            {/* Detail rows */}
            <div className="space-y-1.5 text-sm text-neutral-500 mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formatEventDate(event.eventDate, "en").full}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  {rsvpCount} RSVPs
                  {spotsLeft !== null && ` (${spotsLeft} spots left)`}
                </span>
              </div>
            </div>

            <Tags />
            </div>{/* end opacity wrapper */}
          </div>{/* end sm:hidden */}

          {/* ── Desktop layout ── */}
          <div className="hidden sm:flex items-start justify-between gap-4">
            <div className={`flex items-start gap-4 flex-1 min-w-0 ${isPast ? "opacity-60" : ""}`}>
              {/* Date Badge */}
              <div className="w-16 h-16 rounded-xl bg-primary-50 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-xs text-primary-600 font-semibold">
                  {eventDate
                    .toLocaleDateString("en-US", { month: "short" })
                    .toUpperCase()}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {eventDate.getDate()}
                </span>
              </div>

              {/* Event Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-neutral-900 text-lg">
                    {event.titleEn}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[event.status]}`}
                  >
                    {event.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-neutral-500 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatEventDate(event.eventDate, "en").full}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {rsvpCount} RSVPs
                    {spotsLeft !== null && ` (${spotsLeft} spots left)`}
                  </div>
                </div>
                <Tags />
              </div>
            </div>

            {/* Actions */}
            <EventRowActions
              event={event}
              setShowSponsorInvite={setShowSponsorInvite}
            />
          </div>
        </div>

        {/* Event Access QR Toggle */}
        {event.status === "published" && (
          <div className="border-t border-neutral-200">
            <button
              onClick={() => setShowAccessQr(!showAccessQr)}
              className="w-full px-5 py-3 text-sm text-primary hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              {showAccessQr
                ? "Hide Event Access QR"
                : "Show Event Access QR (for projection)"}
            </button>

            {showAccessQr && (
              <div className="p-6 bg-neutral-50 border-t border-neutral-200">
                <EventAccessQr eventId={event.id} eventTitle={event.titleEn} />
              </div>
            )}
          </div>
        )}
      </div>
      {showSponsorInvite && (
        <InviteSponsorButton
          eventId={event.id}
          isOpen={showSponsorInvite}
          onClose={() => setShowSponsorInvite(false)}
        />
      )}
    </>
  );
}
