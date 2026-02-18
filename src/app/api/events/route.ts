import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();

    const upcoming = await prisma.event.findMany({
      where: {
        status: "published",
        eventDate: {
          gte: now,
        },
      },
      orderBy: {
        eventDate: "asc",
      },
      take: 10,
    });

    const past = await prisma.event.findMany({
      where: {
        status: "completed",
        eventDate: {
          lt: now,
        },
      },
      orderBy: {
        eventDate: "desc",
      },
      take: 6,
    });

    return NextResponse.json({ upcoming, past });
  } catch (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json({ upcoming: [], past: [] });
  }
}
