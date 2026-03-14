"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PhotosManager from "@/components/admin/photos/PhotosManager";
import NewsletterModeToggle from "@/components/admin/newsletter/NewsletterModeToggle";

interface Photo {
  id: string;
  url: string;
  key: string;
  caption: string | null;
  approved: boolean;
  selectedForNewsletter: boolean;
  uploadedBy: string;
  uploadedAt: Date;
}

interface Props {
  event: { id: string; titleEn: string };
  photos: Photo[];
  adminEmail: string;
  cameFromEvents: boolean;
}

export default function EventPhotosClient({
  event,
  photos,
  adminEmail,
  cameFromEvents,
}: Props) {
  const [newsletterMode, setNewsletterMode] = useState(false);

  const selectedCount = photos.filter((p) => p.selectedForNewsletter).length;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href={
            cameFromEvents ? "/admin/events" : `/admin/events/${event.id}/edit`
          }
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {cameFromEvents ? "Back to Events" : "Back to Event"}
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              Event Photos
            </h1>
            <p className="text-neutral-500 mb-2">{event.titleEn}</p>
            <p className="text-sm text-neutral-400">
              Upload and manage photos for this event
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NewsletterModeToggle
              newsletterMode={newsletterMode}
              onToggle={() => setNewsletterMode((v) => !v)}
              selectedCount={selectedCount}
            />
            {photos.length > 0 && (
              <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-semibold">
                {photos.length} photo{photos.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        <PhotosManager
          eventId={event.id}
          photos={photos}
          adminEmail={adminEmail}
          newsletterMode={newsletterMode}
        />
      </div>
    </div>
  );
}
