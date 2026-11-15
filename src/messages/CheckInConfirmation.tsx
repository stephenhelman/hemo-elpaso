import { contactEmail } from "@/lib/site";
import {
  Heading,
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
  checkInTime: string;
}

export default function CheckInConfirmation({
  patientName = "John Doe",
  eventTitle = "Spring Educational Dinner 2026",
  eventDate = "April 15, 2026",
  eventTime = "6:00 PM",
  location = "UMC El Paso Conference Center",
  checkInTime = "5:45 PM",
}: Props) {
  return (
    <EmailLayout preview={`Welcome to ${eventTitle}!`} lang={"en"}>
          {/* Header */}
          <Heading style={h1}>🎉 You're Checked In!</Heading>

          {/* Greeting */}
          <Text style={text}>Hi {patientName},</Text>
          <Text style={text}>
            Welcome to <strong>{eventTitle}</strong>! You checked in at{" "}
            {checkInTime}.
          </Text>

          {/* Event Details */}
          <Section style={detailsBox}>
            <Heading as="h2" style={h2}>
              Event Information
            </Heading>
            <table style={detailsTable}>
              <tr>
                <td style={detailLabel}>📅 Date:</td>
                <td style={detailValue}>{eventDate}</td>
              </tr>
              <tr>
                <td style={detailLabel}>🕒 Time:</td>
                <td style={detailValue}>{eventTime}</td>
              </tr>
              <tr>
                <td style={detailLabel}>📍 Location:</td>
                <td style={detailValue}>{location}</td>
              </tr>
              <tr>
                <td style={detailLabel}>✅ Checked In:</td>
                <td style={detailValue}>{checkInTime}</td>
              </tr>
            </table>
          </Section>
        </EmailLayout>
  );
}

// Styles (same as RSVP email)



const h1 = {
  color: "#8B1538",
  fontSize: "24px",
  lineHeight: "30px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const h2 = {
  color: "#8B1538",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 16px",
};

const text = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "24px",
  padding: "0 20px",
};

const detailsBox = {
  margin: "24px 20px",
  padding: "24px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const detailsTable = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const detailLabel = {
  color: "#666666",
  fontSize: "14px",
  padding: "8px 0",
  fontWeight: "500",
  width: "40%",
};

const detailValue = {
  color: "#333333",
  fontSize: "14px",
  padding: "8px 0",
  fontWeight: "600",
};

const liveSection = {
  margin: "24px 20px",
};

const list = {
  padding: "0 20px",
  margin: "16px 0",
};

const listItem = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "24px",
  marginBottom: "8px",
};

const buttonSection = {
  padding: "0 20px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#8B1538",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
  margin: "16px 0",
};



const link = {
  color: "#8B1538",
  textDecoration: "underline",
};
