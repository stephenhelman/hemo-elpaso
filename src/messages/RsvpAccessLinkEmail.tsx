import { contactEmail, SITE_PHONE } from "@/lib/site";
import { Button, Heading, Text } from "@react-email/components";
import EmailLayout, { emailH1, emailButton } from "./EmailLayout";

/**
 * "Email me an RSVP link" (event page). Contains the event title, date and one personal link. Never a diagnosis,
 * and nothing about the recipient's registration status beyond the fact that the link exists.
 */
interface Props {
  lang: "en" | "es";
  firstName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  rsvpUrl: string;
}

const copy = {
  en: {
    pre: "Your RSVP link", h: "Your RSVP link", hi: (n: string) => (n ? `Hi ${n},` : "Hello,"),
    p: "You asked for a link to RSVP for this event. It is personal to your household, so please don't forward it.",
    when: "When", button: "RSVP for this event", expires: "The link works until the event, or for 7 days, whichever comes first. If you didn't ask for it, you can ignore this email.",
    questions: `Questions? Call us at ${SITE_PHONE.dashed} or email ${contactEmail()}.`, sign: "The HOEP Team",
  },
  es: {
    pre: "Su enlace para confirmar asistencia", h: "Su enlace para confirmar asistencia", hi: (n: string) => (n ? `Hola ${n},` : "Hola,"),
    p: "Usted pidió un enlace para confirmar su asistencia a este evento. Es personal de su hogar, así que por favor no lo reenvíe.",
    when: "Cuándo", button: "Confirmar asistencia", expires: "El enlace sirve hasta el evento o por 7 días, lo que ocurra primero. Si usted no lo pidió, puede ignorar este correo.",
    questions: `¿Preguntas? Llámenos al ${SITE_PHONE.dashed} o escriba a ${contactEmail()}.`, sign: "El equipo de HOEP",
  },
};

export default function RsvpAccessLinkEmail({ lang = "en", firstName = "", eventTitle = "", eventDate = "", eventTime = "", rsvpUrl = "" }: Props) {
  const t = copy[lang];
  return (
    <EmailLayout preview={`${t.pre}: ${eventTitle}`} lang={lang}>
      <Heading style={emailH1}>{t.h}</Heading>
      <Text>{t.hi(firstName)}</Text>
      <Text>{t.p}</Text>
      <Text><strong>{eventTitle}</strong><br /><strong>{t.when}:</strong> {eventDate}, {eventTime}</Text>
      <Button href={rsvpUrl} style={emailButton}>{t.button}</Button>
      <Text style={{ fontSize: 13, color: "#555" }}>{t.expires}</Text>
      <Text style={{ fontSize: 13, color: "#555" }}>{t.questions}</Text>
      <Text>{t.sign}</Text>
    </EmailLayout>
  );
}
