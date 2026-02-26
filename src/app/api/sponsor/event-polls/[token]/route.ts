import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const tokenData = await prisma.pollCreationToken.findUnique({
      where: { token },
      include: { event: true },
    });

    if (!tokenData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    if (new Date() > tokenData.expiresAt) {
      return NextResponse.json({ error: "Token expired" }, { status: 410 });
    }

    const existingPolls = await prisma.eventInteraction.findMany({
      where: {
        eventId: tokenData.eventId,
        createdBy: `rep:${tokenData.repEmail}`,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tokenData, existingPolls });
  } catch (error) {
    console.error("Event polls token error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
