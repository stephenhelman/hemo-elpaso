import { prisma } from "@/lib/db";

/**
 * Ensures a Patient record exists for an Auth0 user.
 * Creates a minimal stub record if one doesn't exist yet.
 * Returns patient with registration status and contact profile check.
 */
export async function ensurePatientExists(auth0Id: string, email: string) {
  const existing = await prisma.patient.findUnique({
    where: { auth0Id },
    select: {
      id: true,
      registrationCompletedAt: true,
      contactProfile: { select: { id: true } }, // Changed from profile
    },
  });

  if (existing) return existing;

  // Create minimal patient stub (no contact profile yet)
  const created = await prisma.patient.create({
    data: {
      auth0Id,
      email,
      role: "patient",
      preferredLanguage: "en",
    },
    select: {
      id: true,
      registrationCompletedAt: true,
      contactProfile: { select: { id: true } },
    },
  });

  return created;
}

/**
 * Calculate grace period end date based on whether patient or family has disorders
 */
export function calculateGracePeriodEnd(
  patientHasCondition: boolean,
  familyHasCondition: boolean,
): Date | null {
  if (!patientHasCondition && !familyHasCondition) {
    return null; // No grace period needed
  }

  const gracePeriod = new Date();
  gracePeriod.setDate(gracePeriod.getDate() + 60); // 60 days from now
  return gracePeriod;
}

/**
 * Determine grace period source
 */
export function getGracePeriodSource(
  patientHasCondition: boolean,
  familyHasCondition: boolean,
): "self" | "family" | null {
  if (patientHasCondition) return "self";
  if (familyHasCondition) return "family";
  return null;
}

/**
 * Calculate migration eligibility date (18 years from date of birth)
 */
export function calculateMigrationEligibility(dateOfBirth: Date): Date {
  const eligibleDate = new Date(dateOfBirth);
  eligibleDate.setFullYear(eligibleDate.getFullYear() + 18);
  return eligibleDate;
}
