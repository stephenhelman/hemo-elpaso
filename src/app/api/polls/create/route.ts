import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, eventId, repEmail, titleEn, titleEs, options } = body;

    // Verify token
    const tokenData = await prisma.pollCreationToken.findUnique({
      where: { token },
    });

    if (!tokenData) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (new Date() > tokenData.expiresAt) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    if (tokenData.eventId !== eventId) {
      return NextResponse.json({ error: "Token mismatch" }, { status: 401 });
    }

    // Validate options
    if (!options || options.length < 2 || options.length > 6) {
      return NextResponse.json(
        { error: "Poll must have 2-6 options" },
        { status: 400 },
      );
    }

    // Create poll in pending status
    const poll = await prisma.eventInteraction.create({
      data: {
        eventId,
        type: "poll",
        titleEn,
        titleEs,
        options: { options },
        status: "pending", // Needs admin approval
        active: false,
        sequenceOrder: 0,
        createdBy: `rep:${repEmail}`,
      },
    });

    return NextResponse.json({ success: true, poll });
  } catch (error) {
    console.error("Rep poll creation error:", error);
    return NextResponse.json(
      { error: "Failed to create poll" },
      { status: 500 },
    );
  }
}
