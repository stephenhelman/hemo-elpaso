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
  assistanceType: string;
  requestedAmount: string;
  applicationId: string;
}

export default function AssistanceSubmitted({
  patientName,
  assistanceType,
  requestedAmount,
  applicationId,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>We've received your financial assistance application</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with gradient */}
          <Section style={headerSection}>
            <Heading style={h1}>Application Received ✅</Heading>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Text style={text}>Hi {patientName},</Text>

            <Text style={text}>
              We've received your financial assistance application and it's now
              under review by our team.
            </Text>

            {/* Application details box */}
            <Section style={detailsBox}>
              <Text style={detailsLabel}>Application Type:</Text>
              <Text style={detailsValue}>{assistanceType}</Text>

              <Text style={detailsLabel}>Requested Amount:</Text>
              <Text style={detailsValue}>{requestedAmount}</Text>

              <Text style={detailsLabel}>Application ID:</Text>
              <Text style={detailsValueSmall}>{applicationId}</Text>
            </Section>

            <Text style={text}>
              <strong>What happens next?</strong>
            </Text>

            <Text style={text}>
              • Our team will review your application within 5-7 business days
              <br />
              • You may be contacted if additional documentation is needed
              <br />
              • You'll receive an email notification once a decision is made
              <br />• You can check your application status anytime in your
              portal
            </Text>

            <Text style={text}>
              If you have any questions or need to update your application,
              please contact us at{" "}
              <Link href="mailto:assistance@hemo-el-paso.org" style={link}>
                assistance@hemo-el-paso.org
              </Link>
            </Text>

            {/* CTA Button */}
            <Section style={buttonSection}>
              <Link
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/portal/assistance`}
                style={button}
              >
                View Application Status
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Hemophilia Outreach of El Paso
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
  background: "linear-gradient(135deg, #8B1538 0%, #6B1028 100%)",
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
  margin: "0 0 16px 0",
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
  backgroundColor: "#8B1538",
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
