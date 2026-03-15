"use client";

import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Check,
  X,
  Play,
  Pause,
  CheckCircle,
  SkipForward,
  ThumbsUp,
  Edit3,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";

import SlidesControl from "./SlidesControl";

// -------------------------------------------------------
// Types
// -------------------------------------------------------
interface Presentation {
  id: string;
  currentSlide: number;
  totalSlides: number;
  slideUrls: string[];
  isLive: boolean;
}

interface ItineraryItem {
  id: string;
  titleEn: string;
  titleEs: string;
  status: string;
  sequenceOrder: number;
  startTime: string;
  location: string | null;
}

interface Announcement {
  id: string;
  messageEn: string;
  messageEs: string;
  priority: string;
}

interface Poll {
  id: string;
  questionEn: string;
  questionEs: string;
  status: string;
  active: boolean;
  options: { id: string; textEn: string; textEs: string }[];
  responseCount: number;
}

interface Question {
  id: string;
  questionEn: string;
  questionEs: string;
  upvotes: number;
  answered: boolean;
  answerEn: string | null;
  answerEs: string | null;
  isAnonymous: boolean;
  patientName: string | null;
}

interface PendingPhoto {
  id: string;
  url: string;
  caption: string | null;
  uploadedAt: string;
}

interface EventData {
  id: string;
  titleEn: string;
  titleEs: string;
  presentation: Presentation | null;
  itinerary: ItineraryItem[];
  announcements: Announcement[];
  polls: Poll[];
  questions: Question[];
  pendingPhotos: PendingPhoto[];
}

interface Props {
  token: string;
  event: EventData;
  presenterName?: string;
}

type TabId = "agenda" | "slides" | "polls" | "qa" | "photos";

// -------------------------------------------------------
// Main component
// -------------------------------------------------------
export default function PresenterControlPanel({
  token,
  event,
  presenterName,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("agenda");
  const [state, setState] = useState(event);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // Poll for live state every 5 seconds
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch(`/api/presenter/${token}`);
        if (res.ok) {
          const data = await res.json();
          const e = data.presenterToken.event;
          setState((prev) => ({
            ...prev,
            itinerary: e.itineraryItems,
            questions: e.questions,
            pendingPhotos: e.photos,
            polls: e.polls.map((p: any) => ({
              ...p,
              responseCount: p.responses?.length ?? 0,
            })),
          }));
        }
      } catch {
        // silently fail
      }
    };

    pollInterval.current = setInterval(fetchState, 5000);
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [token]);

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: "agenda", label: "Agenda" },
    { id: "slides", label: "Slides" },
    {
      id: "polls",
      label: "Polls",
      badge: state.polls.filter((p) => p.active).length || undefined,
    },
    {
      id: "qa",
      label: "Q&A",
      badge: state.questions.filter((q) => !q.answered).length || undefined,
    },
    {
      id: "photos",
      label: "Photos",
      badge: state.pendingPhotos.length || undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                Presenter Control Panel
              </p>
              <h1 className="font-display font-bold text-lg text-white truncate">
                {event.titleEn}
              </h1>
            </div>
            {presenterName && (
              <div className="text-right">
                <p className="text-xs text-neutral-500">Presenting as</p>
                <p className="text-sm font-semibold text-white">
                  {presenterName}
                </p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-lg transition-colors relative ${
                  activeTab === tab.id
                    ? "bg-primary text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {activeTab === "agenda" && (
          <AgendaControl
            token={token}
            itinerary={state.itinerary}
            onUpdate={(updated) =>
              setState((prev) => ({ ...prev, itinerary: updated }))
            }
          />
        )}
        {activeTab === "slides" && (
          <SlidesControl
            token={token}
            presentation={state.presentation}
            onUpdate={(updated) =>
              setState((prev) => ({ ...prev, presentation: updated }))
            }
          />
        )}
        {activeTab === "polls" && (
          <PollsControl
            token={token}
            eventId={event.id}
            polls={state.polls}
            onUpdate={(updated) =>
              setState((prev) => ({ ...prev, polls: updated }))
            }
          />
        )}
        {activeTab === "qa" && (
          <QAControl
            token={token}
            eventId={event.id}
            questions={state.questions}
            onUpdate={(updated) =>
              setState((prev) => ({ ...prev, questions: updated }))
            }
          />
        )}
        {activeTab === "photos" && (
          <PhotosControl
            token={token}
            pendingPhotos={state.pendingPhotos}
            onUpdate={(updated) =>
              setState((prev) => ({ ...prev, pendingPhotos: updated }))
            }
          />
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// AgendaControl
// -------------------------------------------------------
function AgendaControl({
  token,
  itinerary,
  onUpdate,
}: {
  token: string;
  itinerary: ItineraryItem[];
  onUpdate: (items: ItineraryItem[]) => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const statusOrder = ["scheduled", "current", "completed", "skipped"];

  const handleStatus = async (itemId: string, status: string) => {
    setLoading(itemId + status);
    try {
      const res = await fetch(`/api/presenter/${token}/itinerary/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(
          itinerary.map((i) =>
            i.id === itemId ? { ...i, status: data.item.status } : i,
          ),
        );

        // If marking current, also update any previous "current" to "completed"
        if (status === "current") {
          onUpdate(
            itinerary.map((i) =>
              i.id === itemId
                ? { ...i, status: "current" }
                : i.status === "current"
                  ? { ...i, status: "completed" }
                  : i,
            ),
          );
        }
        toast.success(`Item marked as ${status}`);
      }
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoading(null);
    }
  };

  const statusConfig: Record<string, { bg: string; dot: string }> = {
    current: {
      bg: "bg-green-900/30 ring-1 ring-green-500/50",
      dot: "bg-green-500 animate-pulse",
    },
    completed: { bg: "bg-neutral-800/30", dot: "bg-neutral-600" },
    skipped: { bg: "bg-neutral-800/20", dot: "bg-neutral-700" },
    scheduled: { bg: "bg-neutral-800/60", dot: "bg-neutral-500" },
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-400 mb-4">
        Mark agenda items as you progress through the event. Attendees see
        changes in real time.
      </p>

      {itinerary.map((item) => {
        const cfg = statusConfig[item.status] ?? statusConfig.scheduled;
        return (
          <div
            key={item.id}
            className={`p-4 rounded-xl ${cfg.bg} transition-all`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${cfg.dot}`}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{item.titleEn}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {new Date(item.startTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {item.location && ` · ${item.location}`}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {item.status !== "current" && (
                  <button
                    onClick={() => handleStatus(item.id, "current")}
                    disabled={!!loading}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-500 transition-colors disabled:opacity-50"
                  >
                    {loading === item.id + "current" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    Now
                  </button>
                )}
                {item.status === "current" && (
                  <button
                    onClick={() => handleStatus(item.id, "completed")}
                    disabled={!!loading}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-700 text-white text-xs font-semibold hover:bg-neutral-600 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Done
                  </button>
                )}
                {item.status === "scheduled" && (
                  <button
                    onClick={() => handleStatus(item.id, "skipped")}
                    disabled={!!loading}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 text-neutral-400 text-xs font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-50"
                  >
                    <SkipForward className="w-3 h-3" />
                    Skip
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {itinerary.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          No agenda items. Add them in the event editor first.
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------
// PollsControl
// -------------------------------------------------------
function PollsControl({
  token,
  eventId,
  polls,
  onUpdate,
}: {
  token: string;
  eventId: string;
  polls: Poll[];
  onUpdate: (polls: Poll[]) => void;
}) {
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (pollId: string, currentActive: boolean) => {
    setToggling(pollId);
    try {
      const res = await fetch(`/api/admin/polls/${pollId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (res.ok) {
        onUpdate(
          polls.map((p) =>
            p.id === pollId ? { ...p, active: !currentActive } : p,
          ),
        );
        toast.success(currentActive ? "Poll deactivated" : "Poll is now live");
      }
    } catch {
      toast.error("Failed to toggle poll");
    } finally {
      setToggling(null);
    }
  };

  const approved = polls.filter(
    (p) => p.status === "approved" || p.status === "active",
  );
  const pending = polls.filter((p) => p.status === "pending");
  const drafts = polls.filter((p) => p.status === "draft");

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-400">
        Activate polls to show them on attendees' screens instantly.
      </p>

      {approved.length === 0 && pending.length === 0 && drafts.length === 0 && (
        <div className="text-center py-12 text-neutral-500 text-sm">
          No polls created yet. Create polls in the event admin page first.
        </div>
      )}

      {approved.map((poll) => (
        <div
          key={poll.id}
          className={`p-5 rounded-2xl transition-all ${
            poll.active
              ? "bg-green-900/20 ring-1 ring-green-500/40"
              : "bg-neutral-800/60"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {poll.active && (
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
                <p className="font-semibold text-white">{poll.questionEn}</p>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {poll.options.map((opt) => (
                  <span
                    key={opt.id}
                    className="px-2 py-0.5 rounded-full bg-neutral-700 text-neutral-300 text-xs"
                  >
                    {opt.textEn}
                  </span>
                ))}
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                {poll.responseCount} responses
              </p>
            </div>

            <button
              onClick={() => handleToggle(poll.id, poll.active)}
              disabled={toggling === poll.id}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 disabled:opacity-50 ${
                poll.active
                  ? "bg-red-600/80 text-white hover:bg-red-600"
                  : "bg-green-600 text-white hover:bg-green-500"
              }`}
            >
              {toggling === poll.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : poll.active ? (
                <>
                  <Pause className="w-4 h-4" /> Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Launch
                </>
              )}
            </button>
          </div>
        </div>
      ))}

      {pending.length > 0 && (
        <p className="text-xs text-amber-500 mt-2">
          {pending.length} poll{pending.length !== 1 ? "s" : ""} awaiting
          approval in admin
        </p>
      )}
    </div>
  );
}

// -------------------------------------------------------
// QAControl
// -------------------------------------------------------
function QAControl({
  token,
  eventId,
  questions,
  onUpdate,
}: {
  token: string;
  eventId: string;
  questions: Question[];
  onUpdate: (questions: Question[]) => void;
}) {
  const [answering, setAnswering] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [saving, setSaving] = useState(false);

  const unanswered = questions.filter((q) => !q.answered);
  const answered = questions.filter((q) => q.answered);

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/questions/${questionId}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answerEn: answerText.trim(),
          answerEs: answerText.trim(), // TODO: auto-translate
          answeredBy: `presenter:${token}`,
        }),
      });
      if (res.ok) {
        onUpdate(
          questions.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  answered: true,
                  answerEn: answerText.trim(),
                  answerEs: answerText.trim(),
                }
              : q,
          ),
        );
        setAnswering(null);
        setAnswerText("");
        toast.success("Answer saved");
      }
    } catch {
      toast.error("Failed to save answer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {unanswered.length === 0 && answered.length === 0 && (
        <div className="text-center py-12 text-neutral-500 text-sm">
          No questions yet. They'll appear here as attendees submit them.
        </div>
      )}

      {/* Unanswered — sorted by upvotes */}
      {unanswered.map((q) => (
        <div key={q.id} className="bg-neutral-800/60 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <p className="text-white font-medium">{q.questionEn}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {q.isAnonymous ? "Anonymous" : q.patientName} ·{" "}
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {q.upvotes}
                </span>
              </p>
            </div>
            <button
              onClick={() => {
                setAnswering(q.id);
                setAnswerText("");
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-600 transition-colors shrink-0"
            >
              <Edit3 className="w-3 h-3" />
              Answer
            </button>
          </div>

          {answering === q.id && (
            <div className="space-y-2">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your answer..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-neutral-700 border border-neutral-600 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setAnswering(null)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-600 text-neutral-400 text-xs font-semibold hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAnswer(q.id)}
                  disabled={saving || !answerText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-50 hover:bg-primary-600 transition-colors"
                >
                  {saving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  Save Answer
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Answered */}
      {answered.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-2">
            Answered ({answered.length})
          </p>
          <div className="space-y-2">
            {answered.map((q) => (
              <div
                key={q.id}
                className="bg-green-900/20 border border-green-800/30 rounded-xl p-3"
              >
                <p className="text-neutral-300 text-sm">{q.questionEn}</p>
                <p className="text-green-300 text-xs mt-1">{q.answerEn}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------
// PhotosControl
// -------------------------------------------------------
function PhotosControl({
  token,
  pendingPhotos,
  onUpdate,
}: {
  token: string;
  pendingPhotos: PendingPhoto[];
  onUpdate: (photos: PendingPhoto[]) => void;
}) {
  const [approving, setApproving] = useState<string | null>(null);

  const handleApprove = async (photoId: string, approved: boolean) => {
    setApproving(photoId);
    try {
      const res = await fetch(`/api/presenter/${token}/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      if (res.ok) {
        onUpdate(pendingPhotos.filter((p) => p.id !== photoId));
        toast.success(approved ? "Photo approved ✓" : "Photo rejected");
      }
    } catch {
      toast.error("Failed to update photo");
    } finally {
      setApproving(null);
    }
  };

  return (
    <div>
      <p className="text-sm text-neutral-400 mb-4">
        Review photos uploaded by attendees. Approved photos appear instantly in
        the live gallery.
      </p>

      {pendingPhotos.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 text-sm">
          No pending photos. Attendees can upload from the Photos tab.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {pendingPhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-neutral-800/60 rounded-2xl overflow-hidden"
            >
              <div className="aspect-square">
                <img
                  src={photo.url}
                  alt={photo.caption || "Pending photo"}
                  className="w-full h-full object-cover"
                />
              </div>
              {photo.caption && (
                <p className="px-3 pt-2 text-xs text-neutral-400 truncate">
                  {photo.caption}
                </p>
              )}
              <div className="flex gap-2 p-3">
                <button
                  onClick={() => handleApprove(photo.id, false)}
                  disabled={approving === photo.id}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-neutral-700 text-neutral-300 text-xs font-semibold hover:bg-red-900/50 hover:text-red-300 transition-colors disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(photo.id, true)}
                  disabled={approving === photo.id}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-500 transition-colors disabled:opacity-50"
                >
                  {approving === photo.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
