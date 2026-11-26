import "server-only";
import { prisma } from "@/lib/db";
import { isFeatureEnabled } from "@/lib/features";
import { registrationOpen } from "@/lib/registration";
import { sanityFetch } from "@/sanity/fetch";
import { announcementsQuery, ANNOUNCEMENT_TAGS } from "@/sanity/queries/announcements";
import type { AnnouncementsData } from "@/sanity/types";
import { loadAnnouncements } from "./load";
import type { PublicAnnouncement } from "./display";

const NOTHING: AnnouncementsData = { announcements: [], conferences: [], hasConferenceSection: false };

/** The announcements to show right now. Empty when the "site_announcements" toggle is off or anything fails. */
export function getLiveAnnouncements(): Promise<PublicAnnouncement[]> {
  return loadAnnouncements({
    enabled: () => isFeatureEnabled("site_announcements"),
    fetchContent: async () =>
      (await sanityFetch<AnnouncementsData>({ query: announcementsQuery, tags: ANNOUNCEMENT_TAGS, fallback: () => NOTHING })).data,
    findEvents: (slugs) =>
      prisma.event.findMany({
        where: { slug: { in: slugs }, status: "published", allowUninvitedRequests: true },
        select: { slug: true, status: true, allowUninvitedRequests: true, eventDate: true, endDate: true },
      }),
    registrationOpen,
    onError: (stage, e) => console.error("[announcements] failed", { stage, error: (e as Error)?.name }),
  });
}
