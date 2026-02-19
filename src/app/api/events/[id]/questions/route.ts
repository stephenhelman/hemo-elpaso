import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { translateText, detectLanguage } from "@/lib/translate";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get("sessionToken");
    const filter = searchParams.get("filter") || "all";

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Session token required" },
        { status: 401 },
      );
    }

    // Verify session token is valid
    const checkIn = await prisma.checkIn.findFirst({
      where: {
        eventId: params.id,
        sessionToken,
      },
    });

    if (!checkIn) {
      return NextResponse.json({ error: "Not checked in" }, { status: 403 });
    }

    // Build filter
    const where: any = { eventId: params.id };
    if (filter === "answered") {
      where.answered = true;
    } else if (filter === "unanswered") {
      where.answered = false;
    }

    // Get questions
    const questions = await prisma.eventQuestion.findMany({
      where,
      orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
    });

    // Check which questions this user has upvoted
    const questionsWithVotes = questions.map((q) => ({
      ...q,
      hasUpvoted: q.upvotedBy.includes(sessionToken),
    }));

    return NextResponse.json({ questions: questionsWithVotes });
  } catch (error) {
    console.error("Questions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionToken, patientId, patientName, isAnonymous, question } =
      body;

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

    // Detect language and translate
    const detectedLang = await detectLanguage(question);
    let questionEn = question;
    let questionEs = question;

    if (detectedLang === "es") {
      // Original is Spanish, translate to English
      const translation = await translateText(question, "en");
      questionEn = translation.translatedText;
    } else {
      // Original is English, translate to Spanish
      const translation = await translateText(question, "es");
      questionEs = translation.translatedText;
    }

    // Create question
    const newQuestion = await prisma.eventQuestion.create({
      data: {
        eventId: params.id,
        questionEn,
        questionEs,
        originalLang: detectedLang,
        patientId: isAnonymous ? null : patientId,
        patientName: isAnonymous ? null : patientName,
        isAnonymous,
        sessionToken,
        upvotes: 0,
        upvotedBy: [],
      },
    });

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error) {
    console.error("Question submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit question" },
      { status: 500 },
    );
  }
}
