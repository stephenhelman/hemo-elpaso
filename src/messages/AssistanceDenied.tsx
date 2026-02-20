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
  assistanceType: string;
  requestedAmount: string;
  reviewNotes: string;
  applicationId: string;
}

export default function AssistanceDenied({
  patientName,
  assistanceType,
  requestedAmount,
  reviewNotes,
  applicationId,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Update on your financial assistance application</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={h1}>Application Update</Heading>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Text style={text}>Hi {patientName},</Text>

            <Text style={text}>
              Thank you for submitting your financial assistance application.
              After careful review, we're unable to approve your request at this
              time.
            </Text>

            {/* Application details box */}
            <Section style={detailsBox}>
              <Text style={detailsLabel}>Assistance Type:</Text>
              <Text style={detailsValue}>{assistanceType}</Text>

              <Text style={detailsLabel}>Requested Amount:</Text>
              <Text style={detailsValue}>{requestedAmount}</Text>

              <Text style={detailsLabel}>Application ID:</Text>
              <Text style={detailsValueSmall}>{applicationId}</Text>
            </Section>

            {/* Review notes */}
            {reviewNotes && (
              <Section style={notesBox}>
                <Text style={notesLabel}>Reason:</Text>
                <Text style={notesText}>{reviewNotes}</Text>
              </Section>
            )}

            <Text style={text}>
              <strong>What you can do:</strong>
            </Text>

            <Text style={text}>
              • Review the reason provided and address any missing information
              <br />
              • Gather additional documentation if requested
              <br />
              • Submit a new application when you're ready
              <br />• Contact us if you have questions about this decision
            </Text>

            <Text style={text}>
              We understand this may be disappointing. Please know that we're
              committed to supporting our community, and we encourage you to
              reach out if your situation changes or if you need guidance on
              other assistance options.
            </Text>

            {/* CTA Button */}
            <Section style={buttonSection}>
              <Link
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/portal/assistance`}
                style={button}
              >
                View Application Details
              </Link>
            </Section>

            <Text style={contactText}>
              Questions? Contact our assistance team at{" "}
              <Link href="mailto:assistance@hemo-el-paso.org" style={link}>
                assistance@hemo-el-paso.org
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Hemophilia Organization of El Paso
              <br />
              Supporting our community with care and compassion
            </Text>
            <Text style={footerTextSmall}>
              This is an automated message. Please do not reply to this email.
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
  background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
  padding: "40px 20px",
  textAlign: "center" as const,
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

const detailsBox = {
  backgroundColor: "#f9fafb",
  border: "2px solid #e5e7eb",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const detailsLabel = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  margin: "0 0 4px 0",
  letterSpacing: "0.5px",
};

const detailsValue = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const detailsValueSmall = {
  color: "#6b7280",
  fontSize: "14px",
  fontFamily: "monospace",
  margin: "0",
};

const notesBox = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const notesLabel = {
  color: "#991b1b",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  margin: "0 0 8px 0",
};

const notesText = {
  color: "#7f1d1d",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const contactText = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "24px 0 0 0",
  textAlign: "center" as const,
};

const link = {
  color: "#8B1538",
  textDecoration: "underline",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#6b7280",
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
