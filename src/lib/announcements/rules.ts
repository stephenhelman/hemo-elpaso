/**
 * Which announcements are live at a given moment. PURE (no DB, no Next, no Sanity client).
 *
 * Time is decided HERE, per request, never inside GROQ: Sanity responses are cached, so a query using now() would keep
 * showing an announcement after it ended.
 *
 * Two sources:
 *  1. `announcement` documents written in the Studio.
 *  2. Automatic ones, derived from conferences with "Announce when registration opens". Nothing is written to Sanity,
 *     so editing a conference's dates takes effect on its own.
 */
import { siteDateKey, siteDayRangeUtc } from "@/lib/datetime";
import { eventHasEnded, eventEndsAt } from "@/lib/rsvp/window";
import { INTERNAL_ROUTES } from "@/sanity/options";
import {
  CONFERENCE_SLUG, conferenceAnchor, conferenceIsUpcoming, instant, isDateKey, safeHttpsUrl,
} from "@/sanity/helpers/conferences";
import { announcementTranslation } from "@/translation/announcements";
import type { AnnouncementData, AnnouncementsData } from "@/sanity/types";
import type { Localized } from "@/sanity/helpers/pick";
import type { PublicAnnouncement } from "./display";

/** Where automatic conference announcements sort among hand-written ones (the Studio default is the same). */
export const DEFAULT_ORDER = 100;

export interface EventRow {
  slug: string;
  status: string;
  allowUninvitedRequests: boolean;
  eventDate: Date | string;
  endDate: Date | string | null;
}

/**
 * Events an announcement may point at: published, open to requests from uninvited households, and not over.
 * By-invitation events are excluded. Returns slug -> the moment the event ends.
 */
export function eligibleEvents(rows: EventRow[], now: Date): Map<string, number> {
  return new Map(
    rows
      .filter((e) => e.status === "published" && e.allowUninvitedRequests === true && !eventHasEnded(e, now))
      .map((e) => [e.slug, eventEndsAt(e).getTime()]),
  );
}

export const referencedEventSlugs = (data: AnnouncementsData): string[] =>
  Array.from(
    new Set(
      (data.announcements ?? [])
        .filter((a) => a.target?.kind === "event")
        .map((a) => a.target!.eventSlug?.trim())
        .filter((s): s is string => !!s),
    ),
  );

interface Resolved { href: string; external: boolean; organizer?: string; until?: number }
interface Context { events: Map<string, number>; hasConferenceSection: boolean; registrationOpen: boolean; now: Date }

const dayStart = (key: string) => siteDayRangeUtc(key).start.getTime();
const dayEnd = (key: string) => siteDayRangeUtc(key).end.getTime();

/** The link of a hand-written announcement, or null when it must not be shown at all. */
function resolveTarget(target: AnnouncementData["target"], ctx: Context): Resolved | null {
  switch (target?.kind) {
    case "page": {
      const page = target.page;
      if (!page || !INTERNAL_ROUTES.some(([p]) => p === page)) return null;
      if (page === "/register-info" && !ctx.registrationOpen) return null;
      return { href: page, external: false };
    }
    case "event": {
      const slug = target.eventSlug?.trim();
      const until = slug ? ctx.events.get(slug) : undefined;
      return until == null ? null : { href: `/events/${encodeURIComponent(slug!)}`, external: false, until };
    }
    case "conference": {
      const c = target.conference;
      // The card on /resources must exist, and the announcement must be able to name the organizer.
      if (!ctx.hasConferenceSection || !c || c.active !== true || !c.organizer || !c.slug || !CONFERENCE_SLUG.test(c.slug)) return null;
      if (!isDateKey(c.endDate) || !conferenceIsUpcoming(c.endDate, ctx.now)) return null;
      return { href: `/resources#${conferenceAnchor(c.slug)}`, external: false, organizer: c.organizer, until: dayEnd(c.endDate) };
    }
    case "external": {
      const url = safeHttpsUrl(target.url);
      return url ? { href: url, external: true } : null;
    }
    default:
      return null;
  }
}

const hasEnglish = (f: Localized) => !!f?.en?.trim();

type Ranked = PublicAnnouncement & { order: number };

function written(data: AnnouncementsData, ctx: Context): Ranked[] {
  const t = ctx.now.getTime();
  return (data.announcements ?? []).flatMap((a): Ranked[] => {
    const starts = instant(a.startsAt), ends = instant(a.endsAt);
    if (!hasEnglish(a.title) || starts == null || ends == null || t < starts || t >= ends) return [];
    const target = resolveTarget(a.target, ctx);
    if (!target) return [];
    const until = Math.min(ends, target.until ?? ends);
    if (t >= until) return [];
    return [{
      key: a._id, title: a.title, text: a.text ?? undefined, buttonLabel: a.buttonLabel ?? undefined, organizer: target.organizer,
      href: target.href, external: target.external, endsAt: new Date(until).toISOString(), order: a.order ?? DEFAULT_ORDER,
    }];
  });
}

/** Live from the moment registration opens until it closes (or, with no closing date, until the first conference day). */
function automatic(data: AnnouncementsData, ctx: Context): Ranked[] {
  if (!ctx.hasConferenceSection) return [];
  const t = ctx.now.getTime();
  return (data.conferences ?? []).flatMap((c): Ranked[] => {
    const opens = instant(c.registrationOpensAt);
    if (!c.slug || !CONFERENCE_SLUG.test(c.slug) || !c.organizer || !hasEnglish(c.name) || opens == null) return [];
    if (!isDateKey(c.startDate) || !isDateKey(c.endDate) || !conferenceIsUpcoming(c.endDate, ctx.now)) return [];
    const until = Math.min(instant(c.registrationClosesAt) ?? dayStart(c.startDate), dayEnd(c.endDate));
    if (t < opens || t >= until) return [];
    const { en, es } = announcementTranslation;
    const name = c.name!;
    return [{
      // The opening DAY is part of the key: a new registration period is announced again; fixing the hour is not.
      key: `conference:${c._id}:${siteDateKey(opens)}`,
      title: hasEnglish(c.announcementTitle)
        ? c.announcementTitle
        : { en: en.registrationOpen(name.en!), es: es.registrationOpen(name.es?.trim() || name.en!) },
      text: c.announcementText ?? undefined,
      organizer: c.organizer,
      href: `/resources#${conferenceAnchor(c.slug)}`,
      external: false,
      endsAt: new Date(until).toISOString(),
      order: DEFAULT_ORDER,
    }];
  });
}

export function buildAnnouncements(input: { data: AnnouncementsData; events: EventRow[]; registrationOpen: boolean; now: Date }): PublicAnnouncement[] {
  const ctx: Context = {
    events: eligibleEvents(input.events, input.now),
    hasConferenceSection: input.data.hasConferenceSection === true,
    registrationOpen: input.registrationOpen,
    now: input.now,
  };
  // Lower order first, then whatever ends soonest.
  return [...written(input.data, ctx), ...automatic(input.data, ctx)]
    .sort((a, b) => a.order - b.order || a.endsAt.localeCompare(b.endsAt) || a.key.localeCompare(b.key))
    .map(({ order: _order, ...a }) => a);
}
