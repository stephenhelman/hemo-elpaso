/**
 * Reviewer tier (permission canReviewRegistrations: Secretary and Treasurer by default). A reviewer sees a household's
 * contact details and its members (names, relationship, age group), approves or holds it, confirms an adult by phone and
 * flags a pair "needs merge". A reviewer NEVER receives a diagnosis field: the queries below SELECT only the columns they
 * return (no `include`, no diagnosis column anywhere), so the data never reaches this process, let alone the browser.
 * Only "affected member listed: yes/no" is answered, by a database filter that returns ids.
 * Every reviewer view and action is audited with the actor and ids only.
 */
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { isUnstructuredAddress } from "./rules";

export interface ReviewerActor { id: string; can: (p: "canManageUsers" | "canReviewRegistrations") => boolean }

/** Someone who reviews but does not manage patients: their views are logged. President/VP behaviour is unchanged. */
export const isReviewerOnly = (a: ReviewerActor) => a.can("canReviewRegistrations") && !a.can("canManageUsers");

export interface ReviewerMember { id: string; firstName: string | null; lastName: string | null; relationship: string; ageGroup: string; status: string; confirmByPhone: boolean }
export interface ReviewerHousehold {
  id: string; name: string; email: string | null; phone: string | null; language: "en" | "es"; createdAt: string; source: string;
  status: string; holdReason: string | null;
  address: { line1: string; line2: string | null; city: string | null; state: string | null; zip: string | null; unstructured: boolean } | null;
  /** "Affected member listed: yes/no". The diagnoses themselves are never loaded. */
  affectedMemberListed: boolean;
  members: ReviewerMember[];
}

/** One household for a reviewer. Explicit `select` only. Null when it is not a household. */
export async function loadReviewerHousehold(id: string): Promise<ReviewerHousehold | null> {
  const [p, none] = await Promise.all([
    prisma.patient.findFirst({
      where: { id, ...PATIENT_ONLY },
      select: {
        id: true, email: true, preferredLanguage: true, createdAt: true, source: true, reviewStatus: true, reviewHoldReason: true,
        contactProfile: { select: { firstName: true, lastName: true, phone: true, addressLine1: true, addressLine2: true, city: true, state: true, zipCode: true } },
        householdMembers: {
          where: { status: { notIn: ["declined", "expired"] } }, orderBy: { createdAt: "asc" },
          select: { id: true, firstName: true, lastName: true, relationship: true, ageGroup: true, status: true, confirmByPhone: true },
        },
      },
    }),
    prisma.patient.count({ where: { id, statedDiagnoses: { isEmpty: true } } }),
  ]);
  if (!p) return null;
  const cp = p.contactProfile;
  return {
    id: p.id, name: `${cp?.firstName ?? ""} ${cp?.lastName ?? ""}`.trim() || "—", email: p.email, phone: cp?.phone ?? null,
    language: p.preferredLanguage === "es" ? "es" : "en", createdAt: p.createdAt.toISOString(), source: p.source,
    status: p.reviewStatus, holdReason: p.reviewHoldReason,
    address: cp?.addressLine1 ? { line1: cp.addressLine1, line2: cp.addressLine2, city: cp.city, state: cp.state, zip: cp.zipCode, unstructured: isUnstructuredAddress(cp) } : null,
    affectedMemberListed: none === 0,
    members: p.householdMembers,
  };
}

/** Audit one reviewer view. Ids and counts only. Called for reviewer-only accounts (managers are unchanged). */
export const auditReviewerView = (actorId: string, view: "queue" | "household", ids: { householdId?: string; count?: number }) =>
  audit({
    actorType: "board", actorPatientId: actorId, action: AuditAction.REVIEWER_VIEWED, resourceType: view === "household" ? "Patient" : "ReviewQueue",
    resourceId: ids.householdId ?? null, details: `Reviewer opened the ${view}`, changes: { view, ...(ids.householdId ? { householdId: ids.householdId } : {}), ...(ids.count !== undefined ? { count: ids.count } : {}) },
  });

/**
 * "Needs merge": flags the NEWER of two records as a possible duplicate of the older one (the same flag a duplicate
 * registration gets) and lifts any earlier "not a duplicate" decision for the pair so it shows up for President/VP. It
 * merges nothing: executing a merge stays canManageUsers.
 */
export async function flagNeedsMerge(actorId: string, x: string, y: string): Promise<boolean> {
  if (!x || !y || x === y) return false;
  const rows = await prisma.patient.findMany({
    where: { id: { in: [x, y] }, ...PATIENT_ONLY },
    select: { id: true, createdAt: true, possibleDuplicateOfId: true },
  });
  if (rows.length !== 2) return false;
  const [older, newer] = rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id));
  const [a, b] = older.id < newer.id ? [older.id, newer.id] : [newer.id, older.id];
  await prisma.$transaction([
    prisma.duplicateDismissal.deleteMany({ where: { patientAId: a, patientBId: b } }),
    prisma.patient.update({ where: { id: newer.id }, data: { possibleDuplicateOfId: older.possibleDuplicateOfId ?? older.id } }),
  ]);
  await audit({
    actorType: "board", actorPatientId: actorId, action: AuditAction.REVIEW_NEEDS_MERGE_FLAGGED, resourceType: "Patient", resourceId: newer.id,
    details: "Pair flagged as needing a merge", changes: { flaggedId: newer.id, otherId: older.id },
  });
  return true;
}
