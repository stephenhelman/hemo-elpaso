import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PollOption {
  id: string;
  textEn: string;
  textEs: string;
}

interface Poll {
  id: string;
  questionEn: string;
  questionEs: string;
  options: PollOption[];
  totalResponses: number;
}

interface Question {
  id: string;
  questionEn: string;
  questionEs: string;
  upvotes: number;
  answerEn: string | null;
  answerEs: string | null;
}

interface Photo {
  id: string;
  url: string;
  caption: string | null;
}

interface EventRecap {
  eventId: string;
  titleEn: string;
  titleEs: string;
  date: string;
  location: string;
  attendanceCount: number;
  polls: Poll[];
  questions: Question[];
  photos: Photo[];
}

interface UpcomingEvent {
  eventId: string;
  titleEn: string;
  titleEs: string;
  date: string;
  location: string;
}

interface Props {
  patientName: string;
  lang: "en" | "es";
  month: string; // "March"
  monthEs: string; // "Marzo"
  year: number;
  presidentMessageEn: string;
  presidentMessageEs: string;
  eventRecaps: EventRecap[];
  upcomingEvents: UpcomingEvent[];
  unsubscribeUrl: string;
}

const MONTHS_ES: Record<string, string> = {
  January: "Enero",
  February: "Febrero",
  March: "Marzo",
  April: "Abril",
  May: "Mayo",
  June: "Junio",
  July: "Julio",
  August: "Agosto",
  September: "Septiembre",
  October: "Octubre",
  November: "Noviembre",
  December: "Diciembre",
};

export default function MemberNewsletter({
  patientName,
  lang,
  month,
  year,
  presidentMessageEn,
  presidentMessageEs,
  eventRecaps,
  upcomingEvents,
  unsubscribeUrl,
}: Props) {
  const isEs = lang === "es";
  const monthDisplay = isEs ? (MONTHS_ES[month] ?? month) : month;

  const t = {
    preview: isEs
      ? `Boletín de HOEP — ${monthDisplay} ${year}`
      : `HOEP Newsletter — ${monthDisplay} ${year}`,
    greeting: isEs ? `Hola ${patientName},` : `Hi ${patientName},`,
    messageFrom: isEs
      ? "Mensaje de la Presidenta"
      : "Message from the President",
    eventRecapsTitle: isEs ? "Lo que ocurrió" : "What Happened",
    attended: isEs ? "asistieron" : "attended",
    pollsTitle: isEs ? "Resultados de encuestas" : "Poll Results",
    responses: isEs ? "respuestas" : "responses",
    questionsTitle: isEs ? "Preguntas destacadas" : "Featured Q&A",
    upvotes: isEs ? "votos" : "upvotes",
    answer: isEs ? "Respuesta:" : "Answer:",
    photosTitle: isEs ? "Fotos del evento" : "Event Photos",
    calendarTitle: isEs ? "📅 Próximos Eventos" : "📅 Mark Your Calendar",
    footer: isEs
      ? "Hemophilia Outreach of El Paso — El Paso, Texas"
      : "Hemophilia Outreach of El Paso — El Paso, Texas",
    unsubscribe: isEs ? "Cancelar suscripción" : "Unsubscribe",
    visitPortal: isEs ? "Visitar mi portal" : "Visit my portal",
  };

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={headerLabel}>HOEP</Text>
            <Heading style={h1}>
              {monthDisplay} {year}
            </Heading>
            <Text style={headerSub}>
              {isEs ? "Boletín Mensual" : "Monthly Newsletter"}
            </Text>
          </Section>

          <Section style={content}>
            <Text style={greetingText}>{t.greeting}</Text>

            {/* President's Message */}
            <Section style={messageBox}>
              <Text style={messageSectionTitle}>{t.messageFrom}</Text>
              <Text style={messageText}>
                {isEs ? presidentMessageEs : presidentMessageEn}
              </Text>
            </Section>

            {/* Event Recaps */}
            {eventRecaps.length > 0 && (
              <>
                <Heading style={sectionHeading}>{t.eventRecapsTitle}</Heading>

                {eventRecaps.map((event) => (
                  <Section key={event.eventId} style={eventSection}>
                    <Heading style={eventTitle}>
                      {isEs ? event.titleEs : event.titleEn}
                    </Heading>
                    <Text style={eventMeta}>
                      📍 {event.location} &nbsp;·&nbsp; 👥{" "}
                      {event.attendanceCount} {t.attended}
                    </Text>

                    {/* Photos */}
                    {event.photos.length > 0 && (
                      <Section style={photosGrid}>
                        {event.photos.slice(0, 3).map((photo) => (
                          <Img
                            key={photo.id}
                            src={photo.url}
                            alt={photo.caption || "Event photo"}
                            style={photoImg}
                          />
                        ))}
                      </Section>
                    )}

                    {/* Polls */}
                    {event.polls.length > 0 && (
                      <>
                        <Text style={subSectionTitle}>{t.pollsTitle}</Text>
                        {event.polls.map((poll) => (
                          <Section key={poll.id} style={pollBox}>
                            <Text style={pollQuestion}>
                              {isEs ? poll.questionEs : poll.questionEn}
                            </Text>
                            {poll.options.map((opt) => (
                              <Text key={opt.id} style={pollOption}>
                                · {isEs ? opt.textEs : opt.textEn}
                              </Text>
                            ))}
                            <Text style={pollMeta}>
                              {poll.totalResponses} {t.responses}
                            </Text>
                          </Section>
                        ))}
                      </>
                    )}

                    {/* Questions */}
                    {event.questions.length > 0 && (
                      <>
                        <Text style={subSectionTitle}>{t.questionsTitle}</Text>
                        {event.questions.map((q) => (
                          <Section key={q.id} style={questionBox}>
                            <Text style={questionText}>
                              ❓ {isEs ? q.questionEs : q.questionEn}
                            </Text>
                            {(isEs ? q.answerEs : q.answerEn) && (
                              <Text style={answerText}>
                                <strong>{t.answer}</strong>{" "}
                                {isEs ? q.answerEs : q.answerEn}
                              </Text>
                            )}
                          </Section>
                        ))}
                      </>
                    )}
                  </Section>
                ))}
              </>
            )}

            {/* Mark Your Calendar */}
            {upcomingEvents.length > 0 && (
              <>
                <Heading style={sectionHeading}>{t.calendarTitle}</Heading>
                {upcomingEvents.map((event) => (
                  <Section key={event.eventId} style={calendarItem}>
                    <Text style={calendarTitle}>
                      {isEs ? event.titleEs : event.titleEn}
                    </Text>
                    <Text style={calendarMeta}>
                      📅{" "}
                      {new Date(event.date).toLocaleDateString(
                        isEs ? "es-MX" : "en-US",
                        { month: "long", day: "numeric", year: "numeric" },
                      )}{" "}
                      &nbsp;·&nbsp; 📍 {event.location}
                    </Text>
                  </Section>
                ))}
              </>
            )}

            {/* CTA */}
            <Section style={ctaSection}>
              <Link
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/portal/dashboard`}
                style={ctaButton}
              >
                {t.visitPortal}
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>{t.footer}</Text>
            <Text style={footerLinks}>
              <Link href="mailto:info@hemo-el-paso.org" style={footerLink}>
                info@hemo-el-paso.org
              </Link>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <Link href={unsubscribeUrl} style={footerLink}>
                {t.unsubscribe}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f5f5f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
};
const headerSection = {
  background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
  padding: "48px 30px",
  textAlign: "center" as const,
};
const headerLabel = {
  color: "rgba(255,255,255,0.8)",
  fontSize: "13px",
  fontWeight: "bold",
  letterSpacing: "3px",
  textTransform: "uppercase" as const,
  margin: "0 0 8px 0",
};
const h1 = {
  color: "#ffffff",
  fontSize: "36px",
  fontWeight: "bold",
  margin: "0 0 4px 0",
};
const headerSub = {
  color: "rgba(255,255,255,0.85)",
  fontSize: "16px",
  margin: "0",
};
const content = { padding: "40px 30px" };
const greetingText = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 24px 0",
};
const messageBox = {
  backgroundColor: "#fffbeb",
  border: "2px solid #D4AF37",
  borderRadius: "12px",
  padding: "24px",
  margin: "0 0 32px 0",
};
const messageSectionTitle = {
  color: "#92400e",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 12px 0",
};
const messageText = {
  color: "#78350f",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
};
const sectionHeading = {
  color: "#111",
  fontSize: "22px",
  fontWeight: "bold",
  margin: "32px 0 16px 0",
  borderBottom: "2px solid #f3f4f6",
  paddingBottom: "8px",
};
const eventSection = {
  marginBottom: "32px",
  paddingBottom: "32px",
  borderBottom: "1px solid #f3f4f6",
};
const eventTitle = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 4px 0",
};
const eventMeta = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0 0 16px 0",
};
const photosGrid = { marginBottom: "16px" };
const photoImg = {
  width: "180px",
  height: "120px",
  objectFit: "cover" as const,
  borderRadius: "8px",
  marginRight: "8px",
  display: "inline-block",
};
const subSectionTitle = {
  color: "#374151",
  fontSize: "13px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "16px 0 8px 0",
};
const pollBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "8px",
};
const pollQuestion = {
  color: "#1f2937",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};
const pollOption = {
  color: "#4b5563",
  fontSize: "13px",
  margin: "0 0 4px 0",
};
const pollMeta = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "8px 0 0 0",
};
const questionBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "8px",
};
const questionText = {
  color: "#1f2937",
  fontSize: "14px",
  margin: "0 0 6px 0",
};
const answerText = {
  color: "#166534",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};
const calendarItem = {
  backgroundColor: "#f9fafb",
  borderLeft: "4px solid #D4AF37",
  padding: "12px 16px",
  marginBottom: "8px",
  borderRadius: "0 8px 8px 0",
};
const calendarTitle = {
  color: "#1f2937",
  fontSize: "15px",
  fontWeight: "600",
  margin: "0 0 4px 0",
};
const calendarMeta = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0",
};
const ctaSection = {
  textAlign: "center" as const,
  margin: "40px 0 16px 0",
};
const ctaButton = {
  backgroundColor: "#D4AF37",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "bold",
  textDecoration: "none",
  padding: "14px 32px",
  borderRadius: "8px",
  display: "inline-block",
};
const footer = {
  backgroundColor: "#f9fafb",
  padding: "24px 30px",
  textAlign: "center" as const,
  borderTop: "1px solid #e5e7eb",
};
const footerText = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0 0 8px 0",
};
const footerLinks = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
};
const footerLink = {
  color: "#D4AF37",
  textDecoration: "underline",
};
