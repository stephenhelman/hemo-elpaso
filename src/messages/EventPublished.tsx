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

interface Props {
  patientName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  description: string;
  eventSlug: string;
  imageUrl?: string;
}

export default function EventPublished({
  patientName,
  eventTitle,
  eventDate,
  eventTime,
  location,
  description,
  eventSlug,
  imageUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>New event: {eventTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with gradient */}
          <Section style={headerSection}>
            <Text style={emoji}>🌟</Text>
            <Heading style={h1}>New Event Available!</Heading>
          </Section>

          {/* Event image if available */}
          {imageUrl && (
            <Section style={imageSection}>
              <Img src={imageUrl} alt={eventTitle} style={eventImage} />
            </Section>
          )}

          {/* Main content */}
          <Section style={content}>
            <Text style={text}>Hi {patientName},</Text>

            <Text style={text}>
              We're excited to announce a new event that you might be interested
              in!
            </Text>

            {/* Event details box */}
            <Section style={eventBox}>
              <Heading style={eventTitle}>{eventTitle}</Heading>

              <Section style={detailRow}>
                <Text style={detailIcon}>📅</Text>
                <Section>
                  <Text style={detailLabel}>When</Text>
                  <Text style={detailValue}>{eventDate}</Text>
                  <Text style={detailValue}>{eventTime}</Text>
                </Section>
              </Section>

              <Section style={detailRow}>
                <Text style={detailIcon}>📍</Text>
                <Section>
                  <Text style={detailLabel}>Where</Text>
                  <Text style={detailValue}>{location}</Text>
                </Section>
              </Section>

              {description && (
                <Section style={descriptionSection}>
                  <Text style={detailLabel}>About This Event</Text>
                  <Text style={descriptionText}>{description}</Text>
                </Section>
              )}
            </Section>

            <Text style={text}>
              <strong>Don't miss out!</strong> RSVP now to secure your spot and
              join fellow community members for this special event.
            </Text>

            {/* CTA Buttons */}
            <Section style={buttonSection}>
              <Link
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/events/${eventSlug}`}
                style={primaryButton}
              >
                RSVP Now
              </Link>
              <Link
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/events`}
                style={secondaryButton}
              >
                View All Events
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Hemophilia Organization of El Paso
              <br />
              Building community, one event at a time
            </Text>
            <Text style={footerTextSmall}>
              Don't want event announcements?{" "}
              <Link
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/portal/profile`}
                style={footerLink}
              >
                Update your preferences
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
  background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
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

const imageSection = {
  padding: "0",
  margin: "0",
};

const eventImage = {
  width: "100%",
  height: "auto",
  display: "block",
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
  backgroundColor: "#faf5ff",
  border: "2px solid #7c3aed",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const eventTitle = {
  color: "#6d28d9",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 20px 0",
};

const detailRow = {
  display: "flex",
  marginBottom: "16px",
};

const detailIcon = {
  fontSize: "24px",
  marginRight: "12px",
  lineHeight: "24px",
};

const detailLabel = {
  color: "#7c3aed",
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
  margin: "0 0 2px 0",
};

const descriptionSection = {
  marginTop: "20px",
  paddingTop: "20px",
  borderTop: "1px solid #e9d5ff",
};

const descriptionText = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const primaryButton = {
  backgroundColor: "#7c3aed",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  padding: "14px 32px",
  borderRadius: "8px",
  display: "inline-block",
  marginBottom: "12px",
};

const secondaryButton = {
  backgroundColor: "transparent",
  color: "#7c3aed",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "underline",
  display: "block",
  marginTop: "12px",
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
  color: "#7c3aed",
  textDecoration: "underline",
};
