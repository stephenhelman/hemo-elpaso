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
  roleTitle: string;
  roleEmail: string;
  dashboardUrl: string;
  lang: "en" | "es";
}

const copy = {
  en: {
    preview: "You've been assigned a board role at HOEP",
    heading: "Welcome to the HOEP Board",
    greeting: (name: string) => `Congratulations, ${name}!`,
    intro:
      "You have been assigned a board role at Hemophilia Outreach of El Paso. As a board member, you now have access to the admin portal and a professional email address you can use to communicate on behalf of the organization.",
    roleLabel: "Your Role",
    emailLabel: "Your Board Email Address",
    emailNote:
      "This is the HOEP address assigned to your role.",
    setupTitle: "Next Steps",
    step1: "Log in to the admin dashboard.",
    cta: "Go to Admin Dashboard",
    closing: "We're glad to have you on the team.",
    signature: "The HOEP Team",
  },
  es: {
    preview: "Se le ha asignado un rol en la junta directiva de HOEP",
    heading: "Bienvenido/a a la Junta de HOEP",
    greeting: (name: string) => `¡Felicitaciones, ${name}!`,
    intro:
      "Se le ha asignado un rol en la junta directiva de Hemophilia Outreach de El Paso. Como miembro de la junta, ahora tiene acceso al portal de administración y una dirección de correo electrónico profesional para comunicarse en nombre de la organización.",
    roleLabel: "Su Rol",
    emailLabel: "Su Dirección de Correo de la Junta",
    emailNote:
      "Esta es la dirección de HOEP asignada a su rol.",
    setupTitle: "Próximos Pasos",
    step1: "Inicie sesión en el panel de administración.",
    cta: "Ir al Panel de Administración",
    closing: "Nos alegra tenerle en el equipo.",
    signature: "El Equipo de HOEP",
  },
};

export default function BoardRoleAssigned({
  patientName,
  roleTitle,
  roleEmail,
  dashboardUrl,
  lang,
}: Props) {
  const t = copy[lang] ?? copy.en;

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Text style={emoji}>🎉</Text>
            <Heading style={h1}>{t.heading}</Heading>
          </Section>

          <Section style={content}>
            <Text style={text}>{t.greeting(patientName)}</Text>

            <Text style={text}>{t.intro}</Text>

            {/* Role info box */}
            <Section style={infoBox}>
              <Text style={infoLabel}>{t.roleLabel}</Text>
              <Text style={infoValue}>{roleTitle}</Text>

              <Text style={infoLabel}>{t.emailLabel}</Text>
              <Text style={infoValue}>{roleEmail}</Text>

              <Text style={infoNote}>{t.emailNote}</Text>
            </Section>

            {/* Setup steps */}
            <Text style={sectionHeading}>{t.setupTitle}</Text>
            <Text style={step}>
              <strong>1.</strong> {t.step1}
            </Text>
            {/* CTA */}
            <Section style={buttonSection}>
              <Link href={dashboardUrl} style={button}>
                {t.cta}
              </Link>
            </Section>

            <Text style={signatureText}>
              {t.closing}
              <br />
              <strong>{t.signature}</strong>
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Hemophilia Outreach of El Paso
              <br />
              El Paso, Texas
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

const infoBox = {
  backgroundColor: "#fffbeb",
  border: "2px solid #D4AF37",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const infoLabel = {
  color: "#92400e",
  fontSize: "11px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px 0",
};

const infoValue = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const infoNote = {
  color: "#78350f",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "8px 0 0 0",
};

const sectionHeading = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "24px 0 12px 0",
};

const step = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "22px",
  margin: "0 0 10px 0",
  paddingLeft: "8px",
};

const optionalBox = {
  backgroundColor: "#f0f9ff",
  border: "1px solid #bae6fd",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const optionalTitle = {
  color: "#0c4a6e",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
};

const optionalBody = {
  color: "#0369a1",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
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
  margin: "0",
};

const footerLink = {
  color: "#D4AF37",
  textDecoration: "underline",
};
