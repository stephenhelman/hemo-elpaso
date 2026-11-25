import {
  Button,
  Heading,
  Img,
  Link,
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
  /** Flyer for this household's delivery preference (lib/flyers invitationFlyer). Absent = the email is the plain invitation. */
  flyer?: {
    imageUrl: string | null;
    imageAlt: string;
    downloadUrl: string | null;
    mailNote: boolean;
  } | null;
  /** A VIRTUAL invitation: the event is attended online. Only then do the Meet and YouTube links appear (never in an in-person invitation). */
  virtual?: { meetUrl: string; youtubeUrl: string } | null;
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
    download: "Download the flyer",
    mailNote: "We\u2019ll mail you the flyer.",
    online: "Online", links: "Your links to join online", meet: "Google Meet", youtube: "YouTube", linksNote: "These links are only for you and your household. Please don't share them.",
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
    download: "Descargar el volante",
    mailNote: "Le enviaremos el volante por correo postal.",
    online: "En línea", links: "Sus enlaces para participar en línea", meet: "Google Meet", youtube: "YouTube", linksNote: "Estos enlaces son solo para usted y su hogar. Por favor no los comparta.",
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
  flyer = null,
  virtual = null,
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
            <strong>{t.where}:</strong> {virtual ? t.online : location}
          </Text>
          {description ? <Text>{description}</Text> : null}
          {virtual ? (
            <>
              <Heading as="h2" style={{ fontSize: 18 }}>{t.links}</Heading>
              <Text>
                <strong>{t.meet}:</strong> <Link href={virtual.meetUrl}>{virtual.meetUrl}</Link>
                <br />
                <strong>{t.youtube}:</strong> <Link href={virtual.youtubeUrl}>{virtual.youtubeUrl}</Link>
              </Text>
              <Text style={{ fontSize: 13 }}>{t.linksNote}</Text>
            </>
          ) : null}
          {flyer?.imageUrl ? (
            <Img src={flyer.imageUrl} alt={flyer.imageAlt} width="520" style={{ width: "100%", maxWidth: "520px", height: "auto", border: "0", margin: "8px 0" }} />
          ) : null}
          {flyer?.downloadUrl ? (
            <Text>
              <Link href={flyer.downloadUrl}>{t.download}</Link>
            </Text>
          ) : null}
          {flyer?.mailNote ? <Text>{t.mailNote}</Text> : null}
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
