import { normalizePhone } from "@/lib/patients/normalize";

/**
 * Texting consent belongs to a PHONE NUMBER, not just a person. PURE: unit-tested in scripts/check-phone-prereqs.ts.
 *
 * The newest "sms" record counts only if it says yes AND was given for the number on file now. A record with no number
 * (written before numbers were stored) covers nothing. Changing a number also appends a refusal (./sms-lapse.ts), so
 * changing it back does not bring an old yes back: the family has to agree again.
 *
 * This is the consent question only. Whether a text may be SENT also depends on things the texting feature will check.
 */
export interface SmsConsentRow { type: string; granted: boolean; createdAt: Date; phoneNumber?: string | null }

export function newestSms(rows: SmsConsentRow[]): SmsConsentRow | null {
  let best: SmsConsentRow | null = null;
  for (const r of rows) if (r.type === "sms" && (!best || r.createdAt.getTime() >= best.createdAt.getTime())) best = r;
  return best;
}

export function smsConsentCovers(rows: SmsConsentRow[], phone: string | null | undefined): boolean {
  const r = newestSms(rows);
  const now = normalizePhone(phone);
  return !!r?.granted && !!now && normalizePhone(r.phoneNumber) === now;
}

/** What to show and compare against: null = never asked; true only when the yes covers the current number. */
export const currentSmsConsent = (rows: SmsConsentRow[], phone: string | null | undefined): boolean | null =>
  newestSms(rows) ? smsConsentCovers(rows, phone) : null;

/** A yes is on file but for another (or an unrecorded) number. */
export const smsNeedsReconsent = (rows: SmsConsentRow[], phone: string | null | undefined): boolean =>
  !!newestSms(rows)?.granted && !smsConsentCovers(rows, phone);
