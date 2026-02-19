"use client";

import Link from "next/link";
import {
  BarChart3,
  MessageSquare,
  Megaphone,
  Clock,
  Images,
} from "lucide-react"; // ADD Images

interface Props {
  eventId: string;
}

export default function EventQuickActions({ eventId }: Props) {
  return (
    <div className="mb-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
      <p className="text-sm font-medium text-neutral-700 mb-3">
        Live Event Management
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/events/${eventId}/itinerary`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-purple-300 hover:text-purple-600 transition-colors"
        >
          <Clock className="w-4 h-4" />
          Event Schedule
        </Link>

        <Link
          href={`/admin/events/${eventId}/announcements`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-green-300 hover:text-green-600 transition-colors"
        >
          <Megaphone className="w-4 h-4" />
          Announcements
        </Link>

        <Link
          href={`/admin/events/${eventId}/polls`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-cyan-300 hover:text-cyan-600 transition-colors"
        >
          <BarChart3 className="w-4 h-4" />
          Polls
        </Link>

        <Link
          href={`/admin/events/${eventId}/questions`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Q&A
        </Link>

        <Link
          href={`/admin/events/${eventId}/photos`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-emerald-300 hover:text-emerald-600 transition-colors"
        >
          <Images className="w-4 h-4" />
          Photo Gallery
        </Link>
      </div>
    </div>
  );
}
