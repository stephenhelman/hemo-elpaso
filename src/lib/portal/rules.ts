/**
 * Family page rules. PURE (no DB, no Next): unit-tested in scripts/check-portal.ts.
 *
 * Consent is append-only. A change is a NEW consent_records row (method "portal", the current text version); nothing is
 * updated. The current value of a type is its newest row.
 */
export const PORTAL_CONSENT_TYPES = ["media", "sms", "newsletter"] as const;
export type PortalConsentType = (typeof PORTAL_CONSENT_TYPES)[number];
export const isPortalConsentType = (t: unknown): t is PortalConsentType =>
  typeof t === "string" && (PORTAL_CONSENT_TYPES as readonly string[]).includes(t);

export interface ConsentRow { type: string; granted: boolean; createdAt: Date }

/** Newest row of a type: true / false, or null if it was never recorded. */
export function currentValue(rows: ConsentRow[], type: string): boolean | null {
  let best: ConsentRow | null = null;
  for (const r of rows) if (r.type === type && (!best || r.createdAt.getTime() >= best.createdAt.getTime())) best = r;
  return best ? best.granted : null;
}

/** Re-saving what is already true writes nothing (the log stays a record of real decisions). */
export function consentChange(rows: ConsentRow[], type: PortalConsentType, granted: boolean): "record" | "noop" {
  return currentValue(rows, type) === granted ? "noop" : "record";
}

/** Max consent changes per person per minute (counted from the audit log, so it holds across serverless instances). */
export const CONSENT_CHANGES_PER_MINUTE = 10;

/**
 * Diagnoses the household page may show: the signed-in primary person's own, and each MINOR's (the primary answers
 * for them). Another ADULT's diagnoses are never shown: adults decide for themselves what to share, and the
 * household union (patients.statedDiagnoses) cannot say whose is whose.
 */
export function visibleDiagnoses(
  primary: string[],
  members: { id: string; ageGroup: string; statedDiagnoses: string[] }[],
): { primary: string[]; minors: Record<string, string[]> } {
  const minors: Record<string, string[]> = {};
  for (const m of members) if (m.ageGroup !== "18_plus" && m.statedDiagnoses.length) minors[m.id] = m.statedDiagnoses;
  return { primary, minors };
}

/** Same-origin check for the one write endpoint: a present Origin must match the Host. */
export function sameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin) return true; // same-origin fetches from older browsers may omit it; the cookie is SameSite=Lax anyway
  try { return !!host && new URL(origin).host === host; } catch { return false; }
}

export interface EventRef { eventDate: Date; endDate: Date | null }
/** Past once it has ended (same idea as lib/rsvp/window): endDate, else 12h after it starts. */
export function isPast(e: EventRef, now = new Date()): boolean {
  const end = e.endDate ?? new Date(e.eventDate.getTime() + 12 * 3600e3);
  return end < now;
}

export type PortalGate = "login" | "no-household" | "coming-soon" | "show";

/**
 * What /portal does for a request. Any signed-in person with a linked household (family OR board mode) may open their
 * OWN page; "none" (signed in, not matched) and board-only people (no household) are sent to /no-household. While the
 * family_portal toggle is off the page is a friendly "coming soon" and loads no household data.
 */
export function portalGate(s: { mode: "board" | "family" | "none"; hasHousehold: boolean } | null, toggleOn: boolean): PortalGate {
  if (!s) return "login";
  if (s.mode === "none" || !s.hasHousehold) return "no-household";
  return toggleOn ? "show" : "coming-soon";
}
