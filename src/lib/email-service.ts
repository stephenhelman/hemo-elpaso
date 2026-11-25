import { mailbox } from "@/lib/site";
import { deliverEmail } from "@/lib/email/send";
import { render } from "@react-email/render";
import { prisma } from "@/lib/db";
import CheckInConfirmation from "@/messages/CheckInConfirmation";
import EventPublished from "@/messages/EventPublished";
import EventCancelled from "@/messages/EventCancelled";
import BoardRoleAssigned from "@/messages/BoardRoleAssigned";

const DEFAULT_FROM =
  process.env.EMAIL_FROM || `HOEP (DO NOT REPLY) <${mailbox("noreply")}>`;

interface EmailData {
  [key: string]: string | number;
}

interface SendEmailParams {
  templateType: string;
  recipient: string | null | undefined; // patients may have no email
  data: EmailData;
  patientId?: string;
  eventId?: string;
  fromEmail?: string; // override sender (e.g. president@<email domain>)
  replyTo?: string; // board member's personal Gmail
}

export async function sendEmail({
  templateType,
  recipient,
  data,
  patientId,
  eventId,
  fromEmail,
  replyTo,
}: SendEmailParams) {
  if (!recipient) return { skipped: true, reason: "no-recipient" };

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

    // Send through the one sender (EMAIL_MODE decides: live, capture or allowlist).
    const result = await deliverEmail({ kind: templateType, from: fromEmail ?? DEFAULT_FROM, to: recipient, subject, html: emailHtml, replyTo });
    if (!result.ok) throw new Error(result.errorName); // deliverEmail returns errors, it doesn't throw

    // Log email
    await prisma.emailLog.create({
      data: {
        templateType: templateType as any,
        recipient,
        subject,
        status: result.captured ? "captured" : "sent",
        patientId,
        eventId,
      },
    });

    return { success: true, messageId: result.id, captured: result.captured };
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
      case "CHECK_IN_CONFIRMATION":
        return render(
          CheckInConfirmation({
            patientName: String(data.patientName),
            eventTitle: String(data.eventTitle),
            eventDate: String(data.eventDate),
            eventTime: String(data.eventTime),
            location: String(data.location),
            checkInTime: String(data.checkInTime),
          }),
        );

      case "EVENT_PUBLISHED":
        return render(
          EventPublished({
            patientName: String(data.patientName),
            eventTitle: String(data.eventTitle),
            eventDate: String(data.eventDate),
            eventTime: String(data.eventTime),
            location: String(data.location),
            description: String(data.description),
            eventSlug: String(data.eventSlug),
            imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
          }),
        );

      case "EVENT_CANCELLED":
        return render(
          EventCancelled({
            patientName: String(data.patientName),
            eventTitle: String(data.eventTitle),
            eventDate: String(data.eventDate),
            eventTime: String(data.eventTime),
            location: String(data.location),
            cancellationReason: String(data.cancellationReason),
          }),
        );

      case "BOARD_ROLE_ASSIGNED":
        return render(
          BoardRoleAssigned({
            patientName: String(data.patientName),
            roleTitle: String(data.roleTitle),
            roleEmail: String(data.roleEmail),
            dashboardUrl: String(data.dashboardUrl),
            lang: String(data.lang) as "en" | "es",
          }),
        );

      default:
        console.warn(`Email template ${type} not implemented yet`);
        return null;
    }
  } catch (error) {
    console.error("Email render error:", error);
    return null;
  }
}

// Add more helper functions for other email types as needed
