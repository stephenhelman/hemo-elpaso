import {
  Html, Head, Body, Container, Section, Heading, Text, Button, Hr, Preview
} from "@react-email/components";

interface Props {
  patientName: string;
  lang: "en" | "es";
}

const copy = {
  en: {
    preview: "We received your volunteer application!",
    heading: "Thank you for volunteering!",
    body1: "Hi {name}, we received your volunteer application and our team will review it soon.",
    body2: "Once reviewed, you will receive a confirmation email. If approved, you can view your volunteer assignments in the portal.",
    ctaText: "Visit Your Portal",
    footer: "This email was sent by Hemophilia Outreach of El Paso.",
  },
  es: {
    preview: "¡Recibimos su solicitud de voluntariado!",
    heading: "¡Gracias por ser voluntario/a!",
    body1: "Hola {name}, recibimos su solicitud de voluntariado y nuestro equipo la revisará pronto.",
    body2: "Una vez revisada, recibirá un correo de confirmación. Si es aprobado/a, podrá ver sus asignaciones de voluntariado en el portal.",
    ctaText: "Visitar su Portal",
    footer: "Este correo fue enviado por Hemophilia Outreach de El Paso.",
  },
};

export default function VolunteerRequestReceived({ patientName, lang = "en" }: Props) {
  const t = copy[lang];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://hemo-elpaso.vercel.app";
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
              {t.body1.replace("{name}", patientName)}
            </Text>
            <Text style={{ color: "#374151", fontSize: "16px", lineHeight: "1.6" }}>
              {t.body2}
            </Text>
            <Button
              href={`${baseUrl}/portal`}
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
