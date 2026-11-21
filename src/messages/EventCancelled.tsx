import { mailbox, siteUrl } from "@/lib/site";
import {
  Heading,
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
    <EmailLayout preview={`Event cancelled: ${eventTitle}`} lang={"en"}>
          {/* Header */}
          <Heading style={h1}>Event Cancelled</Heading>

          {/* Main content */}
          <Section style={content}>
            <Text style={text}>Hi {patientName},</Text>

            <Text style={text}>
              We regret to inform you that the following event has been
              cancelled:
            </Text>

            {/* Event details box */}
            <Section style={eventBox}>
              <Heading style={eventTitleStyle}>{eventTitle}</Heading>

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
                href={`${siteUrl()}/events`}
                style={button}
              >
                Browse Other Events
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
  marginBottom: "12px",
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
  margin: "0",
};

const reasonBox = {
  backgroundColor: "#FACED2",
  border: "1px solid #FACED2",
  borderRadius: "8px",
  padding: "16px",
  marginTop: "20px",
};

const reasonLabel = {
  color: "#2A2426",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  margin: "0 0 8px 0",
};

const reasonText = {
  color: "#2A2426",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#8B1538",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  padding: "14px 32px",
  borderRadius: "8px",
  display: "inline-block",
};




