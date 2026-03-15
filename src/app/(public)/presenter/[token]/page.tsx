import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PresenterControlPanel from "@/components/presenter/PresenterControlPanel";

interface Props {
  params: { token: string };
}

export default async function PresenterPage({ params }: Props) {
  const presenterToken = await prisma.presenterAccessToken.findUnique({
    where: { token: params.token },
    include: {
      event: {
        include: {
          presentation: true,
          itineraryItems: { orderBy: { sequenceOrder: "asc" } },
          announcements: {
            where: { active: true },
            orderBy: { createdAt: "desc" },
          },
          polls: {
            include: { options: true, responses: true },
            orderBy: { createdAt: "asc" },
          },
          questions: {
            orderBy: [{ upvotes: "desc" }, { createdAt: "asc" }],
          },
          photos: {
            where: { approved: false, source: "live" },
            orderBy: { uploadedAt: "desc" },
          },
        },
      },
    },
  });

  if (!presenterToken) notFound();

  if (presenterToken.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
            Link Expired
          </h1>
          <p className="text-neutral-500">
            This presenter link has expired. Please contact the event organizer
            for a new link.
          </p>
        </div>
      </div>
    );
  }

  const event = presenterToken.event;

  return (
    <PresenterControlPanel
      token={params.token}
      event={{
        id: event.id,
        titleEn: event.titleEn,
        titleEs: event.titleEs,
        presentation: event.presentation
          ? {
              id: event.presentation.id,
              currentSlide: event.presentation.currentSlide,
              totalSlides: event.presentation.totalSlides,
              slideUrls: event.presentation.slideUrls,
              isLive: event.presentation.isLive,
            }
          : null,
        itinerary: event.itineraryItems.map((i) => ({
          id: i.id,
          titleEn: i.titleEn,
          titleEs: i.titleEs,
          status: i.status,
          sequenceOrder: i.sequenceOrder,
          startTime: i.startTime.toISOString(),
          location: i.location,
        })),
        announcements: event.announcements.map((a) => ({
          id: a.id,
          messageEn: a.messageEn,
          messageEs: a.messageEs,
          priority: a.priority,
        })),
        polls: event.polls.map((p) => ({
          id: p.id,
          questionEn: p.questionEn,
          questionEs: p.questionEs,
          status: p.status,
          active: p.active,
          options: p.options,
          responseCount: p.responses.length,
        })),
        questions: event.questions.map((q) => ({
          id: q.id,
          questionEn: q.questionEn,
          questionEs: q.questionEs,
          upvotes: q.upvotes,
          answered: q.answered,
          answerEn: q.answerEn,
          answerEs: q.answerEs,
          isAnonymous: q.isAnonymous,
          patientName: q.patientName,
        })),
        pendingPhotos: event.photos.map((p) => ({
          id: p.id,
          url: p.url,
          caption: p.caption,
          uploadedAt: p.uploadedAt.toISOString(),
        })),
      }}
      presenterName={presenterToken.presenterName ?? undefined}
    />
  );
}
