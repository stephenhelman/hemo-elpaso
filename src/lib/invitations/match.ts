import { prisma } from "@/lib/db";
import { scoreEventForPatient } from "@/lib/event-matching";
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
    include: { targeting: true, _count: { select: { rsvps: { where: { cancelledAt: null } } } } },
  });
  if (!event) return null;

  const patients = await prisma.patient.findMany({
    where: PATIENT_ONLY,
    include: { contactProfile: true, preferences: true, consentRecords: true },
    orderBy: { createdAt: "asc" },
  });

  const emailMatches: typeof patients = [];
  const callList: typeof patients = [];
  const seenEmails = new Set<string>();

  for (const p of patients) {
    const consents = currentConsents(p.consentRecords);
    if (consents.data_and_contact !== true) continue;
    // Targeted events: a diagnosis overlap is REQUIRED (the score alone can reach
    // the threshold from language/capacity/audience points).
    const targets = event.targeting?.targetConditions ?? [];
    if (targets.length > 0 && !p.statedDiagnoses.some((d) => targets.includes(d))) continue;
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
  }
  return { event, emailMatches, callList };
}
