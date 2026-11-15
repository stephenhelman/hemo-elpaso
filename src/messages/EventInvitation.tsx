import {
  Button,
  Heading,
  Text,
} from "@react-email/components";
import EmailLayout, { emailH1, emailButton } from "./EmailLayout";

/**
 * Invitation email. Contains event details, a personal RSVP link and an
 * unsubscribe link. It must NEVER contain match reasons or anything about the
 * recipient's health/diagnoses: it is the same message for everyone invited.
 */
interface Props {
  lang: "en" | "es";
  firstName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  description?: string;
  rsvpUrl: string;
  unsubscribeUrl: string;
}

const copy = {
  en: {
    preview: (t: string) => `You're invited: ${t}`,
    hi: (n: string) => `Hi ${n},`,
    intro: "Hemophilia Outreach of El Paso would like to invite you to:",
    when: "When",
    where: "Where",
    cta: "RSVP",
    ctaHint: "Let us know if you can come (and how many people) using your personal link:",
    unsub: "Don't want invitations by email?",
    unsubLink: "Unsubscribe",
    sign: "The HOEP Team",
  },
  es: {
    preview: (t: string) => `Estás invitado/a: ${t}`,
    hi: (n: string) => `Hola ${n},`,
    intro: "Hemophilia Outreach of El Paso te invita a:",
    when: "Cuándo",
    where: "Dónde",
    cta: "Confirmar asistencia",
    ctaHint: "Avísanos si puedes venir (y cuántas personas) con tu enlace personal:",
    unsub: "¿No quieres invitaciones por correo?",
    unsubLink: "Cancelar suscripción",
    sign: "El equipo de HOEP",
  },
};

export default function EventInvitation({
  lang = "en",
  firstName = "Friend",
  eventTitle = "Event",
  eventDate = "",
  eventTime = "",
  location = "",
  description,
  rsvpUrl = "#",
  unsubscribeUrl = "#",
}: Props) {
  const t = copy[lang];
  return (
    <EmailLayout
      preview={t.preview(eventTitle)}
      lang={lang}
      unsubscribeUrl={unsubscribeUrl}
      unsubscribeText={{ prompt: t.unsub, link: t.unsubLink }}
    >
          <Text>{t.hi(firstName)}</Text>
          <Text>{t.intro}</Text>
          <Heading style={emailH1}>{eventTitle}</Heading>
          <Text>
            <strong>{t.when}:</strong> {eventDate}, {eventTime}
            <br />
            <strong>{t.where}:</strong> {location}
          </Text>
          {description ? <Text>{description}</Text> : null}
          <Text>{t.ctaHint}</Text>
          <Button
            href={rsvpUrl}
            style={emailButton}
          >
            {t.cta}
          </Button>
          <Text>{t.sign}</Text>
    </EmailLayout>
  );
}
