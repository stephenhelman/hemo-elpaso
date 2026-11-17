import "server-only";
import { prisma } from "@/lib/db";
import { eventHasEnded } from "@/lib/rsvp/window";

/**
 * Public gallery queries. EVERY query here filters `approved: true` and selects an explicit field list:
 * never the R2 key, the uploader's email, the session token or the approval state of other photos.
 */
const publicPhotoSelect = {
  id: true,
  url: true,
  thumbUrl: true,
  caption: true,
  captionEs: true,
  width: true,
  height: true,
} as const;

export type PublicPhoto = {
  id: string;
  url: string;
  thumbUrl: string | null;
  caption: string | null;
  captionEs: string | null;
  width: number | null;
  height: number | null;
};

const PUBLIC_STATUSES = ["published", "completed"];

/** Approved photos of one event, in the order set in the admin. */
export async function getApprovedPhotos(eventId: string): Promise<PublicPhoto[]> {
  return prisma.eventPhoto.findMany({
    where: { eventId, approved: true },
    orderBy: [{ sortOrder: "asc" }, { uploadedAt: "asc" }],
    select: publicPhotoSelect,
  });
}

/** eventId -> cover image URL, for events that have an approved photo. The chosen cover wins; otherwise the first approved photo. */
export async function getCoverUrls(eventIds: string[]): Promise<Record<string, string>> {
  if (eventIds.length === 0) return {};
  const [events, photos] = await Promise.all([
    prisma.event.findMany({ where: { id: { in: eventIds } }, select: { id: true, coverPhotoId: true } }),
    prisma.eventPhoto.findMany({
      where: { eventId: { in: eventIds }, approved: true },
      orderBy: [{ sortOrder: "asc" }, { uploadedAt: "asc" }],
      select: { id: true, eventId: true, url: true },
    }),
  ]);
  const coverId = new Map(events.map((e) => [e.id, e.coverPhotoId]));
  const byEvent = new Map<string, { id: string; url: string }[]>();
  for (const p of photos) byEvent.set(p.eventId, [...(byEvent.get(p.eventId) ?? []), p]);
  const out: Record<string, string> = {};
  byEvent.forEach((group, eventId) => {
    // Only approved rows were read, so a chosen cover that was unapproved or deleted is simply not found here.
    out[eventId] = (group.find((p) => p.id === coverId.get(eventId)) ?? group[0]).url;
  });
  return out;
}

export type GalleryEvent = {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  eventDate: Date;
  photoCount: number;
  coverUrl: string;
};

/** Past events with at least one approved photo, newest first. */
export async function getGalleryEvents(now = new Date()): Promise<GalleryEvent[]> {
  const events = await prisma.event.findMany({
    where: { status: { in: PUBLIC_STATUSES }, photos: { some: { approved: true } } },
    select: {
      id: true,
      slug: true,
      titleEn: true,
      titleEs: true,
      eventDate: true,
      endDate: true,
      _count: { select: { photos: { where: { approved: true } } } },
    },
  });
  const past = events.filter((e) => eventHasEnded(e, now)).sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());
  const covers = await getCoverUrls(past.map((e) => e.id));
  return past
    .filter((e) => covers[e.id])
    .map((e) => ({ id: e.id, slug: e.slug, titleEn: e.titleEn, titleEs: e.titleEs, eventDate: e.eventDate, photoCount: e._count.photos, coverUrl: covers[e.id] }));
}
