import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { HOUSEHOLD_EVIDENCE } from "@/lib/patients/query";
import { addressKey } from "@/lib/address/validate";
import { candidatePairs, pairKey, type DupPair, type DuplicateReason } from "./merge-rules";

export interface DuplicateRow {
  aId: string; bId: string; reasons: DuplicateReason[];
  a: DupPerson; b: DupPerson;
}
export interface DupPerson { id: string; name: string; email: string | null; phone: string | null; hasHousehold: boolean; boardRoles: string[]; createdAt: Date }

/**
 * Pairs worth a look for President/VP: the registration flag (possibleDuplicateOfId) plus same email, same phone and same address,
 * across households AND board records. Merged-away records and the settings-only admin are never listed; pairs marked
 * "not a duplicate" stay out.
 */
export async function listDuplicatePairs(): Promise<DuplicateRow[]> {
  const people = await prisma.patient.findMany({
    where: { role: { notIn: ["admin", "merged"] }, mergedIntoId: null },
    select: {
      id: true, email: true, possibleDuplicateOfId: true, createdAt: true,
      contactProfile: { select: { firstName: true, lastName: true, phone: true, addressLine1: true, addressLine2: true, zipCode: true } },
      boardRoles: { where: { active: true }, select: { role: true } },
    },
  });
  const dismissed = new Set((await prisma.duplicateDismissal.findMany({ select: { patientAId: true, patientBId: true } })).map((d) => `${d.patientAId}|${d.patientBId}`));
  const pairs: DupPair[] = candidatePairs(people.map((p) => ({ id: p.id, email: p.email, phone: p.contactProfile?.phone ?? null, possibleDuplicateOfId: p.possibleDuplicateOfId, addressKey: p.contactProfile ? addressKey(p.contactProfile) : null })), dismissed);
  if (pairs.length === 0) return [];
  const withHousehold = new Set((await prisma.patient.findMany({ where: { id: { in: people.map((p) => p.id) }, ...HOUSEHOLD_EVIDENCE }, select: { id: true } })).map((p) => p.id));
  const byId = new Map(people.map((p) => [p.id, p]));
  const person = (id: string): DupPerson => {
    const p = byId.get(id)!;
    return { id, name: `${p.contactProfile?.firstName ?? ""} ${p.contactProfile?.lastName ?? ""}`.trim() || "—", email: p.email, phone: p.contactProfile?.phone ?? null, hasHousehold: withHousehold.has(id), boardRoles: p.boardRoles.map((r) => r.role), createdAt: p.createdAt };
  };
  return pairs.map((p) => ({ ...p, a: person(p.aId), b: person(p.bId) }));
}

/** "Not a duplicate": remember the pair (so it is never offered again) and clear the registration flag between them. Ids only in the audit row. */
export async function dismissDuplicate(actorId: string, x: string, y: string): Promise<boolean> {
  if (x === y) return false;
  const [a, b] = pairKey(x, y);
  const found = await prisma.patient.count({ where: { id: { in: [a, b] } } });
  if (found !== 2) return false;
  await prisma.$transaction([
    prisma.duplicateDismissal.upsert({ where: { patientAId_patientBId: { patientAId: a, patientBId: b } }, create: { patientAId: a, patientBId: b, dismissedByPatientId: actorId }, update: {} }),
    prisma.patient.updateMany({ where: { id: a, possibleDuplicateOfId: b }, data: { possibleDuplicateOfId: null } }),
    prisma.patient.updateMany({ where: { id: b, possibleDuplicateOfId: a }, data: { possibleDuplicateOfId: null } }),
  ]);
  await audit({ actorType: "board", actorPatientId: actorId, action: AuditAction.PATIENT_DUPLICATE_DISMISSED, resourceType: "Patient", resourceId: a, details: "Pair marked not a duplicate", changes: { patientAId: a, patientBId: b } });
  return true;
}
