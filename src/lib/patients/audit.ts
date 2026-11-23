import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Audit entries for patient admin actions. `details` must never contain
 * diagnoses or contact details: use ids and field NAMES only.
 */
export async function auditPatient(
  adminId: string,
  action: AuditAction,
  patientId: string | null,
  details: string,
) {
  await prisma.auditLog.create({
    data: {
      patientId: adminId, // the acting board user (existing convention)
      actorType: "board",
      action,
      resourceType: "Patient",
      resourceId: patientId,
      details,
    },
  });
}
