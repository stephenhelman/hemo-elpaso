import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pusherServer, eventChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

interface Props {
  params: { id: string; questionId: string };
}

export async function POST(req: NextRequest, { params }: Props) {
  try {
    const { sessionToken } = await req.json();

    if (!sessionToken) {
      return NextResponse.json(
        { error: "sessionToken required" },
        { status: 400 },
      );
    }

    const question = await prisma.eventQuestion.findUnique({
      where: { id: params.questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    // Prevent double upvoting
    if (question.upvotedBy.includes(sessionToken)) {
      return NextResponse.json({ error: "Already upvoted" }, { status: 409 });
    }

    const updated = await prisma.eventQuestion.update({
      where: { id: params.questionId },
      data: {
        upvotes: { increment: 1 },
        upvotedBy: { push: sessionToken },
      },
    });

    // Trigger Pusher — upvote count updates in real time for everyone
    await pusherServer.trigger(
      eventChannel(params.id),
      PUSHER_EVENTS.QUESTION_UPVOTED,
      {
        questionId: params.questionId,
        upvotes: updated.upvotes,
      },
    );

    return NextResponse.json({ upvotes: updated.upvotes });
  } catch (error) {
    console.error("Upvote error:", error);
    return NextResponse.json({ error: "Failed to upvote" }, { status: 500 });
  }
}
