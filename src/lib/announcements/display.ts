/**
 * What the announcement card shows in the browser. PURE and client-safe.
 *
 * Dismissals live on the visitor's device only (localStorage) and hold announcement keys, nothing about a person.
 * Nothing here is ever sent to HOEP or anyone else (privacy policy, "Site announcements").
 */
import type { Localized } from "@/sanity/helpers/pick";

/** Everything an announcement carries to the browser. Built on the server (./rules). */
export interface PublicAnnouncement {
  /** Stable id used to remember a dismissal. */
  key: string;
  title: Localized;
  text?: Localized;
  buttonLabel?: Localized;
  /** Set for conferences: they are run by someone other than HOEP. */
  organizer?: string;
  href: string;
  external: boolean;
  /** ISO instant after which it must disappear, even in a tab left open. */
  endsAt: string;
}

/** Signed-in family pages and single-task pages: no card. (Admin has its own root layout and never mounts it.) */
export const HIDDEN_PREFIXES = [
  "/admin", "/portal", "/rsvp", "/confirm", "/unsubscribe", "/register-info", "/no-household", "/access-denied",
] as const;

export const hiddenOnPath = (pathname: string) => HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

/** True on the page the announcement links to. An event's own sub-pages count as that event. */
export function pointsHere(a: Pick<PublicAnnouncement, "href" | "external">, pathname: string): boolean {
  if (a.external) return false;
  const target = decode(a.href.split(/[?#]/)[0] || "/");
  const here = decode(pathname);
  return here === target || (target.startsWith("/events/") && here.startsWith(target + "/"));
}

export function visibleAnnouncements(
  list: PublicAnnouncement[],
  { pathname, dismissed, now }: { pathname: string; dismissed: string[]; now: number },
): PublicAnnouncement[] {
  if (hiddenOnPath(pathname)) return [];
  return list.filter((a) => Date.parse(a.endsAt) > now && !dismissed.includes(a.key) && !pointsHere(a, pathname));
}

export const DISMISSED_STORAGE_KEY = "hoep.dismissedAnnouncements";
/** Oldest dismissals are forgotten beyond this, so the entry cannot grow without limit. */
export const MAX_DISMISSED = 50;

/** Anything unreadable counts as "nothing dismissed". */
export function parseDismissed(raw: string | null | undefined): string[] {
  try {
    const v: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(v) ? v.filter((k): k is string => typeof k === "string").slice(-MAX_DISMISSED) : [];
  } catch {
    return [];
  }
}

export const addDismissed = (list: string[], key: string): string[] => [...list.filter((k) => k !== key), key].slice(-MAX_DISMISSED);
