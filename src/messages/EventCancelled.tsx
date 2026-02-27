import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
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
  cancellationReason: string;
}

export default function EventCancelled({
  patientName,
  eventTitle,
  eventDate,
  eventTime,
  location,
  cancellationReason,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Event cancelled: {eventTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={emoji}>⚠️</Text>
            <Heading style={h1}>Event Cancelled</Heading>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Text style={text}>Hi {patientName},</Text>

            <Text style={text}>
              We regret to inform you that the following event has been
              cancelled:
            </Text>

            {/* Event details box */}
            <Section style={eventBox}>
              <Heading style={eventTitle}>{eventTitle}</Heading>

              <Section style={detailRow}>
                <Text style={detailLabel}>Originally Scheduled:</Text>
                <Text style={detailValue}>
                  {eventDate} at {eventTime}
                </Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Location:</Text>
                <Text style={detailValue}>{location}</Text>
              </Section>

              {cancellationReason && (
                <Section style={reasonBox}>
                  <Text style={reasonLabel}>Reason for Cancellation:</Text>
                  <Text style={reasonText}>{cancellationReason}</Text>
                </Section>
              )}
            </Section>

            <Text style={text}>
              We sincerely apologize for any inconvenience this may cause. Your
              RSVP has been automatically cancelled, and no further action is
              needed on your part.
            </Text>

            <Text style={text}>
              <strong>Stay connected:</strong>
            </Text>

            <Text style={text}>
              • Check our events calendar for upcoming opportunities
              <br />
              • We'll notify you when we reschedule this event
              <br />
              • Follow us for the latest updates and announcements
              <br />• Contact us if you have any questions or concerns
            </Text>

            <Text style={text}>
              Thank you for your understanding and continued support of our
              community.
            </Text>

            {/* CTA Button */}
            <Section style={buttonSection}>
              <Link
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/events`}
                style={button}
              >
                Browse Other Events
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Hemophilia Outreach of El Paso
              <br />
              Supporting our community through every challenge
            </Text>
            <Text style={footerTextSmall}>
              Questions? Contact us at{" "}
              <Link href="mailto:events@hemo-el-paso.org" style={footerLink}>
                events@hemo-el-paso.org
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
  padding: "0",
  maxWidth: "600px",
};

const headerSection = {
  background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
  padding: "40px 20px",
  textAlign: "center" as const,
};

const emoji = {
  fontSize: "48px",
  margin: "0 0 16px 0",
};

const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
  padding: "0",
};

const content = {
  padding: "40px 30px",
};

const text = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const eventBox = {
  backgroundColor: "#fff7ed",
  border: "2px solid #ea580c",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const eventTitle = {
  color: "#c2410c",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 20px 0",
};

const detailRow = {
  marginBottom: "12px",
};

const detailLabel = {
  color: "#ea580c",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  margin: "0 0 4px 0",
  letterSpacing: "0.5px",
};

const detailValue = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const reasonBox = {
  backgroundColor: "#fed7aa",
  border: "1px solid #fdba74",
  borderRadius: "8px",
  padding: "16px",
  marginTop: "20px",
};

const reasonLabel = {
  color: "#9a3412",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  margin: "0 0 8px 0",
};

const reasonText = {
  color: "#7c2d12",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#ea580c",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  padding: "14px 32px",
  borderRadius: "8px",
  display: "inline-block",
};

const footer = {
  backgroundColor: "#f9fafb",
  padding: "30px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 8px 0",
};

const footerTextSmall = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
};

const footerLink = {
  color: "#ea580c",
  textDecoration: "underline",
};
