/**
 * Per-person view of an RSVP for check-in and reports. Names, relationship and
 * age group only: no diagnoses, emails or addresses ever pass through here.
 */

/** Prisma `include` for attendee rows that carries what the NO PHOTOS rule needs. */
export const ATTENDEE_WITH_MEMBER = {
  householdMember: {
    select: {
      id: true,
      firstName: true,
      relationship: true,
      ageGroup: true,
      status: true,
      // newest media consent for the member only
      consentRecords: { where: { type: "media" }, orderBy: { createdAt: "desc" as const }, take: 1, select: { granted: true } },
    },
  },
} as const;

type AttendeeRow = {
  id: string;
  isPrimary: boolean;
  checkedInAt: Date | null;
  householdMember: null | {
    id: string;
    firstName: string | null;
    relationship: string;
    ageGroup: string;
    status: string;
    consentRecords: { granted: boolean }[];
  };
};

export type RsvpPerson = {
  attendeeId: string;
  name: string;
  relationship: string | null; // null = the primary
  ageGroup: string | null;
  isPrimary: boolean;
  checkedIn: boolean;
  noPhotos: boolean;
};

/**
 * NO PHOTOS per person:
 * - the primary and minors use the PRIMARY's latest media consent (none = no)
 * - a confirmed adult uses their OWN latest media consent (none = no)
 * - a pending adult has given no consent yet: NO PHOTOS
 */
export function personNoPhotos(a: AttendeeRow, primaryMediaGranted: boolean | undefined): boolean {
  const m = a.householdMember;
  if (a.isPrimary || !m) return primaryMediaGranted !== true;
  if (m.ageGroup !== "18_plus") return primaryMediaGranted !== true;
  if (m.status !== "confirmed") return true;
  return m.consentRecords[0]?.granted !== true;
}

/** Primary first, then household members in the order given. */
export function mapPeople(attendees: AttendeeRow[], primaryFirstName: string, primaryMediaGranted: boolean | undefined): RsvpPerson[] {
  const sorted = [...attendees].sort((x, y) => Number(y.isPrimary) - Number(x.isPrimary));
  return sorted.map((a) => ({
    attendeeId: a.id,
    name: a.isPrimary ? primaryFirstName : a.householdMember?.firstName ?? "—",
    relationship: a.isPrimary ? null : a.householdMember?.relationship ?? null,
    ageGroup: a.isPrimary ? null : a.householdMember?.ageGroup ?? null,
    isPrimary: a.isPrimary,
    checkedIn: !!a.checkedInAt,
    noPhotos: personNoPhotos(a, primaryMediaGranted),
  }));
}
