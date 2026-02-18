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
  location: string;
  checkInTime: string;
  liveEventUrl: string;
}

export default function CheckInConfirmation({
  patientName = "John Doe",
  eventTitle = "Spring Educational Dinner 2026",
  eventDate = "April 15, 2026",
  eventTime = "6:00 PM",
  location = "UMC El Paso Conference Center",
  checkInTime = "5:45 PM",
  liveEventUrl = "",
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {eventTitle}!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>🎉 You're Checked In!</Heading>
          </Section>

          {/* Greeting */}
          <Text style={text}>Hi {patientName},</Text>
          <Text style={text}>
            Welcome to <strong>{eventTitle}</strong>! You checked in at{" "}
            {checkInTime}.
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
              <tr>
                <td style={detailLabel}>📍 Location:</td>
                <td style={detailValue}>{location}</td>
              </tr>
              <tr>
                <td style={detailLabel}>✅ Checked In:</td>
                <td style={detailValue}>{checkInTime}</td>
              </tr>
            </table>
          </Section>

          {/* Live Event Access */}
          <Section style={liveSection}>
            <Heading as="h2" style={h2}>
              🌟 Access Live Event Features
            </Heading>
            <Text style={text}>
              As a checked-in attendee, you now have access to exclusive live
              event features:
            </Text>
            <ul style={list}>
              <li style={listItem}>📊 Live polls and voting</li>
              <li style={listItem}>💬 Q&A with speakers and sponsors</li>
              <li style={listItem}>📸 Photo gallery and sharing</li>
              <li style={listItem}>📢 Real-time event updates</li>
            </ul>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Button style={button} href={liveEventUrl}>
              Join Live Event
            </Button>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Contact event staff or email{" "}
              <a href="mailto:info@hemoelpaso.org" style={link}>
                info@hemoelpaso.org
              </a>
            </Text>
            <Text style={footerText}>Enjoy the event! 🎊</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles (same as RSVP email)
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
  background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
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
  color: "#16a34a",
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
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
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

const liveSection = {
  margin: "24px 20px",
};

const list = {
  padding: "0 20px",
  margin: "16px 0",
};

const listItem = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "24px",
  marginBottom: "8px",
};

const buttonSection = {
  padding: "0 20px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#16a34a",
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
  color: "#16a34a",
  textDecoration: "underline",
};
