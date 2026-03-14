"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PollsList from "@/components/polls/PollsList";
import CreatePollButton from "@/components/admin/polls/CreatePollButton";
import InviteRepButton from "@/components/admin/polls/InviteRepbutton";
import NewsletterModeToggle from "@/components/admin/newsletter/NewsletterModeToggle";
import type { Lang } from "@/types";

interface Poll {
  id: string;
  questionEn: string;
  questionEs: string;
  options: any[];
  status: string;
  active: boolean;
  selectedForNewsletter: boolean;
  createdBy: string;
  createdAt: Date;
}

interface Props {
  event: { id: string; titleEn: string };
  polls: Poll[];
  adminEmail: string;
  locale: Lang;
  cameFromEvents: boolean;
}

export default function EventPollsClient({
  event,
  polls,
  adminEmail,
  locale,
  cameFromEvents,
}: Props) {
  const [newsletterMode, setNewsletterMode] = useState(false);

  const pendingCount = polls.filter((p) => p.status === "pending").length;
  const selectedCount = polls.filter((p) => p.selectedForNewsletter).length;

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
              Event Polls
            </h1>
            <p className="text-neutral-500 mb-2">{event.titleEn}</p>
            <p className="text-sm text-neutral-400">
              Create and manage live polls for this event
            </p>
          </div>

          <div className="flex gap-3 flex-wrap justify-end">
            <NewsletterModeToggle
              newsletterMode={newsletterMode}
              onToggle={() => setNewsletterMode((v) => !v)}
              selectedCount={selectedCount}
            />
            <InviteRepButton eventId={event.id} />
            <CreatePollButton eventId={event.id} locale={locale} />
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>{pendingCount}</strong> poll
              {pendingCount !== 1 ? "s" : ""} waiting for approval from reps
            </p>
          </div>
        )}

        <PollsList
          eventId={event.id}
          polls={polls}
          adminEmail={adminEmail}
          newsletterMode={newsletterMode}
        />
      </div>
    </div>
  );
}
