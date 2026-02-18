import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
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
  adultsCount: number;
  childrenCount: number;
  qrCodeDataUrl: string;
  eventSlug: string;
}

export default function RsvpConfirmation({
  patientName = "John Doe",
  eventTitle = "Spring Educational Dinner 2026",
  eventDate = "April 15, 2026",
  eventTime = "6:00 PM",
  location = "UMC El Paso Conference Center",
  adultsCount = 2,
  childrenCount = 1,
  qrCodeDataUrl = "",
  eventSlug = "spring-dinner-2026",
}: Props) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://hemo-elpaso.vercel.app";

  return (
    <Html>
      <Head />
      <Preview>Your RSVP for {eventTitle} is confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>RSVP Confirmed!</Heading>
          </Section>

          {/* Greeting */}
          <Text style={text}>Hi {patientName},</Text>
          <Text style={text}>
            You're all set for <strong>{eventTitle}</strong>! We're excited to
            see you there.
          </Text>

          {/* Event Details */}
          <Section style={detailsBox}>
            <Heading as="h2" style={h2}>
              Event Details
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
                <td style={detailLabel}>👥 Attendees:</td>
                <td style={detailValue}>
                  {adultsCount} adult{adultsCount !== 1 ? "s" : ""},{" "}
                  {childrenCount} child
                  {childrenCount !== 1 ? "ren" : ""}
                </td>
              </tr>
            </table>
          </Section>

          {/* QR Code */}
          <Section style={qrSection}>
            <Heading as="h2" style={h2}>
              Your Check-In QR Code
            </Heading>
            <Text style={text}>
              Show this QR code at the event entrance for quick check-in:
            </Text>
            <div style={qrCodeBox}>
              <Img
                src={qrCodeDataUrl}
                alt="Check-in QR Code"
                width="250"
                height="250"
                style={qrCodeImage}
              />
            </div>
            <Text style={smallText}>
              💡 <strong>Tip:</strong> Save this email or take a screenshot to
              have your QR code ready.
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonSection}>
            <Button style={button} href={`${baseUrl}/events/${eventSlug}`}>
              View Event Details
            </Button>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Contact us at{" "}
              <a href="mailto:info@hemo-el-paso.org" style={link}>
                info@hemo-el-paso.org
              </a>
            </Text>
            <Text style={footerText}>
              Can't make it?{" "}
              <a href={`${baseUrl}/portal/dashboard`} style={link}>
                Cancel your RSVP
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
  background: "linear-gradient(135deg, #8B1538 0%, #D4AF37 100%)",
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
  color: "#8B1538",
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

const smallText = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "20px",
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

const qrSection = {
  margin: "24px 20px",
  textAlign: "center" as const,
};

const qrCodeBox = {
  margin: "24px auto",
  padding: "24px",
  backgroundColor: "#ffffff",
  border: "2px solid #8B1538",
  borderRadius: "12px",
  display: "inline-block",
};

const qrCodeImage = {
  display: "block",
  margin: "0 auto",
};

const buttonSection = {
  padding: "0 20px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#8B1538",
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
  color: "#8B1538",
  textDecoration: "underline",
};
