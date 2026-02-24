import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import { render } from "@react-email/render";
import RsvpConfirmation from "@/messages/RsvpConfirmation";
import RsvpCancellation from "@/messages/RsvpCancellation";
import EventReminder from "@/messages/EventReminder";
import CheckInConfirmation from "@/messages/CheckInConfirmation";
import { AuditAction } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM =
  process.env.EMAIL_FROM || "HOEP Events <events@events.hemo-el-paso.org>";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!admin || !["board", "admin"].includes(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { testEmail, sampleData } = body;

    if (!testEmail) {
      return NextResponse.json(
        { error: "Test email required" },
        { status: 400 },
      );
    }

    // Get template
    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    // Render subject with sample data
    let subject = template.subject;
    Object.entries(sampleData).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(`{{${key}}}`, "g"), value as string);
    });

    // Get the appropriate React Email component
    const emailHtml = await renderEmailTemplate(template.type, sampleData);

    if (!emailHtml) {
      return NextResponse.json(
        {
          error: "Email template not implemented yet",
        },
        { status: 400 },
      );
    }

    // Send via Resend
    await resend.emails.send({
      from: EMAIL_FROM,
      to: testEmail,
      subject: `[TEST] ${subject}`,
      html: emailHtml,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.TEST_EMAIL_SENT,
        resourceType: "EmailTemplate",
        resourceId: template.id,
        details: `Sent test email to ${testEmail} for template: ${template.name}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send test email" },
      { status: 500 },
    );
  }
}

async function renderEmailTemplate(
  type: string,
  data: any,
): Promise<string | null> {
  try {
    switch (type) {
      case "RSVP_CONFIRMATION":
        return render(
          RsvpConfirmation({
            patientName: data.patientName,
            eventTitle: data.eventTitle,
            eventDate: data.eventDate,
            eventTime: data.eventTime,
            location: data.location,
            adultsCount: parseInt(data.adultsCount) || 2,
            childrenCount: parseInt(data.childrenCount) || 1,
            qrCodeDataUrl: "https://via.placeholder.com/250x250?text=QR+Code",
            eventSlug: data.eventSlug,
          }),
        );

      case "RSVP_CANCELLATION":
        return render(
          RsvpCancellation({
            patientName: data.patientName,
            eventTitle: data.eventTitle,
            eventDate: data.eventDate,
            eventTime: data.eventTime,
            eventSlug: data.eventSlug,
          }),
        );

      case "RSVP_REMINDER":
        return render(
          EventReminder({
            patientName: data.patientName,
            eventTitle: data.eventTitle,
            eventDate: data.eventDate,
            eventTime: data.eventTime,
            location: data.location,
            adultsCount: parseInt(data.adultsCount) || 2,
            childrenCount: parseInt(data.childrenCount) || 1,
            qrCodeDataUrl: "https://via.placeholder.com/250x250?text=QR+Code",
            eventSlug: data.eventSlug,
          }),
        );

      case "CHECK_IN_CONFIRMATION":
        return render(
          CheckInConfirmation({
            patientName: data.patientName,
            eventTitle: data.eventTitle,
            eventDate: data.eventDate,
            eventTime: data.eventTime,
            location: data.location,
            checkInTime: data.checkInTime,
            liveEventUrl: data.liveEventUrl,
          }),
        );

      // TODO: Implement other templates as we create them
      case "EVENT_PUBLISHED":
      case "EVENT_CANCELLED":
      case "ASSISTANCE_SUBMITTED":
      case "ASSISTANCE_APPROVED":
      case "ASSISTANCE_DENIED":
      case "DISBURSEMENT_ISSUED":
      case "WELCOME_EMAIL":
        return `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #8B1538;">Email Preview Coming Soon</h1>
            <p>This email template (${type}) will be implemented soon.</p>
            <p><strong>Subject:</strong> ${data.subject || "Test Subject"}</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <h3>Sample Data:</h3>
              <pre style="white-space: pre-wrap; font-size: 12px;">${JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        `;

      default:
        return null;
    }
  } catch (error) {
    console.error("Email render error:", error);
    return null;
  }
}
