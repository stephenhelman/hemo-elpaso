import { Resend } from "resend";
import { render } from "@react-email/render";
import { prisma } from "@/lib/db";
import RsvpConfirmation from "@/messages/RsvpConfirmation";
import RsvpCancellation from "@/messages/RsvpCancellation";
import EventReminder from "@/messages/EventReminder";
import CheckInConfirmation from "@/messages/CheckInConfirmation";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM =
  process.env.EMAIL_FROM || "HOEP Events <events@events.hemo-el-paso.org>";

interface EmailData {
  [key: string]: string | number;
}

interface SendEmailParams {
  templateType: string;
  recipient: string;
  data: EmailData;
  patientId?: string;
  eventId?: string;
}

export async function sendEmail({
  templateType,
  recipient,
  data,
  patientId,
  eventId,
}: SendEmailParams) {
  try {
    // Get template from database
    const template = await prisma.emailTemplate.findUnique({
      where: { type: templateType as any },
    });

    if (!template) {
      throw new Error(`Template ${templateType} not found`);
    }

    // Check if template is enabled
    if (!template.enabled) {
      console.log(`Email template ${templateType} is disabled, skipping send`);
      return { skipped: true };
    }

    // Render subject with data
    let subject = template.subject;
    Object.entries(data).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    });

    // Render email HTML
    const emailHtml = await renderEmailTemplate(templateType, data);

    if (!emailHtml) {
      throw new Error(`Failed to render email template: ${templateType}`);
    }

    // Send via Resend
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipient,
      subject,
      html: emailHtml,
    });

    // Log email
    await prisma.emailLog.create({
      data: {
        templateType: templateType as any,
        recipient,
        subject,
        status: "sent",
        patientId,
        eventId,
      },
    });

    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error("Email send error:", error);

    // Log failure
    await prisma.emailLog.create({
      data: {
        templateType: templateType as any,
        recipient,
        subject: "Failed to render",
        status: "failed",
        error: error.message,
        patientId,
        eventId,
      },
    });

    throw error;
  }
}

async function renderEmailTemplate(
  type: string,
  data: EmailData,
): Promise<string | null> {
  try {
    switch (type) {
      case "RSVP_CONFIRMATION":
        return render(
          RsvpConfirmation({
            patientName: String(data.patientName),
            eventTitle: String(data.eventTitle),
            eventDate: String(data.eventDate),
            eventTime: String(data.eventTime),
            location: String(data.location),
            adultsCount: Number(data.adultsCount) || 1,
            childrenCount: Number(data.childrenCount) || 0,
            qrCodeDataUrl: String(data.qrCodeDataUrl),
            eventSlug: String(data.eventSlug),
          }),
        );

      case "RSVP_CANCELLATION":
        return render(
          RsvpCancellation({
            patientName: String(data.patientName),
            eventTitle: String(data.eventTitle),
            eventDate: String(data.eventDate),
            eventTime: String(data.eventTime),
            eventSlug: String(data.eventSlug),
          }),
        );

      case "RSVP_REMINDER":
        return render(
          EventReminder({
            patientName: String(data.patientName),
            eventTitle: String(data.eventTitle),
            eventDate: String(data.eventDate),
            eventTime: String(data.eventTime),
            location: String(data.location),
            adultsCount: Number(data.adultsCount) || 1,
            childrenCount: Number(data.childrenCount) || 0,
            qrCodeDataUrl: String(data.qrCodeDataUrl),
            eventSlug: String(data.eventSlug),
          }),
        );

      case "CHECK_IN_CONFIRMATION":
        return render(
          CheckInConfirmation({
            patientName: String(data.patientName),
            eventTitle: String(data.eventTitle),
            eventDate: String(data.eventDate),
            eventTime: String(data.eventTime),
            location: String(data.location),
            checkInTime: String(data.checkInTime),
            liveEventUrl: String(data.liveEventUrl),
          }),
        );

      // TODO: Implement other templates
      default:
        console.warn(`Email template ${type} not implemented yet`);
        return null;
    }
  } catch (error) {
    console.error("Email render error:", error);
    return null;
  }
}

// Helper function to send RSVP confirmation
export async function sendRsvpConfirmation(params: {
  recipient: string;
  patientName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  adultsCount: number;
  childrenCount: number;
  qrCodeDataUrl: string;
  eventSlug: string;
  patientId: string;
  eventId: string;
}) {
  return sendEmail({
    templateType: "RSVP_CONFIRMATION",
    recipient: params.recipient,
    data: {
      patientName: params.patientName,
      eventTitle: params.eventTitle,
      eventDate: params.eventDate,
      eventTime: params.eventTime,
      location: params.location,
      adultsCount: params.adultsCount,
      childrenCount: params.childrenCount,
      qrCodeDataUrl: params.qrCodeDataUrl,
      eventSlug: params.eventSlug,
    },
    patientId: params.patientId,
    eventId: params.eventId,
  });
}

// Add more helper functions for other email types as needed
