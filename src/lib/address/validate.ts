/** Structured US address. PURE (no DB, no Next): unit-tested in scripts/check-address.ts. */
import { isStateCode } from "./states";

export interface Address { line1: string; line2: string | null; city: string; state: string; zip: string }
export type AddressResult = { ok: true; value: Address | null } | { ok: false; field: "addressLine1" | "city" | "state" | "zip" };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/**
 * Street line 1, line 2 (optional), city, state (US dropdown), ZIP (exactly 5 digits).
 * Every field empty = no address (null). Anything entered needs line 1, city, state and ZIP. The state alone does not
 * count as "entered": the form pre-selects TX.
 */
export function parseAddress(input: unknown): AddressResult {
  const i = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const line1 = clean(i.line1, 200);
  const line2 = clean(i.line2, 100);
  const city = clean(i.city, 100);
  const state = clean(i.state, 2).toUpperCase();
  const zip = clean(i.zip, 10);
  if (!line1 && !line2 && !city && !zip) return { ok: true, value: null };
  if (!line1) return { ok: false, field: "addressLine1" };
  if (!city) return { ok: false, field: "city" };
  if (!isStateCode(state)) return { ok: false, field: "state" };
  if (!/^\d{5}$/.test(zip)) return { ok: false, field: "zip" };
  return { ok: true, value: { line1, line2: line2 || null, city, state, zip } };
}

/** Columns for ContactProfile (addressLine1/2, city, state, zipCode). */
export const addressColumns = (a: Address | null) => ({
  addressLine1: a?.line1 ?? null, addressLine2: a?.line2 ?? null, city: a?.city ?? null, state: a?.state ?? null, zipCode: a?.zip ?? null,
});

const SYNONYMS: Record<string, string> = {
  street: "st", avenue: "ave", av: "ave", boulevard: "blvd", drive: "dr", road: "rd", lane: "ln", court: "ct", circle: "cir", place: "pl",
  apartment: "apt", suite: "ste", unit: "apt", number: "", no: "", north: "n", south: "s", east: "e", west: "w",
};

/**
 * Normalized key for "same address" duplicate matching: street lines + ZIP, lowercase letters and digits only, with the
 * common street suffixes and unit words unified. Null when there is nothing usable (no digit = not a street address).
 * Free-text addresses use the same key (the whole text is in line 1).
 */
export function addressKey(a: { addressLine1: string | null; addressLine2?: string | null; zipCode?: string | null }): string | null {
  const text = `${a.addressLine1 ?? ""} ${a.addressLine2 ?? ""}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const words = text.replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean).map((w) => SYNONYMS[w] ?? w);
  const body = words.join("");
  if (!/\d/.test(body) || body.length < 5) return null;
  const zip = (a.zipCode ?? "").trim();
  return zip ? `${body}|${zip}` : body;
}
