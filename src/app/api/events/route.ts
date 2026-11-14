import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withRsvpPeople } from "@/lib/rsvp/capacity";
import { eventHasEnded } from "@/lib/rsvp/window";
import { publicEventSelect } from "@/lib/events/public-select";

// Never prerender at build time: events change without a redeploy.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();

    const raw = await prisma.event.findMany({
      where: { status: "published" },
      orderBy: { eventDate: "asc" },
      select: publicEventSelect,
    });

    const events = await withRsvpPeople(raw);
    // "Past" = the event has ended (endDate, else start + 12h)
    const upcoming = events.filter((e) => !eventHasEnded(e, now));
    const past = events.filter((e) => eventHasEnded(e, now));

    return NextResponse.json(
      { upcoming, past, events },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
    );
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
