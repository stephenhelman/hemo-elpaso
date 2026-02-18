import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();

    const events = await prisma.event.findMany({
      where: { status: "published" },
      orderBy: { eventDate: "asc" },
      include: {
        _count: {
          select: { rsvps: true }, // Make sure this is here
        },
      },
    });

    const upcoming = events.filter((e) => new Date(e.eventDate) >= now);
    const past = events.filter((e) => new Date(e.eventDate) < now);

    return NextResponse.json({ upcoming, past });
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
