import { isAdultGroup } from "./constants";

export type EligibleMemberSource = {
  ageGroup: string;
  status: string;
  statedDiagnoses: string[];
};

export type EligiblePerson = { ageGroup: string | null; diagnoses: string[] };

/**
 * People who count for matching: the primary (age group unknown: we only ask
 * the primary to be 18+ via the attestation, so they count as 18_plus), minors,
 * and CONFIRMED adults. Pending/declined/expired adults are excluded.
 */
export function eligiblePeople(
  primaryDiagnoses: string[],
  members: EligibleMemberSource[],
): EligiblePerson[] {
  const out: EligiblePerson[] = [{ ageGroup: "18_plus", diagnoses: primaryDiagnoses }];
  for (const m of members) {
    if (isAdultGroup(m.ageGroup) && m.status !== "confirmed") continue;
    if (m.status === "declined" || m.status === "expired") continue;
    out.push({ ageGroup: m.ageGroup, diagnoses: m.statedDiagnoses });
  }
  return out;
}

/**
 * A household matches if ANY eligible person satisfies the targeting:
 * diagnosis overlap (if conditions are targeted) AND age group (if targeted),
 * evaluated on the SAME person.
 */
export function householdMatchesTargeting(
  people: EligiblePerson[],
  targeting: { targetConditions: string[]; targetAgeGroups: string[] } | null | undefined,
): boolean {
  const conds = targeting?.targetConditions ?? [];
  const ages = (targeting?.targetAgeGroups ?? []).filter((a) =>
    ["0_5", "6_12", "13_17", "18_plus"].includes(a),
  );
  if (conds.length === 0 && ages.length === 0) return true;
  return people.some(
    (p) =>
      (conds.length === 0 || p.diagnoses.some((d) => conds.includes(d))) &&
      (ages.length === 0 || (p.ageGroup !== null && ages.includes(p.ageGroup))),
  );
}
