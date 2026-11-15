import "server-only";
import { client } from "./client";
import { sponsorFragment } from "./queries/fragments";
import type { SponsorData } from "./types";

/** Admin multi-select: name + id of every ACTIVE sponsor, in the Studio order. Empty list if Sanity is unreachable. */
export async function getActiveSponsorOptions(): Promise<{ id: string; name: string }[]> {
  try {
    const rows = await client.fetch<{ _id: string; name: string }[]>(
      `*[_type == "sponsor" && active == true]|order(order asc, name asc){ _id, name }`,
      {},
      { next: { tags: ["sponsor"], revalidate: 300 } },
    );
    return (rows ?? []).map((r) => ({ id: r._id, name: r.name }));
  } catch (err) {
    console.error("[sponsors] options fetch failed", (err as Error)?.message);
    return [];
  }
}

/**
 * Public: the sponsors an event lists, in the order they were chosen. Missing, deleted or inactive ones are
 * skipped (the query only returns active documents, so a sponsor switched off in the Studio just disappears).
 */
export async function getSponsorsByIds(ids: string[]): Promise<SponsorData[]> {
  const clean = ids.filter((i) => /^[A-Za-z0-9._-]{1,128}$/.test(i));
  if (clean.length === 0) return [];
  try {
    const rows = await client.fetch<SponsorData[]>(
      `*[_type == "sponsor" && active == true && _id in $ids]{ ${sponsorFragment} }`,
      { ids: clean },
      { next: { tags: ["sponsor"], revalidate: 3600 } },
    );
    const byId = new Map((rows ?? []).map((r) => [r._id, r]));
    return clean.map((i) => byId.get(i)).filter((r): r is SponsorData => !!r);
  } catch (err) {
    console.error("[sponsors] fetch by ids failed", (err as Error)?.message);
    return [];
  }
}
