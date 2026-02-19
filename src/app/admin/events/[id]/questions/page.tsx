import { notFound, redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import QuestionsList from "@/components/admin/questions/QuestionsList";

interface Props {
  params: { id: string };
}

export default async function EventQuestionsPage({ params }: Props) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/api/auth/login");
  }

  const admin = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
  });

  if (!admin || !["board", "admin"].includes(admin.role)) {
    redirect("/portal/dashboard");
  }

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        orderBy: [{ answered: "asc" }, { upvotes: "desc" }],
      },
    },
  });

  if (!event) notFound();

  const unansweredCount = event.questions.filter((q) => !q.answered).length;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href={`/admin/events/${event.id}/edit`}
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              Q&A Dashboard
            </h1>
            <p className="text-neutral-500 mb-2">{event.titleEn}</p>
            <p className="text-sm text-neutral-400">
              Manage questions from attendees
            </p>
          </div>

          {unansweredCount > 0 && (
            <div className="px-4 py-2 rounded-lg bg-amber-100 text-amber-800 font-semibold">
              {unansweredCount} unanswered
            </div>
          )}
        </div>

        <QuestionsList
          eventId={event.id}
          questions={event.questions}
          adminEmail={admin.email}
        />
      </div>
    </div>
  );
}
