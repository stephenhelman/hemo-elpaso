"use client";

import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import PhotosManager, { type AdminPhoto } from "@/components/admin/photos/PhotosManager";

interface Props {
  event: { id: string; titleEn: string; coverPhotoId: string | null };
  photos: AdminPhoto[];
  noPhotosFamilies: number;
  totalFamilies: number;
  cameFromEvents: boolean;
}

export default function EventPhotosClient({ event, photos, noPhotosFamilies, totalFamilies, cameFromEvents }: Props) {
  const approved = photos.filter((p) => p.approved).length;
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href={cameFromEvents ? "/admin/events" : `/admin/events/${event.id}/edit`}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {cameFromEvents ? "Back to Events" : "Back to Event"}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">Event Photos</h1>
            <p className="text-neutral-500 mb-1">{event.titleEn}</p>
            <p className="text-sm text-neutral-400">Upload, approve and arrange the photos shown on the public gallery.</p>
          </div>
          {photos.length > 0 && (
            <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-800 font-semibold text-sm">
              {approved} public · {photos.length - approved} pending
            </div>
          )}
        </div>

        {noPhotosFamilies > 0 && (
          <div role="note" className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
            <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">
                {noPhotosFamilies} of {totalFamilies} RSVP&apos;d {totalFamilies === 1 ? "family" : "families"} at this event {noPhotosFamilies === 1 ? "has" : "have"} not granted media consent.
              </p>
              <p className="mt-0.5">
                Check the faces in each photo before you approve it.{" "}
                <Link href={`/admin/checkin?event=${event.id}&tab=guests&noPhotos=1`} className="font-semibold underline underline-offset-2">
                  See who they are in the check-in list
                </Link>
              </p>
            </div>
          </div>
        )}

        <PhotosManager eventId={event.id} photos={photos} coverPhotoId={event.coverPhotoId} />
      </div>
    </div>
  );
}
