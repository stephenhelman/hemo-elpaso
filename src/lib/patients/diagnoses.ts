/**
 * Stated diagnoses are PROTECTED HEALTH INFORMATION.
 * Never put them in emails, URLs, query strings, QR payloads, logs, or
 * client-side analytics. Server-side storage + admin UI only.
 *
 * Values match EventTargeting.targetConditions so matching can target them.
 */
export const DIAGNOSIS_VALUES = [
  "hemophilia_a",
  "hemophilia_b",
  "von_willebrand",
  "other",
  "carrier",
  "family_caregiver",
] as const;

export type Diagnosis = (typeof DIAGNOSIS_VALUES)[number];

export const diagnosisLabels: Record<Diagnosis, { en: string; es: string }> = {
  hemophilia_a: { en: "Hemophilia A", es: "Hemofilia A" },
  hemophilia_b: { en: "Hemophilia B", es: "Hemofilia B" },
  von_willebrand: {
    en: "von Willebrand disease",
    es: "Enfermedad de von Willebrand",
  },
  other: { en: "Other bleeding disorder", es: "Otro trastorno hemorrágico" },
  carrier: { en: "Carrier", es: "Portadora/portador" },
  family_caregiver: {
    en: "Family member / caregiver",
    es: "Familiar / cuidador",
  },
};

export function sanitizeDiagnoses(input: unknown): Diagnosis[] {
  if (!Array.isArray(input)) return [];
  const allowed = new Set<string>(DIAGNOSIS_VALUES);
  return Array.from(new Set(input.filter((v) => typeof v === "string" && allowed.has(v)))) as Diagnosis[];
}
