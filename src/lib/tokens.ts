import crypto from "crypto";

/**
 * Opaque, single-purpose tokens (RSVP links, check-in QR).
 * 32 random bytes, base64url. Only the SHA-256 hash is stored; the raw value
 * exists only in the email link / QR payload that was handed to the patient.
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** Cheap shape check before hitting the DB (43 chars for 32 bytes). */
export function looksLikeToken(raw: unknown): raw is string {
  return typeof raw === "string" && /^[A-Za-z0-9_-]{43,64}$/.test(raw);
}
