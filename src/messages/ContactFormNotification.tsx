import { siteHost } from "@/lib/site";
import {
  Heading,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import EmailLayout from "./EmailLayout";

interface Props {
  name: string;
  email: string;
  phone?: string;
  reason: string;
  message: string;
  locale?: "en" | "es";
}

const reasonLabels: Record<string, { en: string; es: string }> = {
  general:   { en: "General Inquiry",          es: "Consulta General" },
  family:    { en: "Family / Patient Support",  es: "Apoyo Familiar / Paciente" },
  volunteer: { en: "Volunteering",              es: "Voluntariado" },
  sponsor:   { en: "Sponsorship",               es: "Patrocinio" },
  media:     { en: "Media / Press",             es: "Medios / Prensa" },
  other:     { en: "Other",                     es: "Otro" },
};

export default function ContactFormNotification({
  name = "Jane Doe",
  email = "jane@example.com",
  phone,
  reason = "general",
  message = "Hello, I would like more information.",
  locale = "en",
}: Props) {
  const isEs = locale === "es";
  const reasonLabel =
    reasonLabels[reason]?.[locale] ?? reason;

  return (
    <EmailLayout preview={isEs
          ? `Nuevo mensaje de contacto de ${name} — ${reasonLabel}`
          : `New contact form message from ${name} — ${reasonLabel}`} lang={isEs ? "es" : "en"}>
          {/* Header */}
          <Heading style={h1}>
              {isEs ? "Nuevo Mensaje de Contacto" : "New Contact Form Message"}
            </Heading>

          {/* Reason badge */}
          <Section style={badgeSection}>
            <span style={badge}>{reasonLabel}</span>
          </Section>

          {/* Sender details */}
          <Section style={detailsBox}>
            <Heading as="h2" style={h2}>
              {isEs ? "Detalles del Remitente" : "Sender Details"}
            </Heading>
            <table style={detailsTable}>
              <tr>
                <td style={detailLabel}>
                  {isEs ? "Nombre:" : "Name:"}
                </td>
                <td style={detailValue}>{name}</td>
              </tr>
              <tr>
                <td style={detailLabel}>
                  {isEs ? "Correo:" : "Email:"}
                </td>
                <td style={detailValue}>
                  <a href={`mailto:${email}`} style={link}>
                    {email}
                  </a>
                </td>
              </tr>
              {phone && (
                <tr>
                  <td style={detailLabel}>
                    {isEs ? "Teléfono:" : "Phone:"}
                  </td>
                  <td style={detailValue}>{phone}</td>
                </tr>
              )}
              <tr>
                <td style={detailLabel}>
                  {isEs ? "Motivo:" : "Reason:"}
                </td>
                <td style={detailValue}>{reasonLabel}</td>
              </tr>
            </table>
          </Section>

          {/* Message */}
          <Section style={messageBox}>
            <Heading as="h2" style={h2}>
              {isEs ? "Mensaje" : "Message"}
            </Heading>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Hr style={divider} />

          {/* Reply CTA */}
          <Text style={replyNote}>
            {isEs
              ? `Para responder, envíe un correo directamente a ${email}`
              : `To reply, email ${email} directly or hit reply on this message.`}
          </Text>
        </EmailLayout>
  );
}




const h1 = {
  color: "#8B1538",
  fontSize: "24px",
  lineHeight: "30px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const h2 = {
  color: "#8B1538",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 12px",
};

const badgeSection = {
  padding: "16px 20px 0",
  textAlign: "center" as const,
};

const badge = {
  display: "inline-block",
  padding: "4px 14px",
  backgroundColor: "#FFF5F6",
  color: "#2A2426",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: "600",
  border: "1px solid #FACED2",
};

const detailsBox = {
  margin: "20px 20px 0",
  padding: "20px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const detailsTable = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const detailLabel = {
  color: "#6b7280",
  fontSize: "13px",
  padding: "6px 0",
  fontWeight: "600",
  width: "30%",
  verticalAlign: "top" as const,
};

const detailValue = {
  color: "#111827",
  fontSize: "14px",
  padding: "6px 0",
};

const messageBox = {
  margin: "16px 20px 0",
  padding: "20px",
  backgroundColor: "#FFF5F6",
  borderRadius: "8px",
  border: "1px solid #FACED2",
};

const messageText = {
  color: "#1f2937",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "24px 20px",
};

const replyNote = {
  color: "#374151",
  fontSize: "14px",
  padding: "0 20px",
  fontWeight: "500",
};



const link = {
  color: "#8B1538",
  textDecoration: "underline",
};