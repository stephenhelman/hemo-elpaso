import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { pusherServer, eventChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

interface Props {
  params: { questionId: string };
}

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const body = await req.json();
    const { answerEn, answerEs, answeredBy } = body;

    if (!answerEn?.trim()) {
      return NextResponse.json(
        { error: "Answer is required" },
        { status: 400 },
      );
    }

    const question = await prisma.eventQuestion.update({
      where: { id: params.questionId },
      data: {
        answerEn,
        answerEs: answerEs || answerEn,
        answered: true,
        answeredBy,
        answeredAt: new Date(),
      },
    });

    // Trigger Pusher — answered question updates instantly on attendee Q&A tab
    await pusherServer.trigger(
      eventChannel(question.eventId),
      PUSHER_EVENTS.QUESTION_ANSWERED,
      {
        questionId: question.id,
        answerEn: question.answerEn,
        answerEs: question.answerEs,
      },
    );

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Answer error:", error);
    return NextResponse.json(
      { error: "Failed to save answer" },
      { status: 500 },
    );
  }
}
