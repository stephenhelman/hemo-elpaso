import { Resend } from "resend";
import { render } from "@react-email/render";
import { prisma } from "@/lib/db";
import RsvpConfirmation from "@/messages/RsvpConfirmation";
import RsvpCancellation from "@/messages/RsvpCancellation";
import EventReminder from "@/messages/EventReminder";
import CheckInConfirmation from "@/messages/CheckInConfirmation";
import AssistanceSubmitted from "@/messages/AssistanceSubmitted";
import AssistanceApproved from "@/messages/AssistanceApproved";
import AssistanceDenied from "@/messages/AssistanceDenied";
import DisbursementIssued from "@/messages/DisbursementIssued";
import EventPublished from "@/messages/EventPublished";
import EventCancelled from "@/messages/EventCancelled";
import WelcomeEmail from "@/messages/WelcomeEmail";
import BoardRoleAssigned from "@/messages/BoardRoleAssigned";
import FamilyMemberInvite from "@/messages/FamilyMemberInvite";
import VolunteerRequestReceived from "@/messages/VolunteerRequestReceived";
import VolunteerRequestNotify from "@/messages/VolunteerRequestNotify";
import VolunteerApproved from "@/messages/VolunteerApproved";
import VolunteerAssigned from "@/messages/VolunteerAssigned";

const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_FROM =
  process.env.EMAIL_FROM || "HOEP (DO NOT REPLY) <noreply@hemo-el-paso.org>";

interface EmailData {
  [key: string]: string | number;
}

interface SendEmailParams {
  templateType: string;
  recipient: string;
  data: EmailData;
  patientId?: string;
  eventId?: string;
  fromEmail?: string; // override sender (e.g. president@hemo-el-paso.org)
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
      from: fromEmail ?? DEFAULT_FROM,
      to: recipient,
      subject,
      html: emailHtml,
      ...(replyTo ? { replyTo } : {}),
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
            eventSlug: String(data.eventSlug),
            // qrCodeDataUrl removed
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

      case "ASSISTANCE_SUBMITTED":
        return render(
          AssistanceSubmitted({
            patientName: String(data.patientName),
            assistanceType: String(data.assistanceType),
            requestedAmount: String(data.requestedAmount),
            applicationId: String(data.applicationId),
          }),
        );

      case "ASSISTANCE_APPROVED":
        return render(
          AssistanceApproved({
            patientName: String(data.patientName),
            assistanceType: String(data.assistanceType),
            requestedAmount: String(data.requestedAmount),
            approvedAmount: String(data.approvedAmount),
            reviewNotes: String(data.reviewNotes),
            applicationId: String(data.applicationId),
          }),
        );

      case "ASSISTANCE_DENIED":
        return render(
          AssistanceDenied({
            patientName: String(data.patientName),
            assistanceType: String(data.assistanceType),
            requestedAmount: String(data.requestedAmount),
            reviewNotes: String(data.reviewNotes),
            applicationId: String(data.applicationId),
          }),
        );

      case "DISBURSEMENT_ISSUED":
        return render(
          DisbursementIssued({
            patientName: String(data.patientName),
            assistanceType: String(data.assistanceType),
            amount: String(data.amount),
            paymentMethod: String(data.paymentMethod),
            checkNumber: String(data.checkNumber),
            expectedDate: String(data.expectedDate),
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

      case "WELCOME_EMAIL":
        return render(
          WelcomeEmail({
            patientName: String(data.patientName),
            email: String(data.email),
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

      case "FAMILY_MEMBER_INVITE":
        return render(
          FamilyMemberInvite({
            inviteeName: String(data.inviteeName),
            inviterName: String(data.inviterName),
            familyName: String(data.familyName),
            inviteUrl: String(data.inviteUrl),
          }),
        );

      case "VOLUNTEER_REQUEST_RECEIVED":
        return render(
          VolunteerRequestReceived({
            patientName: String(data.patientName),
            lang: (String(data.lang) as "en" | "es") || "en",
          }),
        );

      case "VOLUNTEER_REQUEST_NOTIFY":
        return render(
          VolunteerRequestNotify({
            patientName: String(data.patientName),
            patientEmail: String(data.patientEmail),
            submittedAt: String(data.submittedAt),
            lang: (String(data.lang) as "en" | "es") || "en",
          }),
        );

      case "VOLUNTEER_APPROVED":
        return render(
          VolunteerApproved({
            patientName: String(data.patientName),
          }),
        );

      case "VOLUNTEER_ASSIGNED":
        return render(
          VolunteerAssigned({
            patientName: String(data.patientName),
            eventTitle: String(data.eventTitle),
            eventDate: String(data.eventDate),
            eventTime: String(data.eventTime),
            location: String(data.location),
            role: String(data.role),
            checkinUrl: String(data.checkinUrl),
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
      eventSlug: params.eventSlug,
    },
    patientId: params.patientId,
    eventId: params.eventId,
  });
}

// Add more helper functions for other email types as needed
