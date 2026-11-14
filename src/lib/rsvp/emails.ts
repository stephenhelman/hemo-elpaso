import { render } from "@react-email/render";
import { sendLoggedEmail } from "@/lib/email/send";
import RsvpEmail, { type RsvpEmailKind } from "@/messages/RsvpEmail";

const baseUrl = () => process.env.NEXT_PUBLIC_BASE_URL || "https://hemo-elpaso.vercel.app";

interface EmailEvent { titleEn: string; titleEs: string; eventDate: Date; location: string | null }
interface EmailPatient { id: string; email: string | null; preferredLanguage: string; contactProfile?: { firstName: string } | null }

/**
 * Transactional RSVP email (confirmation, reminder, cancellation). Sent to
 * patients even if they opted out of invitations. No email on file = no-op.
 * Never throws: email failure must not fail an RSVP. `token` is the RAW
 * check-in token (only available at the moment it is minted).
 */
export async function sendRsvpEmail(params: {
  kind: RsvpEmailKind;
  patient: EmailPatient;
  event: EmailEvent;
  partySize: number;
  token?: string;
}): Promise<boolean> {
  const { kind, patient, event, partySize, token } = params;
  if (!patient.email) return false;
  const lang = patient.preferredLanguage === "es" ? "es" : "en";
  const loc = lang === "es" ? "es-US" : "en-US";
  try {
    const html = await render(
      RsvpEmail({
        kind,
        lang,
        firstName: patient.contactProfile?.firstName ?? "",
        eventTitle: lang === "es" ? event.titleEs : event.titleEn,
        eventDate: event.eventDate.toLocaleDateString(loc, { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
        eventTime: event.eventDate.toLocaleTimeString(loc, { hour: "numeric", minute: "2-digit" }),
        location: event.location ?? "",
        partySize,
        rsvpUrl: token ? `${baseUrl()}/rsvp/${token}` : undefined,
        qrUrl: token ? `${baseUrl()}/api/checkin-qr/${token}` : undefined,
      }),
    );
    const title = lang === "es" ? event.titleEs : event.titleEn;
    const subject = {
      confirmation: lang === "es" ? `Confirmado: ${title}` : `RSVP confirmed: ${title}`,
      reminder: lang === "es" ? `Recordatorio: ${title} es mañana` : `Reminder: ${title} is tomorrow`,
      cancelled: lang === "es" ? `Asistencia cancelada: ${title}` : `RSVP cancelled: ${title}`,
    }[kind];
    const res = await sendLoggedEmail({
      kind: { confirmation: "RSVP_CONFIRMATION", reminder: "RSVP_REMINDER", cancelled: "RSVP_CANCELLATION" }[kind] as "RSVP_CONFIRMATION" | "RSVP_REMINDER" | "RSVP_CANCELLATION",
      to: patient.email,
      subject,
      html,
      patientId: patient.id,
    });
    return res.ok;
  } catch {
    console.error(`RSVP ${kind} email failed`); // render error: no recipient/body
    return false;
  }
}
