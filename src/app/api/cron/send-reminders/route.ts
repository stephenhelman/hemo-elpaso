import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { render } from "@react-email/render";
import EventReminder from "@/messages/EventReminder";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  try {
    // Verify this is actually from Vercel Cron (optional but recommended)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tomorrow's date range
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    console.log(
      `Checking for events between ${tomorrow.toISOString()} and ${dayAfterTomorrow.toISOString()}`,
    );

    // Find all events happening tomorrow
    const upcomingEvents = await prisma.event.findMany({
      where: {
        status: "published",
        eventDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
      },
      include: {
        rsvps: {
          where: {
            reminderSent: false, // ADD THIS - only get RSVPs that haven't received reminder
          },
          include: {
            patient: {
              include: {
                contactProfile: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${upcomingEvents.length} events tomorrow`);

    let emailsSent = 0;
    let emailsFailed = 0;

    // Send reminders for each event
    for (const event of upcomingEvents) {
      console.log(
        `Processing event: ${event.titleEn} with ${event.rsvps.length} RSVPs`,
      );

      for (const rsvp of event.rsvps) {
        try {
          // Generate QR code for this RSVP
          const qrData = `RSVP-${rsvp.id}`;
          const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            width: 500,
            margin: 2,
            color: {
              dark: "#8B1538",
              light: "#FFFFFF",
            },
          });

          // Convert to buffer
          const base64Data = qrCodeDataURL.replace(
            /^data:image\/png;base64,/,
            "",
          );
          const qrBuffer = Buffer.from(base64Data, "base64");

          // Render email
          const emailHtml = await render(
            EventReminder({
              patientName: `${rsvp.patient.contactProfile?.firstName} ${rsvp.patient.contactProfile?.lastName}`,
              eventTitle: event.titleEn,
              eventDate: new Date(event.eventDate).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
              eventTime: new Date(event.eventDate).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              }),
              location: event.location,
              adultsCount: rsvp.adultsAttending,
              childrenCount: rsvp.childrenAttending,
              qrCodeDataUrl: "cid:qrcode",
              eventSlug: event.slug,
            }),
          );

          // Send email
          await resend.emails.send({
            from: EMAIL_FROM,
            replyTo: "info@hemo-el-paso.org",
            to: rsvp.patient.email,
            subject: `Reminder: ${event.titleEn} is Tomorrow!`,
            html: emailHtml,
            attachments: [
              {
                filename: "qr-code.png",
                content: qrBuffer,
                contentId: "qrcode",
              },
            ],
          });

          await prisma.rsvp.update({
            where: { id: rsvp.id },
            data: { reminderSent: true },
          });

          emailsSent++;
          console.log(`✓ Sent reminder to ${rsvp.patient.email}`);
        } catch (error) {
          console.error(
            `✗ Failed to send reminder to ${rsvp.patient.email}:`,
            error,
          );
          emailsFailed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      eventsProcessed: upcomingEvents.length,
      emailsSent,
      emailsFailed,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        error: "Cron job failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
