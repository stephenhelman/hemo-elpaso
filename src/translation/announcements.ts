import type { Lang } from "@/types";

/** Interface text of the announcement card, and the default title of an automatic conference announcement. */
export const announcementTranslation: Record<Lang, {
  region: string;
  previous: string;
  next: string;
  pause: string;
  play: string;
  dismiss: (title: string) => string;
  position: (n: number, total: number) => string;
  learnMore: string;
  newTab: string;
  hostedBy: (organizer: string) => string;
  registrationOpen: (conference: string) => string;
}> = {
  en: {
    region: "Announcements",
    previous: "Previous announcement",
    next: "Next announcement",
    pause: "Pause announcements",
    play: "Play announcements",
    dismiss: (t) => `Dismiss announcement: ${t}`,
    position: (n, total) => `${n} of ${total}`,
    learnMore: "Learn more",
    newTab: "(opens in a new tab)",
    hostedBy: (o) => `Conference hosted by ${o}`,
    registrationOpen: (c) => `Registration is open: ${c}`,
  },
  es: {
    region: "Anuncios",
    previous: "Anuncio anterior",
    next: "Anuncio siguiente",
    pause: "Pausar los anuncios",
    play: "Reanudar los anuncios",
    dismiss: (t) => `Cerrar el anuncio: ${t}`,
    position: (n, total) => `${n} de ${total}`,
    learnMore: "Más información",
    newTab: "(se abre en una pestaña nueva)",
    hostedBy: (o) => `Conferencia organizada por ${o}`,
    registrationOpen: (c) => `Inscripciones abiertas: ${c}`,
  },
};
