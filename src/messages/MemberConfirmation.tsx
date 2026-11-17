import { Button, Heading, Text } from "@react-email/components";
import EmailLayout, { emailH1, emailButton } from "./EmailLayout";

/**
 * Sent to an adult household member so they can confirm their own details.
 * Deliberately generic: NO diagnoses and nothing health-related, only the
 * member's first name, the primary's first name and the link.
 */
interface Props {
  firstName: string;
  primaryFirstName: string;
  confirmUrl: string;
  lang: "en" | "es";
}

const copy = {
  en: {
    preview: "Please confirm your details with HOEP",
    heading: "Please confirm your details",
    added: (p: string) =>
      `${p} added you to your family's registration with Hemophilia Outreach of El Paso.`,
    ask: "Please take a minute to confirm your details and choose your own preferences. You can also ask to be removed.",
    button: "Review and confirm",
    expires: "This link works for 30 days.",
    sign: "The HOEP Team",
  },
  es: {
    preview: "Por favor confirma tus datos con HOEP",
    heading: "Por favor confirma tus datos",
    added: (p: string) =>
      `${p} te agregó al registro de tu familia con Hemophilia Outreach of El Paso.`,
    ask: "Tómate un minuto para confirmar tus datos y elegir tus propias preferencias. También puedes pedir que te quitemos.",
    button: "Revisar y confirmar",
    expires: "Este enlace funciona durante 30 días.",
    sign: "El equipo de HOEP",
  },
};

export default function MemberConfirmation({
  firstName = "Friend",
  primaryFirstName = "",
  confirmUrl,
  lang = "en",
}: Props) {
  const t = copy[lang];
  return (
    <EmailLayout preview={t.preview} lang={lang}>
      <Heading style={emailH1}>{t.heading}</Heading>
      <Text>{lang === "es" ? `Hola ${firstName},` : `Hi ${firstName},`}</Text>
      <Text>{t.added(primaryFirstName)}</Text>
      <Text>{t.ask}</Text>
      <Button href={confirmUrl} style={emailButton}>
        {t.button}
      </Button>
      <Text>{t.expires}</Text>
      <Text>{t.sign}</Text>
    </EmailLayout>
  );
}
