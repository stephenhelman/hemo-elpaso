import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { reissueCheckInToken } from "@/lib/rsvp";

/**
 * Day-before reminders for ACTIVE yes-RSVPs that have an email.
 * Transactional: sent even to people who opted out of invitations.
 * Raw check-in tokens aren't stored (only hashes), so the reminder mints a
 * fresh token; the QR in the reminder replaces the one in the confirmation.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const rsvps = await prisma.rsvp.findMany({
      where: {
        cancelledAt: null,
        reminderSent: false,
        patient: { email: { not: null } },
        event: { status: "published", eventDate: { gte: tomorrow, lt: dayAfter } },
      },
      select: { id: true },
    });

    let emailsSent = 0;
    let emailsFailed = 0;
    for (const r of rsvps) {
      const res = await reissueCheckInToken(r.id, "reminder");
      if (res?.sent) {
        await prisma.rsvp.update({ where: { id: r.id }, data: { reminderSent: true } });
        emailsSent++;
      } else {
        emailsFailed++;
      }
    }

    return NextResponse.json({ success: true, rsvps: rsvps.length, emailsSent, emailsFailed });
  } catch {
    console.error("Reminder cron failed");
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
