import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is board/admin
    const admin = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!admin || !["board", "admin"].includes(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all check-ins for this event
    const checkIns = await prisma.checkIn.findMany({
      where: {
        eventId: params.eventId,
      },
      include: {
        patient: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        checkInTime: "desc",
      },
    });

    return NextResponse.json({
      checkIns,
      count: checkIns.length,
    });
  } catch (error) {
    console.error("Fetch check-ins error:", error);
    return NextResponse.json(
      { error: "Failed to fetch check-ins" },
      { status: 500 },
    );
  }
}
