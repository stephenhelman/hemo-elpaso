import type { ScholarshipData } from "./types";

type Status = "comingSoon" | "open" | "closed";

/** Today's date (YYYY-MM-DD) in El Paso's time zone. */
const todayInElPaso = (now: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);

/**
 * What the page should show. An "open" scholarship becomes "closed" the day after
 * its deadline (the deadline day itself is still open). "open" without a deadline
 * is treated as "comingSoon": the Studio blocks publishing it, this is the safety net.
 */
export function effectiveStatus(s: ScholarshipData, now: Date = new Date()): Status {
  if (!s || !s.status) return "comingSoon";
  if (s.status !== "open") return s.status;
  if (!s.deadline) return "comingSoon";
  return todayInElPaso(now) > s.deadline ? "closed" : "open";
}
