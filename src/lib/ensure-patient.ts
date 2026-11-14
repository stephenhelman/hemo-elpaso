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
