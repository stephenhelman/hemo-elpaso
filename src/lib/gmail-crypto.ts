import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16;

function getKey(): Buffer | null {
  const hex = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!hex) return null;
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) {
    throw new Error(
      "GMAIL_TOKEN_ENCRYPTION_KEY must be a 32-byte (64-char) hex string",
    );
  }
  return buf;
}

/**
 * Encrypt a plaintext token. Returns a base64-encoded string of iv:tag:ciphertext.
 * Falls back to plaintext (with warning) if GMAIL_TOKEN_ENCRYPTION_KEY is not set.
 */
export function encryptToken(plaintext: string): string {
  const key = getKey();
  if (!key) {
    console.warn(
      "[gmail-crypto] GMAIL_TOKEN_ENCRYPTION_KEY not set — storing token in plaintext (dev mode only)",
    );
    return plaintext;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Encode as base64(iv):base64(tag):base64(ciphertext)
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/**
 * Decrypt a token that was encrypted with encryptToken.
 * Falls back to returning the value as-is if no encryption key is set.
 */
export function decryptToken(encrypted: string): string {
  const key = getKey();
  if (!key) {
    console.warn(
      "[gmail-crypto] GMAIL_TOKEN_ENCRYPTION_KEY not set — reading token as plaintext (dev mode only)",
    );
    return encrypted;
  }

  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    // Could be a legacy plain value — return as-is
    return encrypted;
  }

  const [ivB64, tagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
