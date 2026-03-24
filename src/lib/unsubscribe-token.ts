import crypto from "crypto";

const SECRET = process.env.CRON_SECRET || "dev-secret";

/**
 * Generate an HMAC-signed unsubscribe token for a patient.
 * Format: base64url(patientId:signature)
 */
export function generateUnsubscribeToken(patientId: string): string {
  const sig = crypto
    .createHmac("sha256", SECRET)
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
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const colonIdx = raw.lastIndexOf(":");
    if (colonIdx < 0) return null;
    const patientId = raw.slice(0, colonIdx);
    const sig = raw.slice(colonIdx + 1);
    const expected = crypto
      .createHmac("sha256", SECRET)
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
