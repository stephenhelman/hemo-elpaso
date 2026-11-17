import { render } from "@react-email/render";
import { sendLoggedEmail, type SendResult } from "@/lib/email/send";
import { siteUrl, withLang } from "@/lib/site";
import MemberConfirmation from "@/messages/MemberConfirmation";
import type { PendingMemberInvite } from "@/lib/patients/create";

/**
 * Email an adult member their personal confirmation link, in the HOUSEHOLD's
 * preferred language. Content: first names + link only. No diagnoses, ever.
 * The raw token exists only in this link.
 */
export async function sendMemberConfirmation(p: {
  patientId: string;
  email: string;
  firstName: string;
  primaryFirstName: string;
  rawToken: string;
  language: "en" | "es";
}): Promise<SendResult> {
  const confirmUrl = withLang(`${siteUrl()}/confirm/${p.rawToken}`, p.language);
  const html = await render(
    MemberConfirmation({
      firstName: p.firstName,
      primaryFirstName: p.primaryFirstName,
      confirmUrl,
      lang: p.language,
    }),
  );
  return sendLoggedEmail({
    kind: "MEMBER_CONFIRMATION",
    to: p.email,
    subject:
      p.language === "es"
        ? "Por favor confirma tus datos con HOEP"
        : "Please confirm your details with HOEP",
    html,
    patientId: p.patientId,
  });
}

/** Registration time: send every adult's link. A failed send never fails registration (admin can resend). */
export async function sendMemberConfirmations(
  patientId: string,
  primaryFirstName: string,
  language: "en" | "es",
  invites: PendingMemberInvite[],
) {
  for (const inv of invites) {
    await sendMemberConfirmation({
      patientId,
      email: inv.email,
      firstName: inv.firstName,
      primaryFirstName,
      rawToken: inv.rawToken,
      language,
    });
  }
}
