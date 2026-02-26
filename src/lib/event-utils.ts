import { format, isPast, isFuture, formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Lang } from "@/types";

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
  targetAudience: string;
  language: string;
  isPriority: boolean;
  liveEnabled: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export function formatEventDate(dateString: string | Date, lang: Lang) {
  const date = new Date(dateString);
  const locale = lang === "es" ? es : enUS;

  return {
    full: format(date, "EEEE, MMMM d, yyyy", { locale }),
    time: format(date, "h:mm a", { locale }),
    short: format(date, "MMM d, yyyy", { locale }),
    month: format(date, "MMM", { locale }),
    day: format(date, "d"),
    year: format(date, "yyyy"),
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
