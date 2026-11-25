import { prisma } from "@/lib/db";
import { scoreEventForPatient } from "@/lib/event-matching";
import { eligiblePeople, householdMatchesTargeting } from "@/lib/households/eligibility";
import { currentConsents, PATIENT_ONLY } from "@/lib/patients/query";

/** Same bar lib/event-matching uses for "recommend". */
export const MATCH_THRESHOLD = 30;

export type EmailBlocker = "no_consent" | "no_email" | "opted_out";

/** Why a patient can't be sent an invitation email (null = can). */
export function emailBlocker(p: {
  email: string | null;
  emailOptOut: boolean;
  consentData: boolean | null;
}): EmailBlocker | null {
  if (p.consentData !== true) return "no_consent";
  if (!p.email) return "no_email";
  if (p.emailOptOut) return "opted_out";
  return null;
}

/**
 * Match people to an event with lib/event-matching (no new scoring rules).
 * - emailMatches: eligible for an invitation email (consent + email + not opted out)
 * - callList: matched, consented, NO email but a phone number (manual outreach)
 * Match reasons/diagnoses are never returned: callers only get ids + display fields.
 */
export async function matchPatientsForEvent(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { targeting: true, rsvps: { where: { cancelledAt: null }, select: { attendeeCount: true } } },
  });
  if (!event) return null;

  const patients = await prisma.patient.findMany({
    // Only approved households are matched (registration review). Cut-off households keep invitations created before the gate.
    where: { ...PATIENT_ONLY, reviewStatus: "approved" },
    include: { contactProfile: true, preferences: true, consentRecords: true, householdMembers: true },
    orderBy: { createdAt: "asc" },
  });

  const emailMatches: typeof patients = [];
  const callList: typeof patients = [];
  // household members to confirm by phone, keyed by patient id (first names only: not PHI)
  const confirmFor = new Map<string, string[]>();
  const seenEmails = new Set<string>();

  for (const p of patients) {
    const consents = currentConsents(p.consentRecords);
    if (consents.data_and_contact !== true) continue;
    // Targeted events: ANY eligible person (primary, minors, confirmed adults) must
    // satisfy the targeting: diagnosis overlap if targeted AND age group if targeted.
    // Pending/declined/expired adults never count. (The score alone can reach the
    // threshold from language/capacity/audience points, so this gate is required.)
    if (!householdMatchesTargeting(eligiblePeople(p.primaryDiagnoses, p.householdMembers), event.targeting)) continue;
    const { score } = scoreEventForPatient(p, event);
    if (score < MATCH_THRESHOLD) continue;

    const blocker = emailBlocker({ email: p.email, emailOptOut: p.emailOptOut, consentData: true });
    if (blocker === null) {
      // One email per address (duplicates share an address).
      const key = p.email!.toLowerCase();
      if (seenEmails.has(key)) continue;
      seenEmails.add(key);
      emailMatches.push(p);
    } else if (blocker === "no_email" && p.contactProfile?.phone) {
      callList.push(p);
    }
    // Adults still pending who confirm by phone: the board calls the household.
    const toCall = p.householdMembers
      .filter((m) => m.status === "pending" && m.confirmByPhone && m.firstName)
      .map((m) => m.firstName!);
    if (toCall.length && p.contactProfile?.phone) {
      confirmFor.set(p.id, toCall);
      if (!callList.includes(p)) callList.push(p);
    }
  }
  return { event, emailMatches, callList, confirmFor };
}
