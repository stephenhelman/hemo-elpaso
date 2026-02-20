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
  email: string;
}

export default function WelcomeEmail({ patientName, email }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Hemophilia Organization of El Paso!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with gradient */}
          <Section style={headerSection}>
            <Text style={emoji}>👋</Text>
            <Heading style={h1}>Welcome to HOEP!</Heading>
          </Section>

          {/* Main content */}
          <Section style={content}>
            <Text style={text}>Hi {patientName},</Text>

            <Text style={text}>
              Welcome to the Hemophilia Organization of El Paso! We're thrilled
              to have you as part of our community. You've just joined a
              supportive network dedicated to improving the lives of individuals
              and families affected by bleeding disorders.
            </Text>

            {/* Welcome box */}
            <Section style={welcomeBox}>
              <Heading style={welcomeTitle}>What You Can Do Now:</Heading>

              <Section style={featureItem}>
                <Text style={featureIcon}>📅</Text>
                <Section>
                  <Text style={featureTitle}>Browse Upcoming Events</Text>
                  <Text style={featureDescription}>
                    Discover educational dinners, support groups, and community
                    gatherings
                  </Text>
                </Section>
              </Section>

              <Section style={featureItem}>
                <Text style={featureIcon}>💰</Text>
                <Section>
                  <Text style={featureTitle}>
                    Apply for Financial Assistance
                  </Text>
                  <Text style={featureDescription}>
                    Get help with medical expenses, transportation, and event
                    fees
                  </Text>
                </Section>
              </Section>

              <Section style={featureItem}>
                <Text style={featureIcon}>👨‍👩‍👧‍👦</Text>
                <Section>
                  <Text style={featureTitle}>Complete Your Profile</Text>
                  <Text style={featureDescription}>
                    Add family members and preferences for personalized
                    recommendations
                  </Text>
                </Section>
              </Section>

              <Section style={featureItem}>
                <Text style={featureIcon}>🔔</Text>
                <Section>
                  <Text style={featureTitle}>Stay Updated</Text>
                  <Text style={featureDescription}>
                    Receive notifications about new events and important
                    announcements
                  </Text>
                </Section>
              </Section>
            </Section>

            <Text style={text}>
              <strong>Need help getting started?</strong>
            </Text>

            <Text style={text}>
              Our team is here to support you every step of the way. Whether you
              have questions about events, financial assistance, or just want to
              connect with others in the community, we're just an email away.
            </Text>

            {/* Quick links box */}
            <Section style={quickLinksBox}>
              <Text style={quickLinksTitle}>Quick Links:</Text>
              <Link
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/events`}
                style={quickLink}
              >
                → Browse Events
              </Link>
              <Link
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/portal/assistance`}
                style={quickLink}
              >
                → Financial Assistance
              </Link>
              <Link
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/portal/profile`}
                style={quickLink}
              >
                → Complete Profile
              </Link>
              <Link
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/about`}
                style={quickLink}
              >
                → About HOEP
              </Link>
            </Section>

            {/* CTA Button */}
            <Section style={buttonSection}>
              <Link
                href={`${process.env.NEXT_PUBLIC_BASE_URL}/portal/dashboard`}
                style={button}
              >
                Go to Your Dashboard
              </Link>
            </Section>

            <Text style={signatureText}>
              Welcome aboard!
              <br />
              <strong>The HOEP Team</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Hemophilia Organization of El Paso
              <br />
              El Paso, Texas
            </Text>
            <Text style={footerTextSmall}>
              Questions? Email us at{" "}
              <Link href="mailto:info@hemo-el-paso.org" style={footerLink}>
                info@hemo-el-paso.org
              </Link>
            </Text>
            <Text style={footerTextSmall}>
              Follow us on social media for updates and community stories
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
  fontSize: "32px",
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

const welcomeBox = {
  backgroundColor: "#fffbeb",
  border: "2px solid #D4AF37",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const welcomeTitle = {
  color: "#92400e",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 20px 0",
};

const featureItem = {
  display: "flex",
  marginBottom: "20px",
  alignItems: "flex-start",
};

const featureIcon = {
  fontSize: "28px",
  marginRight: "12px",
  lineHeight: "28px",
};

const featureTitle = {
  color: "#78350f",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 4px 0",
};

const featureDescription = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const quickLinksBox = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #86efac",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const quickLinksTitle = {
  color: "#166534",
  fontSize: "14px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  margin: "0 0 12px 0",
  letterSpacing: "0.5px",
};

const quickLink = {
  color: "#15803d",
  fontSize: "14px",
  textDecoration: "none",
  display: "block",
  margin: "0 0 8px 0",
  fontWeight: "600",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#D4AF37",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  padding: "14px 32px",
  borderRadius: "8px",
  display: "inline-block",
};

const signatureText = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "24px",
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
  margin: "0 0 4px 0",
};

const footerLink = {
  color: "#D4AF37",
  textDecoration: "underline",
};
