import { prisma } from "@/lib/db";
import { listDuplicatePairs } from "@/lib/identity/duplicates";
import { PATIENT_ONLY } from "@/lib/patients/query";
import { reviewFlags, type ReviewFlags } from "./rules";

export interface ReviewRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  status: "pending_review" | "on_hold";
  holdReason: string | null;
  source: string;
  flags: ReviewFlags;
  /** Records this one may duplicate (same email, phone or address, or flagged at registration). Names for the officer; no diagnoses. */
  duplicates: { id: string; name: string; reasons: string[] }[];
  /** The stored free-text address of an unstructured one, shown so the officer can fix it on a call. */
  unstructuredAddress: string | null;
}

/** Pending and on-hold households, oldest first. For officers with canManageUsers only (the page and API check). */
export async function loadReviewQueue(): Promise<ReviewRow[]> {
  // Diagnoses are NEVER selected here (reviewers use this too). "Affected member listed: yes/no" is answered by the
  // database: a second query that filters on the column and returns ids only.
  const waiting = { ...PATIENT_ONLY, reviewStatus: { in: ["pending_review", "on_hold"] } };
  const [rows, pairs, noAffected] = await Promise.all([
    prisma.patient.findMany({
      where: waiting,
      orderBy: { createdAt: "asc" },
      select: {
        id: true, email: true, createdAt: true, source: true, reviewStatus: true, reviewHoldReason: true,
        contactProfile: { select: { firstName: true, lastName: true, phone: true, addressLine1: true, city: true, zipCode: true } },
        householdMembers: { where: { status: "pending" }, select: { id: true } },
      },
    }),
    listDuplicatePairs(),
    prisma.patient.findMany({ where: { ...waiting, statedDiagnoses: { isEmpty: true } }, select: { id: true } }),
  ]);
  const noAffectedIds = new Set(noAffected.map((p) => p.id));
  const dupOf = new Map<string, ReviewRow["duplicates"]>();
  for (const p of pairs) {
    for (const [self, other] of [[p.a, p.b], [p.b, p.a]] as const) {
      const list = dupOf.get(self.id) ?? [];
      list.push({ id: other.id, name: other.name, reasons: p.reasons });
      dupOf.set(self.id, list);
    }
  }
  return rows.map((r) => {
    const cp = r.contactProfile;
    const duplicates = dupOf.get(r.id) ?? [];
    const flags = reviewFlags({
      email: r.email, phone: cp?.phone ?? null, noAffected: noAffectedIds.has(r.id), adultsPending: r.householdMembers.length,
      addressLine1: cp?.addressLine1 ?? null, city: cp?.city ?? null, zipCode: cp?.zipCode ?? null, duplicate: duplicates.length > 0,
    });
    return {
      id: r.id,
      name: `${cp?.firstName ?? ""} ${cp?.lastName ?? ""}`.trim() || "—",
      email: r.email, phone: cp?.phone ?? null, createdAt: r.createdAt.toISOString(), source: r.source,
      status: r.reviewStatus === "on_hold" ? "on_hold" : "pending_review", holdReason: r.reviewHoldReason,
      flags, duplicates, unstructuredAddress: flags.unstructuredAddress ? cp?.addressLine1 ?? null : null,
    };
  });
}
