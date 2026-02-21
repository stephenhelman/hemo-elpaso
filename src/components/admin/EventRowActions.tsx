"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Clock,
  Megaphone,
  Pencil,
  ScanLine,
  BarChart3,
  MessageSquare,
  Images,
  PieChart,
  Users,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Props {
  event: any;
  setShowSponsorInvite: React.Dispatch<React.SetStateAction<boolean>>;
}

export function EventRowActions({ event, setShowSponsorInvite }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex items-center gap-1 flex-shrink-0" ref={ref}>
      {/* Primary actions — always visible */}
      <Link
        href={`/admin/events/${event.id}/edit`}
        className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-primary transition-colors"
        title="Edit Event"
      >
        <Pencil className="w-4 h-4" />
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
        title="Check-In Scanner"
      >
        <ScanLine className="w-4 h-4" />
      </Link>

      {/* More actions dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
          title="More actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-neutral-200 shadow-lg z-50 py-1">
            <button
              onClick={() => {
                setShowSponsorInvite(true);
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Send className="w-4 h-4 text-yellow-600" />
              Invite Sponsor
            </button>
            <Link
              href={`/admin/events/${event.id}/itinerary`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Clock className="w-4 h-4 text-purple-600" />
              Itinerary
            </Link>
            <Link
              href={`/admin/events/${event.id}/announcements`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Megaphone className="w-4 h-4 text-green-600" />
              Announcements
            </Link>
            <Link
              href={`/admin/events/${event.id}/polls`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-cyan-600" />
              Polls
            </Link>
            <Link
              href={`/admin/events/${event.id}/questions`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Q&A
            </Link>
            <Link
              href={`/admin/events/${event.id}/photos`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Images className="w-4 h-4 text-emerald-600" />
              Photos
            </Link>
            <Link
              href={`/admin/events/${event.id}/stats`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <PieChart className="w-4 h-4 text-orange-600" />
              Stats
            </Link>
            <div className="border-t border-neutral-100 mt-1 pt-1">
              <Link
                href={`/events/${event.slug}`}
                target="_blank"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-neutral-500" />
                View Public Page
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
