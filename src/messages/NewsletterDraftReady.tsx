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
  presidentName: string;
  month: string;
  year: number;
  eventCount: number;
  upcomingCount: number;
  previewUrl: string;
  isRevision?: boolean;
  revisionNotes?: string;
}

export default function NewsletterDraftReady({
  presidentName,
  month,
  year,
  eventCount,
  upcomingCount,
  previewUrl,
  isRevision = false,
  revisionNotes,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        {isRevision
          ? `Updated newsletter draft ready for ${month} ${year}`
          : `Your ${month} ${year} newsletter draft is ready for review`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={emoji}>📰</Text>
            <Heading style={h1}>
              {isRevision ? "Revised Draft Ready" : "Newsletter Draft Ready"}
            </Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={text}>Hi {presidentName},</Text>

            {isRevision ? (
              <Text style={text}>
                The Communications Liaison has updated the{" "}
                <strong>
                  {month} {year}
                </strong>{" "}
                newsletter draft based on your feedback. It's ready for your
                final review.
              </Text>
            ) : (
              <Text style={text}>
                The{" "}
                <strong>
                  {month} {year}
                </strong>{" "}
                newsletter draft has been automatically generated and is ready
                for your review.
              </Text>
            )}

            {/* Revision notes callout */}
            {isRevision && revisionNotes && (
              <Section style={revisionBox}>
                <Text style={revisionTitle}>Your Previous Feedback:</Text>
                <Text style={revisionText}>{revisionNotes}</Text>
              </Section>
            )}

            {/* Summary box */}
            <Section style={summaryBox}>
              <Text style={summaryTitle}>Draft Summary</Text>
              <Text style={summaryItem}>
                📅 <strong>{eventCount}</strong> event recap
                {eventCount !== 1 ? "s" : ""} included
              </Text>
              <Text style={summaryItem}>
                🗓️ <strong>{upcomingCount}</strong> upcoming event
                {upcomingCount !== 1 ? "s" : ""} in "Mark Your Calendar"
              </Text>
            </Section>

            <Text style={text}>
              When you're happy with the content, you'll be able to add your
              personal message in both English and Spanish before sending it out
              to all members.
            </Text>

            {/* CTA Buttons */}
            <Section style={buttonSection}>
              <Link href={previewUrl} style={primaryButton}>
                Review Newsletter Draft
              </Link>
            </Section>

            <Text style={noteText}>
              From the draft page you can <strong>approve and send</strong> or{" "}
              <strong>request changes</strong> with notes for the Communications
              Liaison.
            </Text>

            <Text style={signatureText}>— The HOEP System</Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Hemophilia Outreach of El Paso
              <br />
              El Paso, Texas
            </Text>
            <Text style={footerTextSmall}>
              <Link href="mailto:info@hemo-el-paso.org" style={footerLink}>
                info@hemo-el-paso.org
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
  background: "linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)",
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

const revisionBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const revisionTitle = {
  color: "#92400e",
  fontSize: "13px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  margin: "0 0 8px 0",
  letterSpacing: "0.5px",
};

const revisionText = {
  color: "#78350f",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const summaryBox = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #86efac",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const summaryTitle = {
  color: "#166534",
  fontSize: "13px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  margin: "0 0 12px 0",
  letterSpacing: "0.5px",
};

const summaryItem = {
  color: "#166534",
  fontSize: "15px",
  margin: "0 0 8px 0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const primaryButton = {
  backgroundColor: "#D4AF37",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  padding: "14px 32px",
  borderRadius: "8px",
  display: "inline-block",
};

const noteText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 24px 0",
  textAlign: "center" as const,
};

const signatureText = {
  color: "#4b5563",
  fontSize: "15px",
  margin: "24px 0 0 0",
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
  color: "#D4AF37",
  textDecoration: "underline",
};
