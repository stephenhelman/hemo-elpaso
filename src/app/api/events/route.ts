import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withRsvpPeople } from "@/lib/rsvp/capacity";
import { eventHasEnded } from "@/lib/rsvp/window";

export async function GET() {
  try {
    const now = new Date();

    const raw = await prisma.event.findMany({
      where: { status: "published" },
      orderBy: { eventDate: "asc" },
      include: {
        _count: {
          select: { rsvps: { where: { cancelledAt: null } } }, // Make sure this is here
        },
      },
    });

    const events = await withRsvpPeople(raw);
    // "Past" = the event has ended (endDate, else start + 12h)
    const upcoming = events.filter((e) => !eventHasEnded(e, now));
    const past = events.filter((e) => eventHasEnded(e, now));

    return NextResponse.json({ upcoming, past, events });
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
