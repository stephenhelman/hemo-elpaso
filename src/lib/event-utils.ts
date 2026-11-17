import { isPast, isFuture, formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Lang } from "@/types";
import { formatEventDate as fmtDate, formatEventTime as fmtTime, formatInSiteZone, siteDayOfMonth } from "@/lib/datetime";

// Serializable event shape — all Date fields converted to ISO strings so this
// can be safely passed from a Server Component to a Client Component.
export interface SerializedEvent {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  flyerEnUrl: string | null;
  flyerEsUrl: string | null;
  eventDate: string;
  location: string;
  maxCapacity: number | null;
  rsvpDeadline: string | null;
  status: string;
  category: string;
  language: string;
  isPriority: boolean;
  recapPublishedAt: string | null;
}

/** Display parts for an event date, all in Mountain Time (never the server's or browser's zone). */
export function formatEventDate(dateString: string | Date, lang: Lang) {
  const date = new Date(dateString);
  const locale = lang === "es" ? es : enUS;

  return {
    full: fmtDate(date, lang),
    time: fmtTime(date, lang),
    short: formatInSiteZone(date, lang, { month: "short", day: "numeric", year: "numeric" }),
    month: formatInSiteZone(date, lang, { month: "short" }),
    day: String(siteDayOfMonth(date)),
    year: formatInSiteZone(date, lang, { year: "numeric" }),
    relative: formatDistanceToNow(date, { addSuffix: true, locale }),
    isPast: isPast(date),
    isFuture: isFuture(date),
  };
}

export function getStatusLabel(status: string, lang: Lang) {
  const labels: Record<string, Record<Lang, string>> = {
    published: { en: "Upcoming", es: "Próximo" },
    live: { en: "Live Now", es: "En Vivo" },
    completed: { en: "Past Event", es: "Evento Pasado" },
    cancelled: { en: "Cancelled", es: "Cancelado" },
    draft: { en: "Draft", es: "Borrador" },
  };
  return labels[status]?.[lang] ?? status;
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    published: "primary",
    live: "accent",
    completed: "neutral",
    cancelled: "neutral",
    draft: "neutral",
  };
  return colors[status] ?? "neutral";
}
