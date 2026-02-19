import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } },
) {
  try {
    const body = await request.json();
    const { sessionToken, answerEn, answerEs, answeredBy } = body;

    // Verify session token and check role
    const checkIn = await prisma.checkIn.findFirst({
      where: {
        eventId: params.id,
        sessionToken,
      },
    });

    if (!checkIn) {
      return NextResponse.json({ error: "Not checked in" }, { status: 403 });
    }

    // Only sponsors and admins can answer
    if (
      checkIn.attendeeRole !== "sponsor" &&
      checkIn.attendeeRole !== "admin"
    ) {
      return NextResponse.json(
        { error: "Only sponsors can answer questions" },
        { status: 403 },
      );
    }

    // Update question with answer
    const question = await prisma.eventQuestion.update({
      where: { id: params.questionId },
      data: {
        answered: true,
        answerEn,
        answerEs,
        answeredBy,
        answeredAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error("Answer save error:", error);
    return NextResponse.json(
      { error: "Failed to save answer" },
      { status: 500 },
    );
  }
}
