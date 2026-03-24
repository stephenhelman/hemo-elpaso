import {
  Html, Head, Body, Container, Section, Heading, Text, Button, Hr, Preview
} from "@react-email/components";

interface Props {
  patientName: string;
  patientEmail: string;
  submittedAt: string; // formatted date string
  lang: "en" | "es";
}

const copy = {
  en: {
    preview: "New volunteer application received",
    heading: "New Volunteer Application",
    body: "{name} ({email}) submitted a volunteer application on {date}. Please review their profile in the admin panel.",
    ctaText: "Review Application",
    footer: "This is an automated notification from the HOEP admin system.",
  },
  es: {
    preview: "Nueva solicitud de voluntariado recibida",
    heading: "Nueva Solicitud de Voluntariado",
    body: "{name} ({email}) envió una solicitud de voluntariado el {date}. Por favor revise su perfil en el panel de administración.",
    ctaText: "Revisar Solicitud",
    footer: "Esta es una notificación automática del sistema de administración de HOEP.",
  },
};

export default function VolunteerRequestNotify({ patientName, patientEmail, submittedAt, lang = "en" }: Props) {
  const t = copy[lang];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hemo-elpaso.vercel.app";
  const body = t.body
    .replace("{name}", patientName)
    .replace("{email}", patientEmail)
    .replace("{date}", submittedAt);
  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={{ backgroundColor: "#f9fafb", fontFamily: "Arial, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "24px" }}>
          <Section style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "32px", border: "1px solid #e5e7eb" }}>
            <Heading style={{ fontSize: "24px", color: "#111827", marginBottom: "16px" }}>
              {t.heading}
            </Heading>
            <Text style={{ color: "#374151", fontSize: "16px", lineHeight: "1.6" }}>
              {body}
            </Text>
            <Button
              href={`${baseUrl}/admin/volunteers`}
              style={{ backgroundColor: "#dc2626", color: "#ffffff", padding: "12px 24px", borderRadius: "9999px", textDecoration: "none", fontWeight: "600", fontSize: "14px", display: "inline-block", marginTop: "16px" }}
            >
              {t.ctaText}
            </Button>
            <Hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />
            <Text style={{ color: "#9ca3af", fontSize: "12px" }}>{t.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
