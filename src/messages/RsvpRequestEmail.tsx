import { contactEmail, SITE_PHONE } from "@/lib/site";
import { Button, Heading, Link, Text } from "@react-email/components";
import EmailLayout, { EMAIL_COLORS, emailH1, emailButton } from "./EmailLayout";

/**
 * Emails about a REQUEST to attend and about VIRTUAL attendance.
 *  received         "We'll confirm soon."
 *  waitlisted       the in-person spots are taken; we'll write if one opens
 *  declined         kind and general. NEVER states a reason code (or any reason).
 *  virtual          confirmed to attend online: the Meet and YouTube links, the date and time, how to join
 *  virtual_reminder the same links, the day before
 * Never a diagnosis. The virtual links appear ONLY in the two virtual kinds, and those are sent only to confirmed attendees.
 */
export type RsvpRequestEmailKind = "received" | "waitlisted" | "declined" | "virtual" | "virtual_reminder";

interface Props {
  kind: RsvpRequestEmailKind;
  lang: "en" | "es";
  firstName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  partySize?: number;
  meetUrl?: string;
  youtubeUrl?: string;
  rsvpUrl?: string; // /rsvp/<token>: view or cancel
}

const q = `Questions? Call us at ${SITE_PHONE.dashed} or email ${contactEmail()}.`;
const qEs = `¿Preguntas? Llámenos al ${SITE_PHONE.dashed} o escriba a ${contactEmail()}.`;

const copy = {
  en: {
    received: { pre: "We got your request", h: "We got your request", p: "Thank you for asking to attend. We'll confirm soon, and we'll write to you again either way." },
    waitlisted: { pre: "You're on the waitlist", h: "You're on the waitlist", p: "Thank you for your interest. All in-person spots are taken for now. If a spot opens, or another way to join is possible, we'll write to you." },
    declined: { pre: "About your request", h: "About your request", p: "Thank you for asking to attend. We're sorry we aren't able to say yes this time. We hope to see you at a future event, and you're always welcome to call us." },
    virtual: { pre: "You're confirmed online", h: "You're confirmed to join online", p: "Your request is confirmed. You'll join this event online." },
    virtual_reminder: { pre: "Reminder", h: "See you online tomorrow!", p: "A quick reminder that you're joining tomorrow's event online." },
    hi: (n: string) => (n ? `Hi ${n},` : "Hello,"), when: "When", watching: (n: number) => `${n} ${n === 1 ? "person" : "people"} joining`,
    links: "Your links", meet: "Join on Google Meet", youtube: "Watch on YouTube",
    how: "How to join: open the Google Meet link at the start time to take part. The YouTube link is for watching if you can't use Meet. These links are only for you and your household, so please don't share them.",
    manage: "View / cancel my RSVP", questions: q, sign: "The HOEP Team",
  },
  es: {
    received: { pre: "Recibimos su solicitud", h: "Recibimos su solicitud", p: "Gracias por pedir asistir. Le confirmaremos pronto, y le escribiremos de nuevo en cualquier caso." },
    waitlisted: { pre: "Está en la lista de espera", h: "Está en la lista de espera", p: "Gracias por su interés. Por ahora los lugares presenciales están ocupados. Si se abre un lugar, o hay otra forma de participar, le escribiremos." },
    declined: { pre: "Sobre su solicitud", h: "Sobre su solicitud", p: "Gracias por pedir asistir. Lamentamos no poder decir que sí esta vez. Esperamos verle en un próximo evento, y siempre puede llamarnos." },
    virtual: { pre: "Confirmado en línea", h: "Está confirmado para participar en línea", p: "Su solicitud fue confirmada. Participará en este evento en línea." },
    virtual_reminder: { pre: "Recordatorio", h: "¡Nos vemos mañana en línea!", p: "Un recordatorio rápido: mañana participará en línea en el evento." },
    hi: (n: string) => (n ? `Hola ${n},` : "Hola,"), when: "Cuándo", watching: (n: number) => `${n} ${n === 1 ? "persona participa" : "personas participan"}`,
    links: "Sus enlaces", meet: "Unirse por Google Meet", youtube: "Ver en YouTube",
    how: "Cómo participar: abra el enlace de Google Meet a la hora de inicio para participar. El enlace de YouTube es para ver el evento si no puede usar Meet. Estos enlaces son solo para usted y su hogar, por favor no los comparta.",
    manage: "Ver / cancelar mi asistencia", questions: qEs, sign: "El equipo de HOEP",
  },
};

export default function RsvpRequestEmail({ kind = "received", lang = "en", firstName = "", eventTitle = "", eventDate = "", eventTime = "", partySize = 1, meetUrl, youtubeUrl, rsvpUrl }: Props) {
  const t = copy[lang];
  const k = t[kind];
  const virtual = kind === "virtual" || kind === "virtual_reminder";
  return (
    <EmailLayout preview={`${k.pre}: ${eventTitle}`} lang={lang}>
      <Heading style={emailH1}>{k.h}</Heading>
      <Text>{t.hi(firstName)}</Text>
      <Text>{k.p}</Text>
      <Text>
        <strong>{eventTitle}</strong>
        <br />
        <strong>{t.when}:</strong> {eventDate}, {eventTime}
        {virtual && (<><br />{t.watching(partySize)}</>)}
      </Text>
      {virtual && (meetUrl || youtubeUrl) && (
        <>
          <Heading as="h2" style={{ fontSize: 18 }}>{t.links}</Heading>
          {meetUrl && <Button href={meetUrl} style={emailButton}>{t.meet}</Button>}
          {meetUrl && <Text style={{ fontSize: 13 }}><Link href={meetUrl} style={{ color: EMAIL_COLORS.maroon }}>{meetUrl}</Link></Text>}
          {youtubeUrl && <Text><strong>{t.youtube}:</strong> <Link href={youtubeUrl} style={{ color: EMAIL_COLORS.maroon }}>{youtubeUrl}</Link></Text>}
          <Text style={{ fontSize: 13 }}>{t.how}</Text>
        </>
      )}
      {virtual && rsvpUrl && <Text style={{ fontSize: 13 }}><Link href={rsvpUrl} style={{ color: EMAIL_COLORS.maroon }}>{t.manage}</Link></Text>}
      <Text style={{ fontSize: 13, color: "#555" }}>{t.questions}</Text>
      <Text>{t.sign}</Text>
    </EmailLayout>
  );
}
