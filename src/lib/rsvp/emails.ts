import { siteUrl, withLang } from "@/lib/site";
import { formatEventDate, formatEventTime } from "@/lib/datetime";
import { render } from "@react-email/render";
import { sendLoggedEmail, type CodeEmailKind } from "@/lib/email/send";
import RsvpEmail, { type RsvpEmailKind } from "@/messages/RsvpEmail";
import RsvpRequestEmail, { type RsvpRequestEmailKind } from "@/messages/RsvpRequestEmail";
import { alsoSendRecipients } from "@/lib/households/also-send";

const baseUrl = () => siteUrl();

interface EmailEvent { titleEn: string; titleEs: string; eventDate: Date; location: string | null; meetUrl?: string | null; youtubeUrl?: string | null }
interface EmailPatient { id: string; email: string | null; preferredLanguage: string; contactProfile?: { firstName: string } | null }

/**
 * Transactional RSVP email (confirmation, reminder, cancellation). Sent to
 * patients even if they opted out of invitations. No email on file = no-op.
 * Never throws: email failure must not fail an RSVP. `token` is the RAW
 * check-in token (only available at the moment it is minted).
 * A VIRTUAL attendee's confirmation and reminder carry the Meet and YouTube links instead of the QR; those links exist
 * in no other email. Confirmations also go to the adults the household chose under "Also send invitations to".
 */
export async function sendRsvpEmail(params: {
  kind: RsvpEmailKind;
  patient: EmailPatient;
  event: EmailEvent;
  partySize: number;
  token?: string;
  attendanceType?: "in_person" | "virtual";
}): Promise<boolean> {
  const { kind, patient, event, partySize, token } = params;
  const virtual = params.attendanceType === "virtual" && kind !== "cancelled";
  if (virtual) return sendRequestEmail({ kind: kind === "reminder" ? "virtual_reminder" : "virtual", patient, event, partySize, token, alsoSend: kind === "confirmation" });
  if (!patient.email) return false;
  const send = async (to: string, lang: "en" | "es"): Promise<boolean> => {
    try {
      const html = await render(
        RsvpEmail({
          kind,
          lang,
          firstName: patient.contactProfile?.firstName ?? "",
          eventTitle: lang === "es" ? event.titleEs : event.titleEn,
          eventDate: formatEventDate(event.eventDate, lang),
          eventTime: formatEventTime(event.eventDate, lang),
          location: event.location ?? "",
          partySize,
          rsvpUrl: token ? withLang(`${baseUrl()}/rsvp/${token}`, lang) : undefined,
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
        sender: "events",
        kind: { confirmation: "RSVP_CONFIRMATION", reminder: "RSVP_REMINDER", cancelled: "RSVP_CANCELLATION" }[kind] as "RSVP_CONFIRMATION" | "RSVP_REMINDER" | "RSVP_CANCELLATION",
        to,
        subject,
        html,
        patientId: patient.id,
      });
      return res.ok;
    } catch {
      console.error(`RSVP ${kind} email failed`); // render error: no recipient/body
      return false;
    }
  };
  const lang = patient.preferredLanguage === "es" ? "es" : "en";
  const ok = await send(patient.email, lang);
  if (kind === "confirmation") {
    for (const r of await alsoSendRecipients(patient.id).catch(() => [])) await send(r.email, r.language ?? lang);
  }
  return ok;
}

/** Request received / waitlisted / declined and the two virtual kinds. Never throws. The decline email never names a reason. */
export async function sendRequestEmail(params: {
  kind: RsvpRequestEmailKind;
  patient: EmailPatient;
  event: EmailEvent;
  partySize?: number;
  token?: string;
  alsoSend?: boolean;
}): Promise<boolean> {
  const { kind, patient, event } = params;
  if (!patient.email) return false;
  const virtual = kind === "virtual" || kind === "virtual_reminder";
  const send = async (to: string, lang: "en" | "es"): Promise<boolean> => {
    try {
      const title = lang === "es" ? event.titleEs : event.titleEn;
      const html = await render(
        RsvpRequestEmail({
          kind, lang,
          firstName: patient.contactProfile?.firstName ?? "",
          eventTitle: title,
          eventDate: formatEventDate(event.eventDate, lang),
          eventTime: formatEventTime(event.eventDate, lang),
          partySize: params.partySize,
          // The links are read from the event at send time and go into virtual emails only.
          meetUrl: virtual ? event.meetUrl ?? undefined : undefined,
          youtubeUrl: virtual ? event.youtubeUrl ?? undefined : undefined,
          rsvpUrl: virtual && params.token ? withLang(`${baseUrl()}/rsvp/${params.token}`, lang) : undefined,
        }),
      );
      const subject = {
        received: lang === "es" ? `Recibimos su solicitud: ${title}` : `We got your request: ${title}`,
        waitlisted: lang === "es" ? `Lista de espera: ${title}` : `Waitlist: ${title}`,
        declined: lang === "es" ? `Sobre su solicitud: ${title}` : `About your request: ${title}`,
        virtual: lang === "es" ? `Confirmado en línea: ${title}` : `You're confirmed online: ${title}`,
        virtual_reminder: lang === "es" ? `Recordatorio: ${title} es mañana (en línea)` : `Reminder: ${title} is tomorrow (online)`,
      }[kind];
      const res = await sendLoggedEmail({
        sender: "events",
        kind: { received: "RSVP_REQUEST_RECEIVED", waitlisted: "RSVP_WAITLISTED", declined: "RSVP_REQUEST_DECLINED", virtual: "RSVP_CONFIRMED_VIRTUAL", virtual_reminder: "RSVP_REMINDER_VIRTUAL" }[kind] as CodeEmailKind,
        to, subject, html, patientId: patient.id,
      });
      return res.ok;
    } catch {
      console.error(`RSVP request email (${kind}) failed`); // no recipient or body in the log
      return false;
    }
  };
  const lang = patient.preferredLanguage === "es" ? "es" : "en";
  const ok = await send(patient.email, lang);
  if (params.alsoSend) {
    for (const r of await alsoSendRecipients(patient.id).catch(() => [])) await send(r.email, r.language ?? lang);
  }
  return ok;
}
