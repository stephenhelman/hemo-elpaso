/**
 * ZIP -> city/state from the BUNDLED table (src/lib/address/zip-data.json, built by scripts/build-zip-data.ts).
 * No network call and no third party: the table is a separate chunk the browser loads the first time someone types a
 * ZIP, and the lookup happens entirely in the page.
 */
export interface ZipData { c: string[]; s: string[]; z: Record<string, number> }
export interface ZipHit { city: string; state: string }

/** Pure decode, exported for tests. Anything that is not exactly 5 digits, or unknown, is null. */
export function decodeZip(data: ZipData, zip: string): ZipHit | null {
  if (!/^\d{5}$/.test(zip)) return null;
  const v = data.z[zip];
  if (v === undefined) return null;
  return { city: data.c[Math.floor(v / 100)], state: data.s[v % 100] };
}

export async function lookupZip(zip: string): Promise<ZipHit | null> {
  if (!/^\d{5}$/.test(zip)) return null;
  const data = (await import("./zip-data.json")).default as ZipData;
  return decodeZip(data, zip);
}
