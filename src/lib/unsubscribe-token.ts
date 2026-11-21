import crypto from "crypto";

/**
 * HMAC key. Read at call time (not import time) so a build without the variable still works, but a PRODUCTION
 * server with no CRON_SECRET refuses to sign or verify: a known fallback key would let anyone forge unsubscribe links.
 * The "dev-secret" fallback exists only outside production.
 */
function getSecret(): string {
  const s = process.env.CRON_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("CRON_SECRET is not set (needed to sign unsubscribe links)");
  return "dev-secret";
}

/**
 * Generate an HMAC-signed unsubscribe token for a patient.
 * Format: base64url(patientId:signature)
 */
export function generateUnsubscribeToken(patientId: string): string {
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(patientId)
    .digest("hex");
  const raw = `${patientId}:${sig}`;
  return Buffer.from(raw).toString("base64url");
}

/**
 * Verify a signed unsubscribe token.
 * Returns the patientId if valid, null otherwise.
 */
export function verifyUnsubscribeToken(token: string): string | null {
  const secret = getSecret(); // throws in production when unset (deliberately outside the try)
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const colonIdx = raw.lastIndexOf(":");
    if (colonIdx < 0) return null;
    const patientId = raw.slice(0, colonIdx);
    const sig = raw.slice(colonIdx + 1);
    const expected = crypto
      .createHmac("sha256", secret)
      .update(patientId)
      .digest("hex");
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
    return patientId;
  } catch {
    return null;
  }
}
