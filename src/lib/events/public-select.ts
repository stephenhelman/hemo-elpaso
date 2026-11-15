import type { Prisma } from "@prisma/client";

/**
 * The ONLY Event fields that may leave the server on public routes, server
 * components handed to client components, JSON-LD and the sitemap.
 *
 * Never add: createdBy (an admin identifier), relations (rsvps, sponsors,
 * invitations, targeting, emailLogs, ...), eventCost, liveEnabled, targetAudience.
 * Spots-left is derived (rsvpPeople via lib/rsvp/capacity), not a relation count.
 */
export const publicEventSelect = {
  id: true,
  slug: true,
  titleEn: true,
  titleEs: true,
  descriptionEn: true,
  descriptionEs: true,
  flyerEnUrl: true,
  flyerEsUrl: true,
  eventDate: true,
  endDate: true,
  location: true,
  maxCapacity: true,
  rsvpDeadline: true,
  status: true,
  category: true,
  language: true,
  isPriority: true,
  registrationEnabled: true,
  recapTitleEn: true,
  recapTitleEs: true,
  recapBodyEn: true,
  recapBodyEs: true,
  recapGalleryEmbedUrl: true,
  recapPublishedAt: true,
  sponsorSanityIds: true, // public Sanity document ids; the page resolves them to ACTIVE sponsors only
  updatedAt: true,
} satisfies Prisma.EventSelect;

export type PublicEvent = Prisma.EventGetPayload<{ select: typeof publicEventSelect }>;
