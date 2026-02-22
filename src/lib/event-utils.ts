import { format, isPast, isFuture, formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Lang } from "@/types";

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
