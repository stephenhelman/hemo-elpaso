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
  inviteeName: string;
  inviterName: string;
  familyName: string;
  inviteUrl: string;
}

export default function FamilyMemberInvite({
  inviteeName,
  inviterName,
  familyName,
  inviteUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been invited to join the HOEP patient portal</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={emoji}>👨‍👩‍👧‍👦</Text>
            <Heading style={h1}>Family Invitation</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>Hi {inviteeName},</Text>

            <Text style={text}>
              <strong>{inviterName}</strong> has invited you to join their family
              group on the Hemophilia Outreach of El Paso (HOEP) patient portal
              as part of the <strong>{familyName}</strong> family.
            </Text>

            <Text style={text}>
              The HOEP portal lets you view upcoming events, RSVP for family
              activities, and access community resources for individuals and
              families affected by bleeding disorders.
            </Text>

            <Section style={buttonSection}>
              <Link href={inviteUrl} style={button}>
                Create Your Account →
              </Link>
            </Section>

            <Text style={noteText}>
              This invitation was sent on behalf of {inviterName}. If you did
              not expect this invitation, you can safely ignore this email.
            </Text>

            <Text style={signatureText}>
              Warm regards,
              <br />
              <strong>The HOEP Team</strong>
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Hemophilia Outreach of El Paso · El Paso, Texas
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
const emoji = { fontSize: "48px", margin: "0 0 16px 0" };
const h1 = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
  padding: "0",
};
const content = { padding: "40px 30px" };
const text = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};
const noteText = {
  color: "#9ca3af",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "24px 0 16px 0",
};
const buttonSection = { textAlign: "center" as const, margin: "32px 0" };
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
const footerTextSmall = { color: "#9ca3af", fontSize: "12px", margin: "0" };
const footerLink = { color: "#D4AF37", textDecoration: "underline" };
