import { cleanText, isValidEmail, normalizeEmail } from "@/lib/patients/normalize";
import { sanitizeDiagnoses } from "@/lib/patients/diagnoses";
import {
  AGE_GROUPS,
  MAX_HOUSEHOLD_SIZE,
  RELATIONSHIPS,
  isAdultGroup,
  type AgeGroup,
  type Relationship,
} from "./constants";

export type ValidatedMember = {
  firstName: string;
  lastName: string | null;
  relationship: Relationship;
  ageGroup: AgeGroup;
  /** Minors only. Nobody enters health information about another adult. */
  statedDiagnoses: string[];
  email: string | null;
  confirmByPhone: boolean;
  status: "not_required" | "pending";
};

export type MembersResult =
  | { ok: true; members: ValidatedMember[] }
  | { ok: false; field: string };

/**
 * Server-side rules for the member list (public form and admin "Add patient"):
 * - household size (primary included) is 1..12 and must equal 1 + members.length
 * - every slot is complete: first name, relationship, age group
 * - an 18_plus member needs an email OR confirmByPhone (never both: phone wins)
 * - adults never carry diagnoses; minors never carry email or confirmByPhone
 * Field names in failures are generic ("members") so the client can show one message.
 */
export function validateMembers(rawMembers: unknown, householdSize: unknown): MembersResult {
  const size = Number(householdSize);
  if (!Number.isInteger(size) || size < 1 || size > MAX_HOUSEHOLD_SIZE)
    return { ok: false, field: "familySize" };
  const list = rawMembers === undefined || rawMembers === null ? [] : rawMembers;
  if (!Array.isArray(list) || list.length !== size - 1) return { ok: false, field: "members" };

  const members: ValidatedMember[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") return { ok: false, field: "members" };
    const m = raw as Record<string, unknown>;
    const firstName = cleanText(m.firstName, 100);
    if (!firstName) return { ok: false, field: "members" };
    const relationship = RELATIONSHIPS.find((r) => r === m.relationship);
    const ageGroup = AGE_GROUPS.find((a) => a === m.ageGroup);
    if (!relationship || !ageGroup) return { ok: false, field: "members" };

    if (isAdultGroup(ageGroup)) {
      const confirmByPhone = m.confirmByPhone === true;
      const email = confirmByPhone ? null : normalizeEmail(m.email);
      if (!confirmByPhone && (!email || !isValidEmail(email))) return { ok: false, field: "members" };
      members.push({
        firstName,
        lastName: cleanText(m.lastName, 100) || null,
        relationship,
        ageGroup,
        statedDiagnoses: [],
        email,
        confirmByPhone,
        status: "pending",
      });
    } else {
      members.push({
        firstName,
        lastName: cleanText(m.lastName, 100) || null,
        relationship,
        ageGroup,
        statedDiagnoses: sanitizeDiagnoses(m.diagnoses),
        email: null,
        confirmByPhone: false,
        status: "not_required",
      });
    }
  }
  return { ok: true, members };
}
