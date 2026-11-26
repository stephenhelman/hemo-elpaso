import { currentSmsConsent } from "@/lib/consent/sms";
import { prisma } from "@/lib/db";
import { decryptCheckInToken } from "@/lib/crypto/checkin-token";
import { householdLang, pickFlyer, type PickedFlyer } from "@/lib/flyers";
import { currentValue, isPast, visibleDiagnoses, type ConsentRow } from "./rules";

export interface PortalRsvp {
  id: string;
  title: { en: string; es: string };
  eventDate: string;
  location: string;
  partySize: number;
  cancelled: boolean;
  past: boolean;
  /** /rsvp/<token> to change or cancel. Null once the token was cleared (30 days after the event) or if cancelled. */
  link: string | null;
  /** The flyer in the household's language (the other language if that is the only one). null = the event has no flyer. */
  flyer: PickedFlyer | null;
}
export interface PortalInvite { id: string; title: { en: string; es: string }; eventDate: string; location: string; flyer: PickedFlyer | null }
export interface PortalMember { id: string; firstName: string | null; lastName: string | null; relationship: string; ageGroup: string; diagnoses: string[] }

export interface PortalHousehold {
  firstName: string;
  lastName: string;
  language: "en" | "es";
  primaryDiagnoses: string[];
  members: PortalMember[];
  upcoming: PortalRsvp[];
  past: PortalRsvp[];
  invited: PortalInvite[];
  consents: { data_and_contact: boolean | null; media: boolean | null; sms: boolean | null; newsletter: boolean | null };
}

/**
 * Everything the family page shows, for ONE person: the signed-in person's own household. The id always comes from
 * the session, never from a URL. Contains health information (diagnoses): it is rendered on the server and never
 * logged or put in a URL.
 */
export async function loadHousehold(patientId: string, now = new Date()): Promise<PortalHousehold | null> {
  const p = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      preferredLanguage: true,
      primaryDiagnoses: true,
      contactProfile: { select: { firstName: true, lastName: true, phone: true } },
      householdMembers: { orderBy: { createdAt: "asc" }, select: { id: true, firstName: true, lastName: true, relationship: true, ageGroup: true, statedDiagnoses: true } },
      consentRecords: { select: { type: true, granted: true, createdAt: true, phoneNumber: true } },
      rsvps: {
        orderBy: { rsvpDate: "desc" },
        select: {
          id: true, attendeeCount: true, cancelledAt: true, checkInTokenEnc: true,
          event: { select: { id: true, titleEn: true, titleEs: true, eventDate: true, endDate: true, location: true, flyerEnUrl: true, flyerEsUrl: true, flyerEnAlt: true, flyerEsAlt: true } },
        },
      },
      invitations: {
        where: { status: "sent", removedAt: null },
        select: { id: true, eventId: true, event: { select: { titleEn: true, titleEs: true, eventDate: true, endDate: true, location: true, flyerEnUrl: true, flyerEsUrl: true, flyerEnAlt: true, flyerEsAlt: true } } },
      },
    },
  });
  if (!p) return null;
  const lang = householdLang(p.preferredLanguage);

  const diag = visibleDiagnoses(p.primaryDiagnoses, p.householdMembers);
  const rsvps: PortalRsvp[] = p.rsvps.map((r) => {
    const raw = r.cancelledAt ? null : decryptCheckInToken(r.checkInTokenEnc);
    return {
      id: r.id,
      title: { en: r.event.titleEn, es: r.event.titleEs },
      eventDate: r.event.eventDate.toISOString(),
      location: r.event.location,
      partySize: r.attendeeCount,
      cancelled: !!r.cancelledAt,
      past: isPast(r.event, now),
      link: raw ? `/rsvp/${raw}` : null,
      flyer: pickFlyer(r.event, lang),
    };
  });
  const rsvpEvents = new Set(p.rsvps.map((r) => r.event.id));
  const rows: ConsentRow[] = p.consentRecords;

  return {
    firstName: p.contactProfile?.firstName ?? "",
    lastName: p.contactProfile?.lastName ?? "",
    language: p.preferredLanguage === "es" ? "es" : "en",
    primaryDiagnoses: diag.primary,
    members: p.householdMembers.map((m) => ({ id: m.id, firstName: m.firstName, lastName: m.lastName, relationship: m.relationship, ageGroup: m.ageGroup, diagnoses: diag.minors[m.id] ?? [] })),
    upcoming: rsvps.filter((r) => !r.past).sort((a, b) => a.eventDate.localeCompare(b.eventDate)),
    past: rsvps.filter((r) => r.past),
    invited: p.invitations
      .filter((i) => !isPast(i.event, now) && !rsvpEvents.has(i.eventId))
      .map((i) => ({ id: i.id, title: { en: i.event.titleEn, es: i.event.titleEs }, eventDate: i.event.eventDate.toISOString(), location: i.event.location, flyer: pickFlyer(i.event, lang) }))
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate)),
    consents: {
      data_and_contact: currentValue(rows, "data_and_contact"),
      media: currentValue(rows, "media"),
      sms: currentSmsConsent(rows, p.contactProfile?.phone),
      newsletter: currentValue(rows, "newsletter"),
    },
  };
}
