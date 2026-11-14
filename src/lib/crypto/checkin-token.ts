import crypto from "crypto";

/**
 * Encrypted copy of an RSVP's check-in token (AES-256-GCM, same pattern as the
 * old gmail-crypto): lookup uses the SHA-256 hash, the encrypted copy only lets
 * us re-send the SAME QR. Format: base64(iv):base64(tag):base64(ciphertext).
 *
 * Env: CHECKIN_TOKEN_KEY = 32 bytes as 64 hex chars (openssl rand -hex 32).
 * In production a missing/invalid key throws (never stores plaintext); outside
 * production a missing key falls back to a clearly-marked plaintext value.
 */
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer | null {
  const hex = process.env.CHECKIN_TOKEN_KEY;
  if (!hex) {
    if (process.env.NODE_ENV === "production") throw new Error("CHECKIN_TOKEN_KEY is not set");
    return null;
  }
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) throw new Error("CHECKIN_TOKEN_KEY must be 32 bytes (64 hex chars)");
  return buf;
}

export function encryptCheckInToken(plaintext: string): string {
  const key = getKey();
  if (!key) {
    console.warn("[checkin-token] CHECKIN_TOKEN_KEY not set: storing token UNENCRYPTED (non-production only)");
    return `plain:${plaintext}`;
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), enc.toString("base64")].join(":");
}

/** Returns null if it can't be decrypted (wrong/rotated key, corrupt value). */
export function decryptCheckInToken(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (stored.startsWith("plain:")) return process.env.NODE_ENV === "production" ? null : stored.slice(6);
  try {
    const key = getKey();
    if (!key) return null;
    const [iv, tag, enc] = stored.split(":").map((p) => Buffer.from(p, "base64"));
    const d = crypto.createDecipheriv(ALGORITHM, key, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
