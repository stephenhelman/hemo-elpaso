import type { Lang } from "@/types";
import { fillYears } from "@/lib/site";

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

/** Replace {years}, {decades} and {decadeYears} in text. Unknown tokens are left as written. */
export function fillPlaceholders<T>(value: T, locale: Lang): T {
  if (typeof value === "string") return (value.includes("{") ? fillYears(value, locale) : value) as T;
  if (Array.isArray(value)) {
    // portable text: only span text is touched
    return value.map((b: any) =>
      b && Array.isArray(b.children)
        ? { ...b, children: b.children.map((c: any) => (typeof c?.text === "string" ? { ...c, text: fillPlaceholders(c.text, locale) } : c)) }
        : b,
    ) as T;
  }
  return value;
}

/**
 * The field in `locale`, falling back to English when the Spanish is missing or empty,
 * with {years}/{decades} filled in (after the language is chosen).
 */
export function pick<T>(field: Localized<T>, locale: Lang): T | undefined {
  if (!field) return undefined;
  const v = field[locale];
  const chosen = (isEmptyValue(v) ? field.en : v) ?? undefined;
  return chosen === undefined ? undefined : fillPlaceholders(chosen as T, locale);
}
