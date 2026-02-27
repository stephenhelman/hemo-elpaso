import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { PollOption } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, eventId, repEmail, questionEn, questionEs, options } = body;

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
    const poll = await prisma.poll.create({
      data: {
        eventId,
        questionEn,
        questionEs,
        options: options.map((opt: PollOption) => ({
          textEn: opt.textEn,
          textEs: opt.textEs,
        })),
        status: "pending",
        active: false,
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
