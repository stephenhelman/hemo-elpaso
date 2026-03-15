import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export interface NewsletterEventRecap {
  eventId: string;
  titleEn: string;
  titleEs: string;
  date: string;
  location: string;
  attendanceCount: number;
  polls: {
    id: string;
    questionEn: string;
    questionEs: string;
    options: { id: string; textEn: string; textEs: string }[];
    totalResponses: number;
  }[];
  questions: {
    id: string;
    questionEn: string;
    questionEs: string;
    upvotes: number;
    answerEn: string | null;
    answerEs: string | null;
  }[];
  photos: {
    id: string;
    url: string;
    caption: string | null;
  }[];
}

export interface NewsletterUpcomingEvent {
  eventId: string;
  titleEn: string;
  titleEs: string;
  date: string;
  location: string;
}

export interface NewsletterContent {
  month: number;
  year: number;
  eventRecaps: NewsletterEventRecap[];
  upcomingEvents: NewsletterUpcomingEvent[];
}

export async function generateNewsletterContent(
  month: number,
  year: number,
): Promise<NewsletterContent> {
  // Date range: first to last day of the given month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Upcoming events: next 60 days from today
  const today = new Date();
  const upcomingCutoff = new Date();
  upcomingCutoff.setDate(today.getDate() + 60);

  // Pull past events with selected newsletter items
  const pastEvents = await prisma.event.findMany({
    where: {
      eventDate: { gte: startDate, lte: endDate },
      status: { in: ["completed", "published"] },
      OR: [
        { polls: { some: { selectedForNewsletter: true } } },
        { questions: { some: { selectedForNewsletter: true } } },
        { photos: { some: { selectedForNewsletter: true, approved: true } } },
      ],
    },
    include: {
      polls: {
        where: { selectedForNewsletter: true },
        include: {
          options: true,
          responses: true,
        },
      },
      questions: {
        where: { selectedForNewsletter: true },
      },
      photos: {
        where: { selectedForNewsletter: true, approved: true },
      },
      checkIns: true,
    },
    orderBy: { eventDate: "asc" },
  });

  // Pull upcoming events
  const upcomingEvents = await prisma.event.findMany({
    where: {
      eventDate: { gt: today, lte: upcomingCutoff },
      status: "published",
    },
    orderBy: { eventDate: "asc" },
    take: 6,
  });

  // Shape event recaps
  const eventRecaps: NewsletterEventRecap[] = pastEvents.map((event) => ({
    eventId: event.id,
    titleEn: event.titleEn,
    titleEs: event.titleEs,
    date: event.eventDate.toISOString(),
    location: event.location,
    attendanceCount: event.checkIns.length,
    polls: event.polls.map((poll) => ({
      id: poll.id,
      questionEn: poll.questionEn,
      questionEs: poll.questionEs,
      options: poll.options.map((opt) => ({
        id: opt.id,
        textEn: opt.textEn,
        textEs: opt.textEs,
      })),
      totalResponses: poll.responses.length,
    })),
    questions: event.questions.map((q) => ({
      id: q.id,
      questionEn: q.questionEn,
      questionEs: q.questionEs,
      upvotes: q.upvotes,
      answerEn: q.answerEn,
      answerEs: q.answerEs,
    })),
    photos: event.photos.map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
    })),
  }));

  // Shape upcoming events
  const upcoming: NewsletterUpcomingEvent[] = upcomingEvents.map((event) => ({
    eventId: event.id,
    titleEn: event.titleEn,
    titleEs: event.titleEs,
    date: event.eventDate.toISOString(),
    location: event.location,
  }));

  return {
    month,
    year,
    eventRecaps,
    upcomingEvents: upcoming,
  };
}

export async function createNewsletterDraft(
  month: number,
  year: number,
  triggeredBy: string,
): Promise<{ newsletter: any; alreadyExists: boolean }> {
  // Check if a newsletter already exists for this month
  const existing = await prisma.newsletter.findUnique({
    where: { month_year: { month, year } },
  });

  if (existing && existing.status !== "CHANGES_REQUESTED") {
    return { newsletter: existing, alreadyExists: true };
  }

  const content = await generateNewsletterContent(month, year);

  // If it was CHANGES_REQUESTED, update it. Otherwise create fresh.
  const newsletter = existing
    ? await prisma.newsletter.update({
        where: { id: existing.id },
        data: {
          generatedContentJson: content as any,
          status: "PENDING_APPROVAL",
          revisionNotes: null,
        },
      })
    : await prisma.newsletter.create({
        data: {
          month,
          year,
          status: "PENDING_APPROVAL",
          generatedContentJson: content as any,
        },
      });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: AuditAction.NEWSLETTER_GENERATED,
      resourceType: "Newsletter",
      resourceId: newsletter.id,
      details: `Newsletter draft generated for ${month}/${year} by ${triggeredBy}`,
    },
  });

  return { newsletter, alreadyExists: false };
}
