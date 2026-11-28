/**
 * A voicemail caller's number, protected. Stored ENCRYPTED, plus a keyed hash that limits messages per caller and finds
 * a caller's messages when they ask us to delete them. Both need PHONE_DATA_KEY (64 hex characters:
 * `openssl rand -hex 32`). Without it no voicemail is offered: nothing is ever stored unprotected.
 * PURE (reads only the environment it is given).
 */
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { maskNumber, toUsE164 } from "@/lib/twilio/mode";

type Env = Record<string, string | undefined>;

function key(env: Env, purpose: "encrypt" | "hash"): Buffer | null {
  const hex = env.PHONE_DATA_KEY?.trim() ?? "";
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null;
  return createHmac("sha256", Buffer.from(hex, "hex")).update(`hoep.phone.${purpose}`).digest(); // one key, two uses
}

export const callerDataReady = (env: Env = process.env): boolean => !!key(env, "encrypt");

/** What the phone network sends instead of a number when the caller hides it or it is unknown. */
const HIDDEN = new Set(["+266696687", "+7378742833", "+2562533", "+8656696"]);

/** The caller's number in E.164 form (any country: families call from across the border), or null if hidden. */
export function callerNumber(from: string | undefined): string | null {
  const n = (from ?? "").trim();
  return /^\+[1-9]\d{7,14}$/.test(n) && !HIDDEN.has(n) ? n : null;
}

/** For reading and dialing: "(915) 555-0100" for US numbers, otherwise as stored, with the "+". */
export const displayNumber = (e164: string): string => e164.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3");

/** A number a board member types, to find that caller's messages. US numbers in any form, others with the "+". */
export function typedNumber(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const compact = input.replace(/[\s().-]/g, "");
  return toUsE164(input) ?? (/^\+[2-9]\d{7,14}$/.test(compact) ? compact : null);
}

export function callerHash(number: string | null, env: Env = process.env): string | null {
  const k = key(env, "hash");
  return k ? createHmac("sha256", k).update(number ?? "hidden").digest("hex") : null;
}

export function encryptCaller(number: string, env: Env = process.env): string | null {
  const k = key(env, "encrypt");
  if (!k) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const data = Buffer.concat([cipher.update(number, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(":");
}

/** Null if there is none or it can't be read (the key changed). */
export function decryptCaller(stored: string | null, env: Env = process.env): string | null {
  const k = key(env, "encrypt");
  if (!k || !stored) return null;
  try {
    const [iv, tag, data] = stored.split(":").map((p) => Buffer.from(p, "base64"));
    const d = createDecipheriv("aes-256-gcm", k, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(data), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/**
 * The form of a caller's number used everywhere except one place: the full number is shown only when the President or
 * Vice President asks for it on the Voicemail page (./voicemail-board.ts revealCaller, audited).
 */
export function maskedCaller(stored: string | null, env: Env = process.env): string | null {
  const n = decryptCaller(stored, env);
  return n ? maskNumber(n) : null;
}
