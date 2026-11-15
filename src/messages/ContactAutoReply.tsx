import { Heading, Text } from "@react-email/components";
import EmailLayout, { emailH1 } from "./EmailLayout";

/**
 * Auto-reply sent to someone who used the contact form. Replaces the old HTML string built in the
 * route: React escapes `name` and `reasonLabel` (they come straight from the form), so markup typed
 * into the form cannot end up in the email.
 */
interface Props {
  name: string;
  reasonLabel: string;
  lang?: "en" | "es";
}

const copy = {
  en: {
    preview: "We received your message",
    thanks: (n: string) => `Thank you, ${n}`,
    got: (r: string) => `We received your message regarding ${r}.`,
    soon: "We'll get back to you within 1–2 business days.",
    sign: "The HOEP Team",
  },
  es: {
    preview: "Hemos recibido su mensaje",
    thanks: (n: string) => `Gracias, ${n}`,
    got: (r: string) => `Hemos recibido su mensaje sobre ${r}.`,
    soon: "Nos pondremos en contacto en 1–2 días hábiles.",
    sign: "El equipo de HOEP",
  },
};

export default function ContactAutoReply({ name = "Friend", reasonLabel = "General Inquiry", lang = "en" }: Props) {
  const t = copy[lang] ?? copy.en;
  return (
    <EmailLayout preview={t.preview} lang={lang}>
      <Heading style={emailH1}>{t.thanks(name)}</Heading>
      <Text>{t.got(reasonLabel)}</Text>
      <Text>{t.soon}</Text>
      <Text>{t.sign}</Text>
    </EmailLayout>
  );
}
