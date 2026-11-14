"use client";

import Link from "next/link";
import {
  Images,
  Mail,
  FileText,
} from "lucide-react";

interface Props {
  eventId: string;
}

export default function EventQuickActions({ eventId }: Props) {
  return (
    <>
      <div className="mb-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <p className="text-sm font-medium text-neutral-700 mb-3">
          Event Management
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/events/${eventId}/invitations`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-primary hover:text-primary transition-colors"
          >
            <Mail className="w-4 h-4" />
            Invitations
          </Link>

          <Link
            href={`/admin/events/${eventId}/photos`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-emerald-300 hover:text-emerald-600 transition-colors"
          >
            <Images className="w-4 h-4" />
            Photo Gallery
          </Link>

          <Link
            href={`/admin/events/${eventId}/recap`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-white hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Recap
          </Link>

        </div>
      </div>
    </>
  );
}
