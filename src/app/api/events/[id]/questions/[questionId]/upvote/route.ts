import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pusherServer, eventChannel, PUSHER_EVENTS } from "@/lib/pusher-server";

interface Props {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Props) {
  try {
    const body = await req.json();
    const {
      question,
      sessionToken,
      patientId,
      patientName,
      isAnonymous,
      lang,
    } = body;

    if (!question?.trim() || !sessionToken) {
      return NextResponse.json(
        { error: "question and sessionToken are required" },
        { status: 400 },
      );
    }

    // Verify session
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

    // Auto-translate to the other language
    // For now store same text in both — translation can be added later
    const questionEn = lang === "es" ? question : question;
    const questionEs = lang === "es" ? question : question;

    const eventQuestion = await prisma.eventQuestion.create({
      data: {
        eventId: params.id,
        questionEn,
        questionEs,
        originalLang: lang ?? "en",
        patientId: patientId ?? null,
        patientName: isAnonymous ? null : (patientName ?? null),
        isAnonymous: isAnonymous ?? false,
        sessionToken,
      },
    });

    // Trigger Pusher — Q&A tab appears for all attendees instantly
    // Presenter panel also gets the new question immediately
    await pusherServer.trigger(
      eventChannel(params.id),
      PUSHER_EVENTS.QUESTION_ADDED,
      {
        question: {
          id: eventQuestion.id,
          questionEn: eventQuestion.questionEn,
          questionEs: eventQuestion.questionEs,
          upvotes: 0,
          answered: false,
          answerEn: null,
          answerEs: null,
          isAnonymous: eventQuestion.isAnonymous,
          patientName: eventQuestion.isAnonymous
            ? null
            : eventQuestion.patientName,
        },
      },
    );

    return NextResponse.json({ question: eventQuestion });
  } catch (error) {
    console.error("Question submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit question" },
      { status: 500 },
    );
  }
}
