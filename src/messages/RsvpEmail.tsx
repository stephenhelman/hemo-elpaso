import { contactEmail } from "@/lib/site";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from "@react-email/components";

/**
 * Transactional RSVP emails (confirmation / day-before reminder / cancellation).
 * Never contains diagnoses or anything about the recipient's health. The QR is a
 * HOSTED image (/api/checkin-qr/<token>), not a data: URL, because Gmail blocks
 * data: images. The QR payload is the raw check-in token only.
 */
export type RsvpEmailKind = "confirmation" | "reminder" | "cancelled";

interface Props {
  kind: RsvpEmailKind;
  lang: "en" | "es";
  firstName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  partySize: number;
  rsvpUrl?: string; // /rsvp/<token> (omitted for cancelled)
  qrUrl?: string; // /api/checkin-qr/<token> (omitted for cancelled)
}

const copy = {
  en: {
    confirmation: { h: "You're on the list!", p: "Your RSVP is confirmed.", pre: "RSVP confirmed" },
    reminder: { h: "See you tomorrow!", p: "A quick reminder about tomorrow's event.", pre: "Reminder" },
    cancelled: { h: "RSVP cancelled", p: "Your RSVP has been cancelled. We hope to see you at a future event.", pre: "RSVP cancelled" },
    hi: (n: string) => `Hi ${n},`,
    when: "When", where: "Where", party: "People",
    qrTitle: "Your check-in QR code",
    qrHelp: "Show this at the door.",
    qrFallback: "Can't see your QR code?",
    qrFallbackLink: "Open your RSVP page",
    manage: "View / change / cancel my RSVP",
    questions: `Questions? Call us at 915-621-8291 or email ${contactEmail()}.`,
    sign: "The HOEP Team",
  },
  es: {
    confirmation: { h: "¡Estás en la lista!", p: "Tu confirmación está lista.", pre: "Confirmación de asistencia" },
    reminder: { h: "¡Nos vemos mañana!", p: "Un recordatorio rápido sobre el evento de mañana.", pre: "Recordatorio" },
    cancelled: { h: "Asistencia cancelada", p: "Tu confirmación fue cancelada. Esperamos verte en un próximo evento.", pre: "Asistencia cancelada" },
    hi: (n: string) => `Hola ${n},`,
    when: "Cuándo", where: "Dónde", party: "Personas",
    qrTitle: "Tu código QR de registro",
    qrHelp: "Muéstralo en la entrada.",
    qrFallback: "¿No ves tu código QR?",
    qrFallbackLink: "Abre tu página de asistencia",
    manage: "Ver / cambiar / cancelar mi asistencia",
    questions: `¿Preguntas? Llámanos al 915-621-8291 o escribe a ${contactEmail()}.`,
    sign: "El equipo de HOEP",
  },
};

export default function RsvpEmail({
  kind = "confirmation",
  lang = "en",
  firstName = "Friend",
  eventTitle = "Event",
  eventDate = "",
  eventTime = "",
  location = "",
  partySize = 1,
  rsvpUrl,
  qrUrl,
}: Props) {
  const t = copy[lang];
  const k = t[kind];
  return (
    <Html>
      <Head />
      <Preview>{`${k.pre}: ${eventTitle}`}</Preview>
      <Body style={{ backgroundColor: "#f6f6f6", fontFamily: "sans-serif" }}>
        <Container style={{ backgroundColor: "#fff", padding: 32, maxWidth: 560 }}>
          <Heading style={{ color: "#8B1538", fontSize: 24 }}>{k.h}</Heading>
          <Text>{t.hi(firstName)}</Text>
          <Text>{k.p}</Text>
          <Text>
            <strong>{eventTitle}</strong>
            <br />
            <strong>{t.when}:</strong> {eventDate}, {eventTime}
            <br />
            <strong>{t.where}:</strong> {location}
            {kind !== "cancelled" && (
              <>
                <br />
                <strong>{t.party}:</strong> {partySize}
              </>
            )}
          </Text>
          {kind !== "cancelled" && qrUrl && (
            <>
              <Heading as="h2" style={{ fontSize: 18 }}>{t.qrTitle}</Heading>
              <Img src={qrUrl} width={220} height={220} alt="QR" />
              <Text style={{ fontSize: 13 }}>
                {t.qrHelp}
                {rsvpUrl && (
                  <>
                    <br />
                    {t.qrFallback}{" "}
                    <Link href={rsvpUrl} style={{ color: "#8B1538" }}>{t.qrFallbackLink}</Link>
                  </>
                )}
              </Text>
            </>
          )}
          {kind !== "cancelled" && rsvpUrl && (
            <Button
              href={rsvpUrl}
              style={{ backgroundColor: "#8B1538", color: "#fff", padding: "12px 24px", borderRadius: 24, fontWeight: 600 }}
            >
              {t.manage}
            </Button>
          )}
          <Text style={{ fontSize: 13, color: "#555" }}>{t.questions}</Text>
          <Text>{t.sign}</Text>
        </Container>
      </Body>
    </Html>
  );
}
