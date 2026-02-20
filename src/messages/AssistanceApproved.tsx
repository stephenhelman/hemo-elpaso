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
  approvedAmount: string;
  reviewNotes: string;
  applicationId: string;
}

export default function AssistanceApproved({
  patientName,
  assistanceType,
  requestedAmount,
  approvedAmount,
  reviewNotes,
  applicationId,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>
        Great news! Your financial assistance application has been approved
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with gradient */}
          <Section style={headerSection}>
            <Text style={emoji}>🎉</Text>
            <Heading style={h1}>Application Approved!</Heading>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Text style={text}>Hi {patientName},</Text>

            <Text style={text}>
              Congratulations! Your financial assistance application has been
              approved by our review team.
            </Text>

            {/* Approval details box */}
            <Section style={approvalBox}>
              <Text style={approvalBadge}>✅ APPROVED</Text>

              <Text style={detailsLabel}>Assistance Type:</Text>
              <Text style={detailsValue}>{assistanceType}</Text>

              <Text style={detailsLabel}>Requested Amount:</Text>
              <Text style={detailsValue}>{requestedAmount}</Text>

              <Text style={detailsLabel}>Approved Amount:</Text>
              <Text style={approvedAmountText}>{approvedAmount}</Text>

              <Text style={detailsLabel}>Application ID:</Text>
              <Text style={detailsValueSmall}>{applicationId}</Text>
            </Section>

            {/* Review notes if provided */}
            {reviewNotes && (
              <Section style={notesBox}>
                <Text style={notesLabel}>Review Notes:</Text>
                <Text style={notesText}>{reviewNotes}</Text>
              </Section>
            )}

            <Text style={text}>
              <strong>What happens next?</strong>
            </Text>

            <Text style={text}>
              • Our finance team will process your disbursement within 3-5
              business days
              <br />
              • You'll receive another email when the payment is issued
              <br />
              • You can track your disbursement status in your portal
              <br />• If you have any questions, please don't hesitate to reach
              out
            </Text>

            <Text style={text}>
              Thank you for being part of the HOEP community. We're here to
              support you.
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
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Hemophilia Organization of El Paso
              <br />
              Supporting our community with care and compassion
            </Text>
            <Text style={footerTextSmall}>
              Questions? Contact us at{" "}
              <Link
                href="mailto:assistance@hemo-el-paso.org"
                style={footerLink}
              >
                assistance@hemo-el-paso.org
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
  background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
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

const approvalBox = {
  backgroundColor: "#ecfdf5",
  border: "2px solid #10b981",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const approvalBadge = {
  backgroundColor: "#10b981",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "bold",
  padding: "6px 12px",
  borderRadius: "6px",
  display: "inline-block",
  margin: "0 0 16px 0",
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

const approvedAmountText = {
  color: "#059669",
  fontSize: "24px",
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
  backgroundColor: "#f0f9ff",
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const notesLabel = {
  color: "#1e40af",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  margin: "0 0 8px 0",
};

const notesText = {
  color: "#1e3a8a",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#059669",
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
  margin: "0 0 4px 0",
};

const footerLink = {
  color: "#8B1538",
  textDecoration: "underline",
};
