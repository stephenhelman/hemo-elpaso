import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } },
) {
  try {
    const body = await request.json();
    const { sessionToken } = body;

    // Verify session token
    const checkIn = await prisma.checkIn.findFirst({
      where: {
        eventId: params.id,
        sessionToken,
      },
    });

    if (!checkIn) {
      return NextResponse.json({ error: "Not checked in" }, { status: 403 });
    }

    // Get question
    const question = await prisma.eventQuestion.findUnique({
      where: { id: params.questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    // Check if already upvoted
    if (question.upvotedBy.includes(sessionToken)) {
      return NextResponse.json({ error: "Already upvoted" }, { status: 409 });
    }

    // Add upvote
    await prisma.eventQuestion.update({
      where: { id: params.questionId },
      data: {
        upvotes: { increment: 1 },
        upvotedBy: { push: sessionToken },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upvote error:", error);
    return NextResponse.json({ error: "Failed to upvote" }, { status: 500 });
  }
}
