import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pusherServer, eventChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

interface Props {
  params: { id: string; pollId: string };
}

export async function POST(req: NextRequest, { params }: Props) {
  try {
    const { optionId, sessionToken } = await req.json();

    if (!optionId || !sessionToken) {
      return NextResponse.json(
        { error: "optionId and sessionToken are required" },
        { status: 400 },
      );
    }

    // Verify session is valid for this event
    const checkIn = await prisma.checkIn.findFirst({
      where: {
        eventId: params.id,
        sessionToken,
        sessionExpiresAt: { gt: new Date() },
      },
    });

    if (!checkIn) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 },
      );
    }

    // Check poll is active
    const poll = await prisma.poll.findFirst({
      where: { id: params.pollId, eventId: params.id, active: true },
      include: { options: true },
    });

    if (!poll) {
      return NextResponse.json(
        { error: "Poll not found or not active" },
        { status: 404 },
      );
    }

    // Check option belongs to this poll
    const optionExists = poll.options.some((o) => o.id === optionId);
    if (!optionExists) {
      return NextResponse.json({ error: "Invalid option" }, { status: 400 });
    }

    // Record vote (unique per session per poll)
    try {
      await prisma.pollResponse.create({
        data: {
          pollId: params.pollId,
          sessionToken,
          selectedOptionId: optionId,
        },
      });
    } catch {
      return NextResponse.json(
        { error: "You have already voted on this poll" },
        { status: 409 },
      );
    }

    // Get updated vote counts
    const updatedResponses = await prisma.pollResponse.findMany({
      where: { pollId: params.pollId },
    });

    const updatedOptions = poll.options.map((opt) => ({
      id: opt.id,
      textEn: opt.textEn,
      textEs: opt.textEs,
      voteCount: updatedResponses.filter((r) => r.selectedOptionId === opt.id)
        .length,
    }));

    // Trigger Pusher — all attendees see updated vote counts instantly
    await pusherServer.trigger(
      eventChannel(params.id),
      PUSHER_EVENTS.POLL_VOTE,
      {
        pollId: params.pollId,
        options: updatedOptions,
        totalResponses: updatedResponses.length,
      },
    );

    return NextResponse.json({ success: true, options: updatedOptions });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 },
    );
  }
}
