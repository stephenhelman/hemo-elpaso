import { siteUrl } from "@/lib/site";
import {
  Heading,
  Img,
  Link,
  Section,
  Text,
} from "@react-email/components";
import EmailLayout from "./EmailLayout";

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
    <EmailLayout preview={`New event: ${eventTitle}`} lang={"en"}>
          {/* Header with gradient */}
          <Heading style={h1}>New Event Available!</Heading>

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
              <Heading style={eventTitleStyle}>{eventTitle}</Heading>

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
                href={`${siteUrl()}/events/${eventSlug}`}
                style={primaryButton}
              >
                RSVP Now
              </Link>
              <Link
                href={`${siteUrl()}/events`}
                style={secondaryButton}
              >
                View All Events
              </Link>
            </Section>
          </Section>
        </EmailLayout>
  );
}

// Styles




const h1 = {
  color: "#8B1538",
  fontSize: "24px",
  lineHeight: "30px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
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
  padding: "8px 0 0",
};

const text = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const eventBox = {
  backgroundColor: "#FFF5F6",
  border: "2px solid #8B1538",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const eventTitleStyle = {
  color: "#8B1538",
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
  color: "#8B1538",
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
  borderTop: "1px solid #FACED2",
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
  backgroundColor: "#8B1538",
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
  color: "#8B1538",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "underline",
  display: "block",
  marginTop: "12px",
};




