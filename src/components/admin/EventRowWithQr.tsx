"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  Pencil,
  QrCode,
  ScanLine,
  BarChart3,
  MessageSquare,
  Send,
  Megaphone,
  Clock,
  Images,
} from "lucide-react";
import { formatEventDate } from "@/lib/event-utils";
import EventAccessQr from "./EventAccessQr";
import InviteSponsorButton from "./InviteSponsorButton";

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

  return (
    <>
      <div
        className={`bg-white rounded-xl border border-neutral-200 hover:shadow-sm transition-all ${
          isPast ? "opacity-75" : ""
        }`}
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
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
                  <h3 className="font-semibold text-neutral-900 text-lg truncate">
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
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">
                    {event.category.replace("_", " ")}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">
                    {event.targetAudience}
                  </span>
                  {event.isPriority && (
                    <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                      ⭐ Priority
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowSponsorInvite(true)}
                className="p-1.5 rounded text-neutral-600 hover:bg-neutral-100 hover:text-yellow-600 transition-colors"
                title="Invite Sponsor"
              >
                <Send className="w-4 h-4" />
              </button>
              <Link
                href={`/admin/events/${event.id}/itinerary`}
                className="p-1.5 rounded text-neutral-600 hover:bg-neutral-100 hover:text-purple-600 transition-colors"
              >
                <Clock className="w-4 h-4" />
              </Link>

              <Link
                href={`/admin/events/${event.id}/announcements`}
                className="p-1.5 rounded text-neutral-600 hover:bg-neutral-100 hover:text-green-600 transition-colors"
              >
                <Megaphone className="w-4 h-4" />
              </Link>
              <Link
                href={`/admin/events/${event.id}/polls`}
                className="p-1.5 rounded text-neutral-600 hover:bg-neutral-100 hover:text-cyan-600 transition-colors"
                title="Manage Polls"
              >
                <BarChart3 className="w-4 h-4" />
              </Link>
              <Link
                href={`/admin/events/${event.id}/questions`}
                className="p-1.5 rounded text-neutral-600 hover:bg-neutral-100 hover:text-blue-600 transition-colors"
                title="Q&A Dashboard"
              >
                <MessageSquare className="w-4 h-4" />
              </Link>
              <Link
                href={`/admin/events/${event.id}/photos`}
                className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-emerald-600 transition-colors"
              >
                <Images className="w-4 h-4" />
              </Link>
              <Link
                href={`/admin/events/${event.id}/attendees`}
                className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-sky-600 transition-colors"
                title="View Attendees"
              >
                <Users className="w-4 h-4" />
              </Link>
              <Link
                href={`/admin/checkin?event=${event.id}`}
                className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-pink-600 transition-colors"
                title="Check-In"
              >
                <ScanLine className="w-4 h-4" />
              </Link>
              <Link
                href={`/admin/events/${event.id}/edit`}
                className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-primary transition-colors"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </Link>
              <Link
                href={`/events/${event.slug}`}
                target="_blank"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-primary hover:bg-primary-50 transition-colors"
              >
                View
              </Link>
            </div>
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
