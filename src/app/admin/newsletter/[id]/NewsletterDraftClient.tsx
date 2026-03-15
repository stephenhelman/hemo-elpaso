"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Calendar,
  MapPin,
  Users,
  BarChart3,
  HelpCircle,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import NewsletterActionModal from "@/components/admin/newsletter/NewsletterActionModal";
import type { NewsletterContent } from "@/lib/newsletter-generator";

interface Newsletter {
  id: string;
  month: number;
  year: number;
  monthName: string;
  status: string;
  revisionNotes: string | null;
  generatedContentJson: NewsletterContent;
}

interface Props {
  newsletter: Newsletter;
  isPresident: boolean;
  adminEmail: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    bg: "bg-neutral-100",
    text: "text-neutral-600",
    icon: <Clock className="w-4 h-4" />,
  },
  PENDING_APPROVAL: {
    label: "Pending Your Approval",
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: <Clock className="w-4 h-4" />,
  },
  CHANGES_REQUESTED: {
    label: "Changes Requested",
    bg: "bg-red-100",
    text: "text-red-700",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  APPROVED: {
    label: "Approved",
    bg: "bg-green-100",
    text: "text-green-700",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  SENT: {
    label: "Sent",
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: <Send className="w-4 h-4" />,
  },
};

export default function NewsletterDraftClient({
  newsletter,
  isPresident,
  adminEmail,
}: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<"publish" | "revision" | null>(null);
  const content = newsletter.generatedContentJson;
  const status = STATUS_CONFIG[newsletter.status] || STATUS_CONFIG.DRAFT;

  const handleModalSuccess = () => {
    setModal(null);
    toast.success(
      modal === "publish"
        ? "Newsletter sent successfully!"
        : "Feedback submitted. The Communications Liaison has been notified.",
    );
    router.refresh();
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <Link
          href="/admin/newsletter"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Newsletters
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
              {newsletter.monthName} {newsletter.year} Newsletter
            </h1>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${status.bg} ${status.text}`}
            >
              {status.icon}
              {status.label}
            </div>
          </div>

          {/* Actions — President only, only when pending */}
          {isPresident && newsletter.status === "PENDING_APPROVAL" && (
            <div className="flex gap-3">
              <button
                onClick={() => setModal("revision")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-300 text-amber-700 font-semibold hover:bg-amber-50 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Request Changes
              </button>
              <button
                onClick={() => setModal("publish")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Approve & Send
              </button>
            </div>
          )}
        </div>

        {/* Revision notes banner */}
        {newsletter.status === "CHANGES_REQUESTED" &&
          newsletter.revisionNotes && (
            <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-sm font-semibold text-amber-800 mb-1">
                Revision Notes from President:
              </p>
              <p className="text-sm text-amber-700">
                {newsletter.revisionNotes}
              </p>
            </div>
          )}

        {/* Empty state */}
        {content.eventRecaps.length === 0 && (
          <div className="mb-8 p-6 rounded-xl bg-neutral-50 border border-neutral-200 text-center">
            <BarChart3 className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600 font-semibold mb-1">
              No event content selected yet
            </p>
            <p className="text-sm text-neutral-400">
              Go to each event page and use Newsletter Mode to flag polls,
              questions, and photos for inclusion.
            </p>
          </div>
        )}

        {/* Event Recaps */}
        {content.eventRecaps.map((recap) => (
          <div
            key={recap.eventId}
            className="bg-white rounded-2xl border border-neutral-200 p-6 mb-6"
          >
            <h2 className="text-xl font-display font-bold text-neutral-900 mb-2">
              {recap.titleEn}
            </h2>
            <div className="flex items-center gap-4 text-sm text-neutral-500 mb-6">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(recap.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {recap.location}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {recap.attendanceCount} attended
              </span>
            </div>

            {/* Polls */}
            {recap.polls.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Polls ({recap.polls.length})
                </h3>
                <div className="space-y-3">
                  {recap.polls.map((poll) => (
                    <div
                      key={poll.id}
                      className="p-4 rounded-lg bg-neutral-50 border border-neutral-200"
                    >
                      <p className="font-medium text-neutral-900 mb-1">
                        {poll.questionEn}
                      </p>
                      <p className="text-sm text-neutral-500 mb-2">
                        {poll.questionEs}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {poll.options.map((opt) => (
                          <span
                            key={opt.id}
                            className="px-2 py-1 rounded-full bg-white border border-neutral-200 text-xs text-neutral-600"
                          >
                            {opt.textEn}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-neutral-400 mt-2">
                        {poll.totalResponses} response
                        {poll.totalResponses !== 1 ? "s" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions */}
            {recap.questions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  Q&A Highlights ({recap.questions.length})
                </h3>
                <div className="space-y-3">
                  {recap.questions.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-lg bg-neutral-50 border border-neutral-200"
                    >
                      <p className="font-medium text-neutral-900 mb-1">
                        {q.questionEn}
                      </p>
                      <p className="text-sm text-neutral-500 mb-2">
                        {q.questionEs}
                      </p>
                      {q.answerEn && (
                        <div className="mt-2 pt-2 border-t border-neutral-200">
                          <p className="text-sm text-neutral-700">
                            <strong>Answer:</strong> {q.answerEn}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-neutral-400 mt-2">
                        {q.upvotes} upvote{q.upvotes !== 1 ? "s" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {recap.photos.length > 0 && (
              <div>
                <h3 className="font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Photos ({recap.photos.length})
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {recap.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-lg overflow-hidden border border-neutral-200"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || "Event photo"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Mark Your Calendar */}
        {content.upcomingEvents.length > 0 && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-6">
            <h2 className="text-xl font-display font-bold text-neutral-900 mb-4">
              🗓️ Mark Your Calendar
            </h2>
            <div className="space-y-3">
              {content.upcomingEvents.map((event) => (
                <div
                  key={event.eventId}
                  className="flex items-center gap-4 p-3 rounded-lg bg-neutral-50 border border-neutral-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">
                      {event.titleEn}
                    </p>
                    <p className="text-sm text-neutral-500">{event.titleEs}</p>
                  </div>
                  <div className="text-right text-sm text-neutral-500">
                    <p className="flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="flex items-center gap-1 justify-end">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <NewsletterActionModal
          newsletterId={newsletter.id}
          type={modal}
          month={newsletter.monthName}
          year={newsletter.year}
          onClose={() => setModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
