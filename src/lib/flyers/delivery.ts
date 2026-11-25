import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { validateFlyerDelivery } from "./index";

export type SetDeliveryResult = { ok: true; changed: boolean } | { ok: false; error: "invalid" | "not_found" };

/**
 * Change a household's flyer delivery preference and log it: the household id, the acting person and the FIELD NAME only
 * (never the value, an address or an email). Shared by the family page (any confirmed adult) and the admin patient page.
 */
export async function setFlyerDelivery(
  householdId: string, value: unknown,
  actor: { type: "board"; patientId: string } | { type: "family"; memberId: string | null },
): Promise<SetDeliveryResult> {
  const p = await prisma.patient.findUnique({ where: { id: householdId }, select: { email: true, flyerDelivery: true } });
  if (!p) return { ok: false, error: "not_found" };
  const next = validateFlyerDelivery(value, p);
  if (!next) return { ok: false, error: "invalid" };
  if (next === p.flyerDelivery) return { ok: true, changed: false };
  await prisma.patient.update({ where: { id: householdId }, data: { flyerDelivery: next } });
  await audit({
    actorType: actor.type,
    actorPatientId: actor.type === "board" ? actor.patientId : householdId,
    actorMemberId: actor.type === "family" ? actor.memberId : null,
    action: AuditAction.FLYER_DELIVERY_CHANGED,
    resourceType: "Patient",
    resourceId: householdId,
    details: "Flyer delivery preference changed",
    changes: { fields: ["flyerDelivery"], actor: actor.type === "board" ? actor.patientId : actor.memberId ?? householdId },
  });
  return { ok: true, changed: true };
}
