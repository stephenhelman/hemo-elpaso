import { render } from "@react-email/render";
import { sendLoggedEmail, type SendResult } from "@/lib/email/send";
import RegistrationInfoConfirmation from "@/messages/RegistrationInfoConfirmation";

/** "Register for Information" confirmation. Generic text: no diagnoses, no event or family details. */
export async function sendRegistrationConfirmation(p: {
  id: string;
  email: string;
  firstName: string;
  language: "en" | "es";
}): Promise<SendResult> {
  const html = await render(RegistrationInfoConfirmation({ firstName: p.firstName, lang: p.language }));
  return sendLoggedEmail({
    kind: "REGISTRATION_INFO_CONFIRMATION",
    to: p.email,
    subject: p.language === "es" ? "Gracias por registrarte con HOEP" : "Thanks for registering with HOEP",
    html,
    patientId: p.id,
  });
}
