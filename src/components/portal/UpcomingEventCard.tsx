"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, QrCode } from "lucide-react";
import QrCodeDisplay from "./QrCodeDisplay";
import DateBadge from "@/components/ui/DateBadge";

interface Props {
  rsvp: {
    id: string;
    attendeeCount: number;
    event: {
      slug: string;
      titleEn: string;
      eventDate: Date | string;
    };
  };
}

export default function UpcomingEventCard({ rsvp }: Props) {
  const [showQr, setShowQr] = useState(false);
  const eventDate = new Date(rsvp.event.eventDate);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <Link
        href={`/events/${rsvp.event.slug}`}
        className="flex items-center justify-between p-4 hover:bg-primary-50/50 transition-all group"
      >
        <div className="flex items-center gap-4">
          <DateBadge date={eventDate} variant="primary" size="sm" />
          <div>
            <h3 className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">
              {rsvp.event.titleEn}
            </h3>
            <p className="text-sm text-neutral-500">
              {rsvp.attendeeCount} attendees
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-primary transition-colors" />
      </Link>

      {/* QR Code Toggle */}
      <div className="border-t border-neutral-200">
        <button
          onClick={() => setShowQr(!showQr)}
          className="w-full px-4 py-2 text-sm text-primary hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
        >
          <QrCode className="w-4 h-4" />
          {showQr ? "Hide QR Code" : "Show Check-in QR Code"}
        </button>

        {showQr && (
          <div className="p-4 bg-neutral-50 border-t border-neutral-200">
            <QrCodeDisplay rsvpId={rsvp.id} eventTitle={rsvp.event.titleEn} />
          </div>
        )}
      </div>
    </div>
  );
}
