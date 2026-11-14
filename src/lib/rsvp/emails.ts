import QRCode from "qrcode";
import { render } from "@react-email/render";
import { prisma } from "@/lib/db";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { sendEmail, sendRsvpConfirmation } from "@/lib/email-service";
import EventReminder from "@/messages/EventReminder";

interface EmailEvent {
  id: string;
  slug: string;
  titleEn: string;
  eventDate: Date;
  location: string | null;
}

interface EmailPatient {
  id: string;
  email: string | null;
  contactProfile?: { firstName: string; lastName: string } | null;
}

function patientName(p: EmailPatient) {
  return p.contactProfile
    ? `${p.contactProfile.firstName} ${p.contactProfile.lastName}`
    : "";
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Sends the RSVP confirmation. Never throws — email failure must not fail an RSVP. */
export async function sendRsvpConfirmationEmail(params: {
  patient: EmailPatient;
  event: EmailEvent;
  attendeeCount: number;
}) {
  const { patient, event, attendeeCount } = params;
  if (!patient.email) return; // no email on file (e.g. phone call-in)
  try {
    await sendRsvpConfirmation({
      recipient: patient.email,
      patientName: patientName(patient),
      eventTitle: event.titleEn,
      eventDate: formatDate(event.eventDate),
      eventTime: formatTime(event.eventDate),
      location: event.location || "TBD",
      adultsCount: attendeeCount,
      childrenCount: 0,
      eventSlug: event.slug,
      patientId: patient.id,
      eventId: event.id,
    });
  } catch (e) {
    console.error("Failed to send RSVP confirmation email:", e);
  }
}

/** Sends the RSVP cancellation email. Never throws. */
export async function sendRsvpCancellationEmail(params: {
  patient: EmailPatient;
  event: EmailEvent;
}) {
  const { patient, event } = params;
  if (!patient.email) return;
  try {
    await sendEmail({
      templateType: "RSVP_CANCELLATION",
      recipient: patient.email,
      data: {
        patientName: patientName(patient),
        eventTitle: event.titleEn,
        eventDate: formatDate(event.eventDate),
        eventTime: formatTime(event.eventDate),
        eventSlug: event.slug,
      },
      patientId: patient.id,
      eventId: event.id,
    });
  } catch (e) {
    console.error("Failed to send cancellation email:", e);
  }
}

/**
 * Sends the day-before reminder (with QR attachment) for one RSVP and marks it
 * reminderSent. Throws on failure so the cron can count it.
 */
export async function sendEventReminderEmail(params: {
  rsvp: { id: string; attendeeCount: number };
  patient: EmailPatient;
  event: EmailEvent;
}) {
  const { rsvp, patient, event } = params;
  if (!patient.email) return; // nothing to send to

  const qrDataUrl = await QRCode.toDataURL(`RSVP-${rsvp.id}`, {
    width: 500,
    margin: 2,
    color: { dark: "#8B1538", light: "#FFFFFF" },
  });
  const qrBuffer = Buffer.from(
    qrDataUrl.replace(/^data:image\/png;base64,/, ""),
    "base64",
  );

  const html = await render(
    EventReminder({
      patientName: patientName(patient),
      eventTitle: event.titleEn,
      eventDate: formatDate(event.eventDate),
      eventTime: formatTime(event.eventDate),
      location: event.location ?? "TBD",
      adultsCount: rsvp.attendeeCount,
      childrenCount: 0,
      qrCodeDataUrl: "cid:qrcode",
      eventSlug: event.slug,
    }),
  );

  await resend.emails.send({
    from: EMAIL_FROM,
    replyTo: "info@hemo-el-paso.org",
    to: patient.email,
    subject: `Reminder: ${event.titleEn} is Tomorrow!`,
    html,
    attachments: [
      { filename: "qr-code.png", content: qrBuffer, contentId: "qrcode" },
    ],
  });

  await prisma.rsvp.update({
    where: { id: rsvp.id },
    data: { reminderSent: true },
  });
}
