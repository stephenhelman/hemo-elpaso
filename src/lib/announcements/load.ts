/**
 * Loading the live announcements: toggle first, then content, then the events they point at. Side effects injected
 * (see ./service). Never throws: this runs in the public layout, where a failure would take down every page.
 */
import type { AnnouncementsData } from "@/sanity/types";
import { buildAnnouncements, referencedEventSlugs, type EventRow } from "./rules";
import type { PublicAnnouncement } from "./display";

export interface LoadDeps {
  enabled: () => Promise<boolean>;
  fetchContent: () => Promise<AnnouncementsData>;
  findEvents: (slugs: string[]) => Promise<EventRow[]>;
  registrationOpen: () => boolean;
  onError: (stage: "events" | "load", error: unknown) => void;
}

export async function loadAnnouncements(deps: LoadDeps, now: Date = new Date()): Promise<PublicAnnouncement[]> {
  try {
    if (!(await deps.enabled())) return [];
    const data = await deps.fetchContent();
    const slugs = referencedEventSlugs(data);
    // If events cannot be read, announcements that need them are dropped; the rest still show.
    const events = slugs.length
      ? await deps.findEvents(slugs).catch((e) => {
          deps.onError("events", e);
          return [] as EventRow[];
        })
      : [];
    return buildAnnouncements({ data, events, registrationOpen: deps.registrationOpen(), now });
  } catch (e) {
    deps.onError("load", e);
    return [];
  }
}
