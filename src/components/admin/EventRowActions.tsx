"use client";

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
} from "lucide-react";
import Link from "next/link";

interface Props {
  event: any;
  setShowSponsorInvite: React.Dispatch<React.SetStateAction<boolean>>;
}

export function EventRowActions({ event, setShowSponsorInvite }: Props) {
  return (
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
        href={`/admin/events/${event.id}/stats`}
        className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-orange-600 transition-colors"
        title="View Reports"
      >
        <PieChart className="w-4 h-4" />
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
  );
}
