import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { tomorrowRangeUtc } from "@/lib/datetime";
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

    // "Tomorrow" is tomorrow's calendar date in Mountain Time, converted to UTC for the query
    // (the server runs in UTC: setHours(0,0,0,0) there is 6pm/5pm the evening before in El Paso).
    const { start: tomorrow, end: dayAfter } = tomorrowRangeUtc();

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
      // Claim the RSVP atomically BEFORE sending: an overlapping or retried run sees count 0 and skips,
      // so a family can never get two reminders. If the send fails, release the claim for the next run.
      const claim = await prisma.rsvp.updateMany({
        where: { id: r.id, reminderSent: false, cancelledAt: null },
        data: { reminderSent: true },
      });
      if (claim.count === 0) continue;
      const res = await reissueCheckInToken(r.id, "reminder");
      if (res?.sent) {
        emailsSent++;
      } else {
        await prisma.rsvp.update({ where: { id: r.id }, data: { reminderSent: false } });
        emailsFailed++;
      }
    }

    return NextResponse.json({ success: true, rsvps: rsvps.length, emailsSent, emailsFailed });
  } catch {
    console.error("Reminder cron failed");
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
