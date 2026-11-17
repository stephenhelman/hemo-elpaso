import type { SponsorData } from "../types";

/** Drops dangling references (null) and sponsors switched off in the Studio. Order is kept. */
export const visibleSponsors = (list: (SponsorData | null)[] | null | undefined): SponsorData[] =>
  (list ?? []).filter((s): s is SponsorData => !!s && s.active !== false);
