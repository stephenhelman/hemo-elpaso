import { AgeTier } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Calculate age tier from date of birth.
 * RECORD_ONLY: no DOB or under 13
 * YOUTH: 13–17
 * ADULT: 18+
 */
export function calculateAgeTier(dateOfBirth: Date | null | undefined): AgeTier {
  if (!dateOfBirth) return AgeTier.RECORD_ONLY;
  const ageMs = Date.now() - new Date(dateOfBirth).getTime();
  const years = Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));
  if (years < 13) return AgeTier.RECORD_ONLY;
  if (years < 18) return AgeTier.YOUTH;
  return AgeTier.ADULT;
}

/**
 * Check whether a patient's family is restricted from RSVP and financial assistance.
 * Restricted when: any FamilyMembership in the family has hasBleedingDisorder = true
 * AND diagnosisVerified = false AND was created more than 60 days ago (grace period expired).
 */
export async function getFamilyRestrictionStatus(
  patientId: string
): Promise<{ restricted: boolean; reason: string | null }> {
  // Find the family this patient belongs to (as primary patient or as a member)
  const family = await prisma.family.findFirst({
    where: {
      OR: [
        { primaryPatientId: patientId },
        { memberships: { some: { patientId } } },
      ],
    },
    include: {
      memberships: {
        where: {
          status: "ACTIVE",
          hasBleedingDisorder: true,
          diagnosisVerified: false,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      },
    },
  });

  if (!family) return { restricted: false, reason: null };

  // Grace period: 60 days from membership creation
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const expired = family.memberships.filter(
    (m) => now - new Date(m.createdAt).getTime() > sixtyDaysMs
  );

  if (expired.length > 0) {
    const names = expired.map((m) => `${m.firstName} ${m.lastName}`).join(", ");
    return {
      restricted: true,
      reason: `A family member with a bleeding disorder has not submitted a verified diagnosis letter: ${names}. Please upload their diagnosis letter to continue.`,
    };
  }

  return { restricted: false, reason: null };
}
