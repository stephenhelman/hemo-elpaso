/** Feature status labels shown on the policy pages (screen and print). PURE. */
import type { FeatureKey } from "@/lib/features/registry";

export type FeatureStatus = { enabled: boolean; /** calendar date YYYY-MM-DD in the site time zone */ since: string | null };
export type StatusMap = Record<FeatureKey, FeatureStatus>;

export const formatCalendarDate = (iso: string, locale: "en" | "es") =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale === "es" ? "es-US" : "en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });

export function statusLabel(s: FeatureStatus | undefined, locale: "en" | "es"): string {
  if (s?.enabled && s.since) return locale === "es" ? `Disponible desde ${formatCalendarDate(s.since, locale)}` : `Available since ${formatCalendarDate(s.since, locale)}`;
  if (s?.enabled) return locale === "es" ? "Disponible" : "Available";
  return locale === "es" ? "Aún no disponible" : "Not yet available";
}

/** YYYY-MM-DD of an instant in the given IANA zone. */
export const calendarDateIn = (d: Date, timeZone: string) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
