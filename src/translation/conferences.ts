import type { Lang } from "@/types";

/** Interface text on the conference cards (/resources). The conferences themselves are written in Sanity. */
const name = (organizer: string) => organizer.trim().replace(/\.+$/, ""); // "Example Inc." must not end in ".."

export const conferenceTranslation: Record<Lang, {
  hostedBy: (organizer: string) => string;
  website: string;
  register: string;
  newTab: string;
  registrationOpens: (date: string) => string;
  registrationCloses: (date: string) => string;
  registrationClosed: string;
  mode: Record<"inPerson" | "virtual" | "hybrid", string>;
  travelTitle: string;
  travelDeadline: (date: string) => string;
  travelLink: string;
}> = {
  en: {
    hostedBy: (o) => `Hosted by ${name(o)}. Registration is on their website.`,
    website: "Conference website",
    register: "Register on their website",
    newTab: "(opens in a new tab)",
    registrationOpens: (d) => `Registration opens ${d}`,
    registrationCloses: (d) => `Registration closes ${d}`,
    registrationClosed: "Registration is closed",
    mode: { inPerson: "In person", virtual: "Online", hybrid: "In person and online" },
    travelTitle: "HOEP travel assistance available",
    travelDeadline: (d) => `Last day to ask: ${d}`,
    travelLink: "Ask about travel assistance",
  },
  es: {
    hostedBy: (o) => `Organizado por ${name(o)}. La inscripción se hace en su sitio web.`,
    website: "Sitio web de la conferencia",
    register: "Inscribirse en su sitio web",
    newTab: "(se abre en una pestaña nueva)",
    registrationOpens: (d) => `La inscripción abre el ${d}`,
    registrationCloses: (d) => `La inscripción cierra el ${d}`,
    registrationClosed: "La inscripción está cerrada",
    mode: { inPerson: "Presencial", virtual: "En línea", hybrid: "Presencial y en línea" },
    travelTitle: "Ayuda de HOEP para viajes disponible",
    travelDeadline: (d) => `Último día para solicitarla: ${d}`,
    travelLink: "Preguntar sobre la ayuda para viajes",
  },
};
