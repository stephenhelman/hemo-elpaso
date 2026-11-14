import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEventReminderEmail } from "@/lib/rsvp";

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
            reminderSent: false, // only RSVPs that haven't received a reminder
            patient: { email: { not: null } },
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
          await sendEventReminderEmail({
            rsvp,
            patient: rsvp.patient,
            event,
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
