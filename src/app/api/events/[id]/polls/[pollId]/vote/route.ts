import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; pollId: string } },
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionToken, optionId } = body;

    // Verify session token is valid for this event
    const checkIn = await prisma.checkIn.findFirst({
      where: {
        eventId: params.id,
        sessionToken,
      },
    });

    if (!checkIn) {
      return NextResponse.json({ error: "Invalid session" }, { status: 403 });
    }

    // Check if already voted
    const existingVote = await prisma.interactionResponse.findFirst({
      where: {
        interactionId: params.pollId,
        sessionToken,
      },
    });

    if (existingVote) {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }

    // Record vote
    await prisma.interactionResponse.create({
      data: {
        interactionId: params.pollId,
        sessionToken,
        responseData: { optionId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
