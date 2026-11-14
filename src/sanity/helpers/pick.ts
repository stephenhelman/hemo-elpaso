import type { Lang } from "@/types";

export type Localized<T = string> = { en?: T | null; es?: T | null } | null | undefined;

const isEmptyValue = (v: unknown): boolean => {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) {
    if (v.length === 0) return true;
    // portable text: empty when no block has any non-blank span text
    return v.every((b: any) => !b?.children?.some((c: any) => (c?.text ?? "").trim() !== ""));
  }
  return false;
};

/** The field in `locale`, falling back to English when the Spanish is missing or empty. */
export function pick<T>(field: Localized<T>, locale: Lang): T | undefined {
  if (!field) return undefined;
  const v = field[locale];
  return (isEmptyValue(v) ? field.en : v) ?? undefined;
}
