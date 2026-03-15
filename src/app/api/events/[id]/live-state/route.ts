import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface Props {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Props) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      presentation: true,
      itineraryItems: { orderBy: { sequenceOrder: "asc" } },
      announcements: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
      },
      polls: {
        where: { active: true },
        include: { options: true, responses: true },
      },
      questions: {
        orderBy: [{ upvotes: "desc" }, { createdAt: "asc" }],
        take: 50,
      },
      photos: {
        where: { approved: true },
        orderBy: { uploadedAt: "desc" },
        take: 24,
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({
    // Bilingual presentation fields
    presentation: event.presentation
      ? {
          currentSlide: event.presentation.currentSlide,
          isLive: event.presentation.isLive,
          slideUrlsEn: event.presentation.slideUrlsEn,
          slideUrlsEs: event.presentation.slideUrlsEs,
          totalSlidesEn: event.presentation.totalSlidesEn,
          totalSlidesEs: event.presentation.totalSlidesEs,
        }
      : null,

    itinerary: event.itineraryItems.map((item) => ({
      id: item.id,
      titleEn: item.titleEn,
      titleEs: item.titleEs,
      descriptionEn: item.descriptionEn,
      descriptionEs: item.descriptionEs,
      startTime: item.startTime,
      endTime: item.endTime,
      status: item.status,
      sequenceOrder: item.sequenceOrder,
      location: item.location,
    })),

    announcements: event.announcements.map((a) => ({
      id: a.id,
      messageEn: a.messageEn,
      messageEs: a.messageEs,
      priority: a.priority,
      createdAt: a.createdAt,
    })),

    activePolls: event.polls.map((poll) => ({
      id: poll.id,
      questionEn: poll.questionEn,
      questionEs: poll.questionEs,
      options: poll.options.map((opt) => ({
        id: opt.id,
        textEn: opt.textEn,
        textEs: opt.textEs,
        voteCount: poll.responses.filter((r) => r.selectedOptionId === opt.id)
          .length,
      })),
      totalResponses: poll.responses.length,
    })),

    questionCount: event.questions.length,
    approvedPhotoCount: event.photos.length,

    questions: event.questions.map((q) => ({
      id: q.id,
      questionEn: q.questionEn,
      questionEs: q.questionEs,
      upvotes: q.upvotes,
      answered: q.answered,
      answerEn: q.answerEn,
      answerEs: q.answerEs,
      isAnonymous: q.isAnonymous,
      patientName: q.isAnonymous ? null : q.patientName,
    })),

    photos: event.photos.map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
      uploadedAt: p.uploadedAt,
    })),
  });
}
