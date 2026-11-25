import { contactEmail } from "@/lib/site";
import {
  Heading,
  Text,
} from "@react-email/components";
import EmailLayout, { emailH1 } from "./EmailLayout";

/**
 * Sent after "Register for Information". Deliberately generic: it must NOT
 * mention diagnoses, family details, or anything health-related.
 */
interface Props {
  firstName: string;
  lang: "en" | "es";
  /** The household is not approved yet: add the review line. */
  reviewing?: boolean;
}

const copy = {
  en: {
    preview: "Thanks for registering with HOEP",
    heading: "Thank you for registering",
    body: "We received your request for information from Hemophilia Outreach of El Paso. We will let you know about upcoming events and services.",
    change:
      `To update or remove your information, just reply to this email or contact us at ${contactEmail()}.`,
    review: "We'll review your registration and may call you.",
    sign: "The HOEP Team",
  },
  es: {
    preview: "Gracias por registrarte con HOEP",
    heading: "Gracias por registrarte",
    body: "Recibimos tu solicitud de información de Hemophilia Outreach of El Paso. Te avisaremos sobre próximos eventos y servicios.",
    change:
      `Para actualizar o eliminar tu información, responde a este correo o escríbenos a ${contactEmail()}.`,
    review: "Revisaremos tu registro y es posible que te llamemos.",
    sign: "El equipo de HOEP",
  },
};

export default function RegistrationInfoConfirmation({
  firstName = "Friend",
  lang = "en",
  reviewing = true,
}: Props) {
  const t = copy[lang];
  return (
    <EmailLayout preview={t.preview} lang={lang}>
          <Heading style={emailH1}>{t.heading}</Heading>
          <Text>{lang === "es" ? `Hola ${firstName},` : `Hi ${firstName},`}</Text>
          <Text>{t.body}</Text>
          {reviewing && <Text>{t.review}</Text>}
          <Text>{t.change}</Text>
          <Text>{t.sign}</Text>
    </EmailLayout>
  );
}
