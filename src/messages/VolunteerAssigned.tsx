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
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  role: string;
  checkinUrl: string;
}

export default function VolunteerAssigned({
  patientName,
  eventTitle,
  eventDate,
  eventTime,
  location,
  role,
  checkinUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been assigned to volunteer at {eventTitle}!</Preview>
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
              Volunteer Assignment
            </Heading>
            <Text style={{ color: "#374151", fontSize: "16px", lineHeight: "1.6" }}>
              Hi {patientName}, you&apos;ve been assigned to volunteer at{" "}
              <strong>{eventTitle}</strong>!
            </Text>
            <Text style={{ color: "#374151", fontSize: "16px", lineHeight: "1.6" }}>
              <strong>Date:</strong> {eventDate}
              <br />
              <strong>Time:</strong> {eventTime}
              <br />
              <strong>Location:</strong> {location}
              <br />
              <strong>Role:</strong> {role.replace(/_/g, " ")}
            </Text>
            <Text style={{ color: "#374151", fontSize: "16px", lineHeight: "1.6" }}>
              Use the button below to check in on the day of the event. Your unique
              check-in link is tied to your assignment.
            </Text>
            <Button
              href={checkinUrl}
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
              Check In on Event Day
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
