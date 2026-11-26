import { defineField, defineType } from "sanity";
import { SITE_TIMEZONE } from "@/lib/site";
import { formatInSiteZone } from "@/lib/datetime";
import { INTERNAL_ROUTES } from "../../options";
import { safeHttpsUrl } from "../../helpers/conferences";
import { PUBLIC_TEXT_WARNING } from "../../helpers/warnings";

const denver = { displayTimeZone: SITE_TIMEZONE, allowTimeZoneSwitch: false };

const KINDS = [
  { title: "Page on this site", value: "page" },
  { title: "HOEP event", value: "event" },
  { title: "Conference", value: "conference" },
  { title: "External website", value: "external" },
];

const only = (kind: string) => ({ parent }: { parent?: any }) => parent?.kind !== kind;

/** The field required by each kind of target, and what to say when it is empty. */
const REQUIRED: Record<string, [string, string]> = {
  page: ["page", "Choose a page."],
  event: ["eventSlug", "Enter the event's web address name."],
  conference: ["conference", "Choose a conference."],
  external: ["url", "Enter the https:// address."],
};

/**
 * Asks the site's PUBLIC events list (the same one the home page uses) whether the event can be linked. Advice only:
 * the website checks again on every request, including the by-invitation rule, which this list does not reveal.
 */
async function eventWarning(slug: string): Promise<true | string> {
  try {
    const res = await fetch("/api/events");
    if (!res.ok) return true;
    const { upcoming } = (await res.json()) as { upcoming?: { slug: string }[] };
    return (upcoming ?? []).some((e) => e.slug === slug) || "No upcoming published event has this name, so the announcement will not show.";
  } catch {
    return true;
  }
}

export const announcement = defineType({
  name: "announcement",
  title: "Announcement",
  type: "document",
  description: `A small card shown on public pages between its start and end. ${PUBLIC_TEXT_WARNING}`,
  fields: [
    defineField({ name: "title", type: "localizedString", description: PUBLIC_TEXT_WARNING, validation: (r) => r.required() }),
    defineField({ name: "text", title: "Short text (optional)", type: "localizedText", description: PUBLIC_TEXT_WARNING }),
    defineField({
      name: "buttonLabel",
      title: "Link label (optional)",
      type: "localizedString",
      description: "Empty = Learn more / Más información.",
    }),
    defineField({
      name: "target",
      title: "Links to",
      type: "object",
      fields: [
        defineField({ name: "kind", title: "Type", type: "string", initialValue: "page", options: { layout: "radio", list: KINDS } }),
        defineField({
          name: "page",
          type: "string",
          hidden: only("page"),
          options: { list: INTERNAL_ROUTES.map(([value, title]) => ({ title, value })) },
        }),
        defineField({
          name: "eventSlug",
          title: "Event web address name",
          type: "string",
          hidden: only("event"),
          description:
            "The last part of the event's address: /events/<this>. The announcement shows only while the event is published, open to requests (by-invitation events never show) and not over.",
          validation: (r) => [
            r.custom((v: any) => !v || !/[\/\s]/.test(v) || "Only the last part of the address: no slashes or spaces."),
            r.custom((v: any, ctx: any) => (v && ctx.parent?.kind === "event" ? eventWarning(v) : true)).warning(),
          ],
        }),
        defineField({
          name: "conference",
          type: "reference",
          to: [{ type: "conference" }],
          hidden: only("conference"),
          options: { filter: "active == true" },
          description: "Links to its card on the Resources page and shows the organizer's name. While this announcement is live, it replaces the conference's automatic registration announcement.",
        }),
        defineField({
          name: "url",
          title: "Address",
          type: "url",
          hidden: only("external"),
          validation: (r) => r.uri({ scheme: ["https"] }).custom((v) => !v || !!safeHttpsUrl(v) || "Must start with https://"),
        }),
      ],
      validation: (r) =>
        r.required().custom((v: any) => {
          const need = REQUIRED[v?.kind];
          if (!need) return "Choose what the announcement links to.";
          return v[need[0]] ? true : need[1];
        }),
    }),
    defineField({
      name: "startsAt",
      title: "Show from (El Paso time)",
      type: "datetime",
      options: denver,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "endsAt",
      title: "Show until (El Paso time)",
      type: "datetime",
      options: denver,
      validation: (r) =>
        r.required().custom((v: any, ctx: any) => {
          const from = ctx.document?.startsAt;
          return !v || !from || Date.parse(v) > Date.parse(from) || "Must be after the start.";
        }),
    }),
    defineField({ name: "order", type: "number", initialValue: 100, description: "Lower numbers first. Automatic conference announcements count as 100." }),
    defineField({ name: "active", title: "Show on site", type: "boolean", initialValue: true }),
  ],
  orderings: [{ title: "Newest start first", name: "start", by: [{ field: "startsAt", direction: "desc" }] }],
  preview: {
    select: { title: "title.en", start: "startsAt", end: "endsAt", active: "active" },
    prepare: ({ title, start, end, active }: any) => {
      const day = (v?: string) => (v ? formatInSiteZone(v, "en", { month: "short", day: "numeric", year: "numeric" }) : "?");
      const ended = !!end && Date.parse(end) <= Date.now();
      return { title, subtitle: [`${day(start)} to ${day(end)}`, ended ? "ended" : null, active === false ? "hidden" : null].filter(Boolean).join(" · ") };
    },
  },
});
