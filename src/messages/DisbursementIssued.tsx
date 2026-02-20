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
  amount: string;
  paymentMethod: string;
  checkNumber: string;
  expectedDate: string;
}

export default function DisbursementIssued({
  patientName,
  assistanceType,
  amount,
  paymentMethod,
  checkNumber,
  expectedDate,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your financial assistance payment is on the way!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with gradient */}
          <Section style={headerSection}>
            <Text style={emoji}>💰</Text>
            <Heading style={h1}>Payment Issued!</Heading>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Text style={text}>Hi {patientName},</Text>

            <Text style={text}>
              Great news! Your financial assistance payment has been issued and
              is on the way.
            </Text>

            {/* Payment details box */}
            <Section style={paymentBox}>
              <Text style={paymentBadge}>💵 PAYMENT ISSUED</Text>

              <Text style={detailsLabel}>Assistance Type:</Text>
              <Text style={detailsValue}>{assistanceType}</Text>

              <Text style={detailsLabel}>Amount:</Text>
              <Text style={amountText}>{amount}</Text>

              <Text style={detailsLabel}>Payment Method:</Text>
              <Text style={detailsValue}>{paymentMethod}</Text>

              {checkNumber && checkNumber !== "N/A" && (
                <>
                  <Text style={detailsLabel}>Check Number:</Text>
                  <Text style={detailsValueSmall}>{checkNumber}</Text>
                </>
              )}

              {expectedDate && expectedDate !== "N/A" && (
                <>
                  <Text style={detailsLabel}>Expected Delivery:</Text>
                  <Text style={detailsValue}>{expectedDate}</Text>
                </>
              )}
            </Section>

            <Text style={text}>
              <strong>What to expect:</strong>
            </Text>

            {paymentMethod === "Check" ? (
              <Text style={text}>
                • Your check has been mailed to the address on file
                <br />• Please allow {expectedDate} for delivery
                <br />
                • Contact us immediately if you don't receive it
                <br />• Keep your check number for reference
              </Text>
            ) : paymentMethod === "Cash" ? (
              <Text style={text}>
                • Your cash payment is ready for pickup
                <br />
                • Please contact our office to schedule pickup
                <br />
                • Bring a valid ID for verification
                <br />• Office hours: Monday-Friday, 9am-5pm
              </Text>
            ) : (
              <Text style={text}>
                • Your reimbursement has been processed
                <br />
                • Funds will be deposited according to your payment method
                <br />
                • Please allow 3-5 business days for processing
                <br />• Contact us if you have any questions
              </Text>
            )}

            <Text style={text}>
              Thank you for being part of the HOEP community. We're honored to
              support you.
            </Text>

            {/* CTA Button */}
            <Section style={buttonSection}>
              <Link
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/portal/assistance`}
                style={button}
              >
                View Payment Details
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
              Questions about your payment? Contact us at{" "}
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
  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
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

const paymentBox = {
  backgroundColor: "#f0f9ff",
  border: "2px solid #0284c7",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const paymentBadge = {
  backgroundColor: "#0284c7",
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

const amountText = {
  color: "#0284c7",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const detailsValueSmall = {
  color: "#6b7280",
  fontSize: "14px",
  fontFamily: "monospace",
  margin: "0 0 16px 0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#0284c7",
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
