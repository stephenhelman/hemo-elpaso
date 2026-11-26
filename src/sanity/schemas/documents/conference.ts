import { defineField, defineType } from "sanity";
import { SITE_TIMEZONE } from "@/lib/site";
import { INTERNAL_ROUTES } from "../../options";
import {
  CONFERENCE_SLUG, CONFERENCE_STALE_AFTER_DAYS, closedButShown, safeHttpsUrl, verificationIsStale,
} from "../../helpers/conferences";
import { PUBLIC_TEXT_WARNING } from "../../helpers/warnings";

/** Times are entered and shown in El Paso time, whatever zone the editor's computer is in. Stored as UTC. */
const denver = { displayTimeZone: SITE_TIMEZONE, allowTimeZoneSwitch: false };

const httpsOnly = (v: unknown) => !v || !!safeHttpsUrl(v) || "Must start with https://";

export const conference = defineType({
  name: "conference",
  title: "Conference",
  type: "document",
  description:
    "A conference run by ANOTHER organization that HOEP shares with the community. HOEP does not take registrations for it.",
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "registration", title: "Registration" },
    { name: "travel", title: "Travel assistance" },
  ],
  fields: [
    defineField({ name: "name", type: "localizedString", group: "details", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      title: "Web address name",
      type: "slug",
      group: "details",
      description: "Used in the link /resources#conference-<this>. Do not change it after publishing: shared links would stop working.",
      options: { source: "name.en", maxLength: 80 },
      validation: (r) =>
        r.required().custom((v: any) => !v?.current || CONFERENCE_SLUG.test(v.current) || "Lowercase letters, numbers and single hyphens only."),
    }),
    defineField({
      name: "organizer",
      type: "string",
      group: "details",
      description: "The organization that runs it. Shown as “Hosted by …”.",
      validation: (r) => r.required(),
    }),
    defineField({ name: "summary", type: "localizedText", group: "details", validation: (r) => r.required() }),
    defineField({ name: "startDate", title: "First day", type: "date", group: "details", validation: (r) => r.required() }),
    defineField({
      name: "endDate",
      title: "Last day",
      type: "date",
      group: "details",
      description: "Same as the first day for a one-day conference. The site hides the conference the day after (El Paso time).",
      validation: (r) =>
        r.required().custom((v: any, ctx: any) => !v || !ctx.document?.startDate || v >= ctx.document.startDate || "The last day can't be before the first day."),
    }),
    defineField({ name: "venue", type: "string", group: "details", description: "Hotel or convention centre (optional)." }),
    defineField({ name: "city", type: "string", group: "details" }),
    defineField({ name: "state", title: "State or region", type: "string", group: "details" }),
    defineField({
      name: "attendanceMode",
      title: "How people attend",
      type: "string",
      group: "details",
      initialValue: "inPerson",
      options: {
        layout: "radio",
        list: [
          { title: "In person", value: "inPerson" },
          { title: "Online", value: "virtual" },
          { title: "In person and online", value: "hybrid" },
        ],
      },
    }),
    defineField({
      name: "websiteUrl",
      title: "Conference website",
      type: "url",
      group: "details",
      validation: (r) => r.required().uri({ scheme: ["https"] }).custom(httpsOnly),
    }),
    defineField({
      name: "registrationUrl",
      title: "Registration page",
      type: "url",
      group: "registration",
      description: "The organizer's registration page (optional). Opens in a new tab.",
      validation: (r) => r.uri({ scheme: ["https"] }).custom(httpsOnly),
    }),
    defineField({
      name: "registrationOpensAt",
      title: "Registration opens (El Paso time)",
      type: "datetime",
      group: "registration",
      options: denver,
      validation: (r) =>
        r.custom((v, ctx: any) => !!v || !ctx.document?.announceRegistration || "Needed to announce when registration opens."),
    }),
    defineField({
      name: "registrationClosesAt",
      title: "Registration closes (El Paso time)",
      type: "datetime",
      group: "registration",
      options: denver,
      validation: (r) => [
        r.custom((v: any, ctx: any) => {
          const opens = ctx.document?.registrationOpensAt;
          return !v || !opens || Date.parse(v) > Date.parse(opens) || "Registration must close after it opens.";
        }),
        r.custom((v: any, ctx: any) =>
          closedButShown(v, ctx.document?.active) ? "Registration has closed and this conference is still shown. Check the dates, or turn off “Show on site”." : true,
        ).warning(),
      ],
    }),
    defineField({
      name: "announceRegistration",
      title: "Announce when registration opens",
      type: "boolean",
      group: "registration",
      initialValue: false,
      description: "Shows a site announcement while registration is open (until the first day if there is no closing date). Needs the Site announcements feature switched on and the Conference list on the Resources page.",
    }),
    defineField({
      name: "announcementTitle",
      title: "Announcement title (optional)",
      type: "localizedString",
      group: "registration",
      description: `${PUBLIC_TEXT_WARNING} Empty = “Registration is open: <name>”.`,
      hidden: ({ document }) => !document?.announceRegistration,
    }),
    defineField({
      name: "announcementText",
      title: "Announcement text (optional)",
      type: "localizedText",
      group: "registration",
      description: PUBLIC_TEXT_WARNING,
      hidden: ({ document }) => !document?.announceRegistration,
    }),
    defineField({
      name: "travelAssistance",
      title: "HOEP offers travel assistance",
      type: "boolean",
      group: "travel",
      initialValue: false,
      description: "Shows “HOEP travel assistance available” on the card. The site does not collect requests.",
    }),
    defineField({
      name: "travelAssistanceNote",
      title: "Note (optional)",
      type: "localizedText",
      group: "travel",
      description: "Public. What the help covers and how to ask. Nothing about any individual family or person's health.",
      hidden: ({ document }) => !document?.travelAssistance,
    }),
    defineField({
      name: "travelAssistanceDeadline",
      title: "Last day to ask (optional)",
      type: "date",
      group: "travel",
      description: "The travel assistance notice is hidden the day after (El Paso time).",
      hidden: ({ document }) => !document?.travelAssistance,
    }),
    defineField({
      name: "travelAssistanceLink",
      title: "Link (optional)",
      type: "object",
      group: "travel",
      description: "A page on this site (for example /contact) or an https:// address.",
      hidden: ({ document }) => !document?.travelAssistance,
      fields: [
        defineField({
          name: "type",
          type: "string",
          initialValue: "internal",
          options: {
            layout: "radio",
            list: [
              { title: "Page on this site", value: "internal" },
              { title: "External website", value: "external" },
            ],
          },
        }),
        defineField({ name: "value", title: "Page path or address", type: "string" }),
      ],
      validation: (r) =>
        r.custom((v: any) => {
          if (!v?.value) return true;
          if (v.type === "external") return httpsOnly(v.value);
          return INTERNAL_ROUTES.some(([p]) => p === v.value) || "Use one of: " + INTERNAL_ROUTES.map(([p]) => p).join(", ");
        }),
    }),
    defineField({ name: "active", title: "Show on site", type: "boolean", group: "details", initialValue: true }),
    defineField({
      name: "lastVerified",
      title: "Last verified",
      type: "date",
      group: "details",
      description: `The date someone last checked dates, links and travel details with the organizer. A warning appears after ${CONFERENCE_STALE_AFTER_DAYS} days.`,
      validation: (r) => [
        r.required(),
        r.custom((v) =>
          v && verificationIsStale(v) ? `Last checked more than ${CONFERENCE_STALE_AFTER_DAYS} days ago. Check it and update this date.` : true,
        ).warning(),
      ],
    }),
  ],
  orderings: [
    { title: "First day", name: "startDate", by: [{ field: "startDate", direction: "asc" }] },
    { title: "Least recently verified", name: "stale", by: [{ field: "lastVerified", direction: "asc" }] },
  ],
  preview: {
    select: {
      title: "name.en", organizer: "organizer", start: "startDate", verified: "lastVerified",
      active: "active", closes: "registrationClosesAt",
    },
    prepare: ({ title, organizer, start, verified, active, closes }: any) => ({
      title,
      subtitle: [
        organizer,
        start,
        verified ? `verified ${verified}` : "NEVER VERIFIED",
        verificationIsStale(verified) ? "⚠ CHECK" : null,
        closedButShown(closes, active) ? "⚠ REGISTRATION CLOSED" : null,
        active === false ? "hidden" : null,
      ].filter(Boolean).join(" · "),
    }),
  },
});
