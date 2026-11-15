/** Sanity document ids chosen for an event: strings of a safe shape, de-duplicated, at most 24. */
export function cleanSponsorIds(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const ids = input.filter((v): v is string => typeof v === "string" && /^[A-Za-z0-9._-]{1,128}$/.test(v));
  return Array.from(new Set(ids)).slice(0, 24);
}
