"use client";

import { useState } from "react";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import QuestionsList from "@/components/admin/questions/QuestionsList";
import NewsletterModeToggle from "@/components/admin/newsletter/NewsletterModeToggle";
import type { Lang } from "@/types";

interface Question {
  id: string;
  questionEn: string;
  questionEs: string;
  originalLang: string;
  patientName: string | null;
  isAnonymous: boolean;
  upvotes: number;
  answered: boolean;
  answerEn: string | null;
  answerEs: string | null;
  answeredAt: Date | null;
  selectedForNewsletter: boolean;
  createdAt: Date;
}

interface Props {
  event: { id: string; titleEn: string };
  questions: Question[];
  adminEmail: string;
  locale: Lang;
  cameFromEvents: boolean;
}

export default function EventQuestionsClient({
  event,
  questions,
  adminEmail,
  locale,
  cameFromEvents,
}: Props) {
  const [newsletterMode, setNewsletterMode] = useState(false);

  const unansweredCount = questions.filter((q) => !q.answered).length;
  const selectedCount = questions.filter((q) => q.selectedForNewsletter).length;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href={
            cameFromEvents ? "/admin/events" : `/admin/events/${event.id}/edit`
          }
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {cameFromEvents ? "Back to Events" : "Back to Event"}
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

          <div className="flex items-center gap-3">
            <NewsletterModeToggle
              newsletterMode={newsletterMode}
              onToggle={() => setNewsletterMode((v) => !v)}
              selectedCount={selectedCount}
            />
            {unansweredCount > 0 && (
              <div className="px-4 py-2 rounded-lg bg-amber-100 text-amber-800 font-semibold">
                {unansweredCount} unanswered
              </div>
            )}
          </div>
        </div>

        <QuestionsList
          eventId={event.id}
          questions={questions}
          adminEmail={adminEmail}
          locale={locale}
          newsletterMode={newsletterMode}
        />
      </div>
    </div>
  );
}
