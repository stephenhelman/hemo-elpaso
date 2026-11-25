import { prisma } from "@/lib/db";

export interface AlsoSendMember { id: string; status: string; ageGroup: string; email: string | null; preferredLanguage: string | null }

/** Only CONFIRMED adults with an email can be chosen. Unknown ids, minors, pending/declined/expired adults and no-email adults are dropped. */
export function pickAlsoSendIds(members: AlsoSendMember[], wanted: unknown): string[] {
  if (!Array.isArray(wanted)) return [];
  const ok = new Set(members.filter((m) => m.status === "confirmed" && m.ageGroup === "18_plus" && !!m.email).map((m) => m.id));
  return Array.from(new Set(wanted.filter((x): x is string => typeof x === "string" && ok.has(x))));
}

/** Confirmed adults (with an email) chosen to ALSO receive invitation and confirmation emails. The primary is never in this list: they always get them. */
export async function alsoSendRecipients(patientId: string): Promise<{ memberId: string; email: string; language: "en" | "es" | null }[]> {
  const p = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { alsoSendToMemberIds: true, householdMembers: { select: { id: true, status: true, ageGroup: true, email: true, preferredLanguage: true } } },
  });
  if (!p) return [];
  const ids = new Set(pickAlsoSendIds(p.householdMembers, p.alsoSendToMemberIds));
  return p.householdMembers
    .filter((m) => ids.has(m.id))
    .map((m) => ({ memberId: m.id, email: m.email!, language: m.preferredLanguage === "es" ? "es" as const : m.preferredLanguage === "en" ? "en" as const : null }));
}
