/** Emails are stored lowercased and trimmed. */
export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const v = input.trim().toLowerCase();
  return v ? v : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(v: string) {
  return v.length <= 254 && EMAIL_RE.test(v);
}

/**
 * Phones are stored as "+1XXXXXXXXXX" for US numbers, otherwise "+<digits>"
 * (when entered with a leading +) or bare digits. Returns null if not usable.
 */
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 10 && digits.length <= 15)
    return raw.startsWith("+") ? `+${digits}` : digits;
  return null;
}

export function cleanText(input: unknown, max: number): string {
  return typeof input === "string" ? input.trim().slice(0, max) : "";
}
