import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface Props {
  patientName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventSlug: string;
}

export default function RsvpCancellation({
  patientName = "John Doe",
  eventTitle = "Spring Educational Dinner 2026",
  eventDate = "April 15, 2026",
  eventTime = "6:00 PM",
  eventSlug = "spring-dinner-2026",
}: Props) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://hemo-elpaso.vercel.app";

  return (
    <Html>
      <Head />
      <Preview>RSVP Cancelled: {eventTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>RSVP Cancelled</Heading>
          </Section>

          {/* Greeting */}
          <Text style={text}>Hi {patientName},</Text>
          <Text style={text}>
            Your RSVP for <strong>{eventTitle}</strong> has been cancelled.
          </Text>

          {/* Event Details */}
          <Section style={detailsBox}>
            <Heading as="h2" style={h2}>
              Event Information
            </Heading>
            <table style={detailsTable}>
              <tr>
                <td style={detailLabel}>📅 Date:</td>
                <td style={detailValue}>{eventDate}</td>
              </tr>
              <tr>
                <td style={detailLabel}>🕒 Time:</td>
                <td style={detailValue}>{eventTime}</td>
              </tr>
            </table>
          </Section>

          {/* Changed Your Mind */}
          <Section style={infoSection}>
            <Heading as="h2" style={h2}>
              Changed Your Mind?
            </Heading>
            <Text style={text}>
              No problem! You can re-register for this event at any time before
              the RSVP deadline.
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Button style={button} href={`${baseUrl}/events/${eventSlug}`}>
              View Event & Re-Register
            </Button>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>We hope to see you at future events!</Text>
            <Text style={footerText}>
              Questions? Email{" "}
              <a href="mailto:info@hemo-el-paso.org" style={link}>
                info@hemo-el-paso.org
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  background: "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)",
  padding: "32px 20px",
  textAlign: "center" as const,
};

const h1 = {
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0",
  padding: "0",
};

const h2 = {
  color: "#64748b",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 16px",
};

const text = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "24px",
  padding: "0 20px",
};

const detailsBox = {
  margin: "24px 20px",
  padding: "24px",
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
};

const detailsTable = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const detailLabel = {
  color: "#666666",
  fontSize: "14px",
  padding: "8px 0",
  fontWeight: "500",
  width: "40%",
};

const detailValue = {
  color: "#333333",
  fontSize: "14px",
  padding: "8px 0",
  fontWeight: "600",
};

const infoSection = {
  margin: "24px 20px",
};

const buttonSection = {
  padding: "0 20px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#64748b",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
  margin: "16px 0",
};

const footer = {
  margin: "32px 20px 0",
  padding: "24px 0 0",
  borderTop: "1px solid #e5e7eb",
  textAlign: "center" as const,
};

const footerText = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
};

const link = {
  color: "#64748b",
  textDecoration: "underline",
};
