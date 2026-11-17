import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Recompute the denormalized household fields from the source rows. Call inside
 * the same transaction as EVERY write to a patient's primaryDiagnoses or members.
 *   familySize      = 1 + member count (declined/expired placeholders still count)
 *   statedDiagnoses = union of primary + minors + CONFIRMED adults
 * Pending, declined and expired adults never contribute (declined/expired have none anyway).
 * PHI: diagnoses are never logged here.
 */
export async function recomputeHousehold(tx: Tx, patientId: string) {
  const p = await tx.patient.findUnique({
    where: { id: patientId },
    select: {
      primaryDiagnoses: true,
      householdMembers: { select: { ageGroup: true, status: true, statedDiagnoses: true } },
    },
  });
  if (!p) return;
  const union = new Set<string>(p.primaryDiagnoses);
  for (const m of p.householdMembers) {
    if (m.ageGroup !== "18_plus" || m.status === "confirmed") m.statedDiagnoses.forEach((d) => union.add(d));
  }
  await tx.patient.update({
    where: { id: patientId },
    data: { familySize: 1 + p.householdMembers.length, statedDiagnoses: Array.from(union) },
  });
}

/** Null out everything personal on a member; keep the placeholder row. Same write for decline and expiry. */
export const purgedMemberData = (status: "declined" | "expired") =>
  ({
    status,
    firstName: null,
    lastName: null,
    email: null,
    statedDiagnoses: [],
    confirmByPhone: false,
    confirmTokenHash: null,
    confirmTokenExpiresAt: null,
  }) satisfies Prisma.HouseholdMemberUpdateInput;
