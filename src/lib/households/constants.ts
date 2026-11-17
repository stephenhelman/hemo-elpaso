/**
 * Household vocabulary. Safe to import from client components (no server deps).
 * We collect AGE GROUPS, never birth dates.
 */
export const RELATIONSHIPS = ["child", "spouse_partner", "parent", "sibling", "other"] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

export const AGE_GROUPS = ["0_5", "6_12", "13_17", "18_plus"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export const MEMBER_STATUSES = ["not_required", "pending", "confirmed", "declined", "expired"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const MAX_HOUSEHOLD_SIZE = 12;
/** Confirmation links and pending adults live this long. */
export const CONFIRM_TOKEN_DAYS = 30;

export const isAdultGroup = (g: string) => g === "18_plus";

export const relationshipLabels: Record<Relationship, { en: string; es: string }> = {
  child: { en: "Child", es: "Hijo/a" },
  spouse_partner: { en: "Spouse / partner", es: "Cónyuge / pareja" },
  parent: { en: "Parent", es: "Padre / madre" },
  sibling: { en: "Sibling", es: "Hermano/a" },
  other: { en: "Other", es: "Otro" },
};

export const ageGroupLabels: Record<AgeGroup, { en: string; es: string }> = {
  "0_5": { en: "0–5 years", es: "0–5 años" },
  "6_12": { en: "6–12 years", es: "6–12 años" },
  "13_17": { en: "13–17 years", es: "13–17 años" },
  "18_plus": { en: "18 or older", es: "18 años o más" },
};

export const memberStatusLabels: Record<MemberStatus, { en: string; es: string }> = {
  not_required: { en: "Minor", es: "Menor" },
  pending: { en: "Pending", es: "Pendiente" },
  confirmed: { en: "Confirmed", es: "Confirmado" },
  declined: { en: "Declined", es: "Rechazó" },
  expired: { en: "Expired", es: "Venció" },
};

/** Keep only valid age groups; undefined when the input isn't an array (so callers can leave the field untouched). */
export function cleanAgeGroups(input: unknown): AgeGroup[] | undefined {
  if (!Array.isArray(input)) return undefined;
  return AGE_GROUPS.filter((a) => input.includes(a));
}
