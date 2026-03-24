import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Preview,
} from "@react-email/components";

interface Props {
  patientName: string;
}

export default function VolunteerApproved({ patientName }: Props) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://hemo-elpaso.vercel.app";
  return (
    <Html>
      <Head />
      <Preview>Your volunteer application has been approved!</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "24px" }}>
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "32px",
              border: "1px solid #e5e7eb",
            }}
          >
            <Heading
              style={{ fontSize: "24px", color: "#111827", marginBottom: "16px" }}
            >
              You&apos;re Approved!
            </Heading>
            <Text style={{ color: "#374151", fontSize: "16px", lineHeight: "1.6" }}>
              Hi {patientName}, great news — your volunteer application with Hemophilia
              Outreach of El Paso has been approved!
            </Text>
            <Text style={{ color: "#374151", fontSize: "16px", lineHeight: "1.6" }}>
              You can now view your volunteer assignments and timecards in your portal.
              We&apos;ll reach out when you&apos;re assigned to an upcoming event.
            </Text>
            <Button
              href={`${baseUrl}/portal/volunteer`}
              style={{
                backgroundColor: "#dc2626",
                color: "#ffffff",
                padding: "12px 24px",
                borderRadius: "9999px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "14px",
                display: "inline-block",
                marginTop: "16px",
              }}
            >
              Go to Volunteer Portal
            </Button>
            <Hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />
            <Text style={{ color: "#9ca3af", fontSize: "12px" }}>
              This email was sent by Hemophilia Outreach of El Paso.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
