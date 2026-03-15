import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } },
) {
  try {
    const { error } = await requirePermission("canViewEventStats");
    if (error) return error;

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
