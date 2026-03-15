"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList,
  MonitorPlay,
  Camera,
  BarChart3,
  MessageSquare,
  CheckCircle,
  ArrowLeft,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { getPusherClient, eventChannel } from "@/lib/pusher-client";
import { PUSHER_EVENTS } from "@/lib/pusher-server";

import AgendaTab from "./tabs/AgendaTab";
import PresenterTab from "./tabs/PresenterTab";
import PhotosTab from "./tabs/PhotosTab";
import PollsTab from "./tabs/PollsTab";
import QandATab from "./tabs/QandATab";

// ── Types (same as before) ────────────────────────────────────────────────────
interface ItineraryItem {
  id: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  startTime: string;
  endTime: string | null;
  status: string;
  sequenceOrder: number;
  location: string | null;
}
interface Announcement {
  id: string;
  messageEn: string;
  messageEs: string;
  priority: string;
  createdAt: string;
}
interface PollOption {
  id: string;
  textEn: string;
  textEs: string;
  voteCount: number;
}
interface ActivePoll {
  id: string;
  questionEn: string;
  questionEs: string;
  options: PollOption[];
  totalResponses: number;
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
interface Photo {
  id: string;
  url: string;
  caption: string | null;
  uploadedAt: string;
}
interface Presentation {
  currentSlide: number;
  isLive: boolean;
  slideUrlsEn: string[];
  slideUrlsEs: string[];
  totalSlidesEn: number;
  totalSlidesEs: number;
}
interface EventData {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  presentation: Presentation | null;
  itinerary: ItineraryItem[];
  announcements: Announcement[];
  activePolls: ActivePoll[];
  questions: Question[];
  photos: Photo[];
}
interface AttendeeData {
  patientId: string | null;
  patientName: string | undefined;
  sessionToken: string;
  attendeeRole: string;
}
interface Props {
  event: EventData;
  attendee: AttendeeData;
  lang: "en" | "es";
}

type TabId = "agenda" | "presenter" | "photos" | "polls" | "qa";

// ── Component ─────────────────────────────────────────────────────────────────
export default function LiveEventTabs({ event, attendee, lang }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("agenda");
  const [presentation, setPresentation] = useState(event.presentation);
  const [itinerary, setItinerary] = useState(event.itinerary);
  const [announcements, setAnnouncements] = useState(event.announcements);
  const [activePolls, setActivePolls] = useState(event.activePolls);
  const [questions, setQuestions] = useState(event.questions);
  const [photos, setPhotos] = useState(event.photos);
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});

  const isEs = lang === "es";
  const title = isEs ? event.titleEs : event.titleEn;

  // ── Pusher subscriptions ────────────────────────────────────────────────────
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(eventChannel(event.id));

    // Slide advanced by presenter
    channel.bind(
      PUSHER_EVENTS.SLIDE_CHANGED,
      (data: { currentSlide: number }) => {
        setPresentation((prev) =>
          prev ? { ...prev, currentSlide: data.currentSlide } : prev,
        );
      },
    );

    // Presentation went live / hidden
    channel.bind(
      PUSHER_EVENTS.PRESENTATION_LIVE,
      (data: { isLive: boolean }) => {
        setPresentation((prev) =>
          prev ? { ...prev, isLive: data.isLive } : prev,
        );
      },
    );

    // Poll activated — add to activePolls, switch tab
    channel.bind(PUSHER_EVENTS.POLL_ACTIVATED, (data: { poll: ActivePoll }) => {
      setActivePolls((prev) => {
        if (prev.find((p) => p.id === data.poll.id)) return prev;
        return [...prev, data.poll];
      });
      setActiveTab("polls");
    });

    // Poll deactivated — remove from activePolls
    channel.bind(
      PUSHER_EVENTS.POLL_DEACTIVATED,
      (data: { poll: { id: string } }) => {
        setActivePolls((prev) => prev.filter((p) => p.id !== data.poll.id));
      },
    );

    // Vote cast — update counts in real time
    channel.bind(
      PUSHER_EVENTS.POLL_VOTE,
      (data: {
        pollId: string;
        options: PollOption[];
        totalResponses: number;
      }) => {
        setActivePolls((prev) =>
          prev.map((p) =>
            p.id === data.pollId
              ? {
                  ...p,
                  options: data.options,
                  totalResponses: data.totalResponses,
                }
              : p,
          ),
        );
      },
    );

    // New question submitted — Q&A tab appears
    channel.bind(
      PUSHER_EVENTS.QUESTION_ADDED,
      (data: { question: Question }) => {
        setQuestions((prev) => {
          if (prev.find((q) => q.id === data.question.id)) return prev;
          return [...prev, data.question];
        });
      },
    );

    // Question answered by presenter
    channel.bind(
      PUSHER_EVENTS.QUESTION_ANSWERED,
      (data: { questionId: string; answerEn: string; answerEs: string }) => {
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === data.questionId
              ? {
                  ...q,
                  answered: true,
                  answerEn: data.answerEn,
                  answerEs: data.answerEs,
                }
              : q,
          ),
        );
      },
    );

    // Question upvoted
    channel.bind(
      PUSHER_EVENTS.QUESTION_UPVOTED,
      (data: { questionId: string; upvotes: number }) => {
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === data.questionId ? { ...q, upvotes: data.upvotes } : q,
          ),
        );
      },
    );

    // Photo approved — appears in gallery
    channel.bind(PUSHER_EVENTS.PHOTO_APPROVED, (data: { photo: Photo }) => {
      setPhotos((prev) => {
        if (prev.find((p) => p.id === data.photo.id)) return prev;
        return [data.photo, ...prev];
      });
    });

    // Itinerary item status changed
    channel.bind(
      PUSHER_EVENTS.ITINERARY_UPDATED,
      (data: { itemId: string; status: string }) => {
        setItinerary((prev) =>
          prev.map((item) => {
            if (item.id === data.itemId)
              return { ...item, status: data.status };
            // If new item is "current", clear previous "current"
            if (data.status === "current" && item.status === "current") {
              return { ...item, status: "completed" };
            }
            return item;
          }),
        );
      },
    );

    // Announcement added
    channel.bind(
      PUSHER_EVENTS.ANNOUNCEMENT_ADDED,
      (data: { announcement: Announcement }) => {
        setAnnouncements((prev) => [data.announcement, ...prev]);
      },
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(eventChannel(event.id));
    };
  }, [event.id]);

  // Auto-switch to polls tab when first poll activates
  useEffect(() => {
    if (activePolls.length > 0 && activeTab === "agenda") {
      setActiveTab("polls");
    }
  }, [activePolls.length]);

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const hasPolls = activePolls.length > 0;
  const hasQuestions = questions.length > 0;

  const tabs = [
    {
      id: "agenda" as TabId,
      labelEn: "Agenda",
      labelEs: "Agenda",
      icon: <ClipboardList className="w-4 h-4" />,
      always: true,
    },
    {
      id: "presenter" as TabId,
      labelEn: "Presenter",
      labelEs: "Presentador",
      icon: <MonitorPlay className="w-4 h-4" />,
      always: true,
    },
    {
      id: "photos" as TabId,
      labelEn: "Photos",
      labelEs: "Fotos",
      icon: <Camera className="w-4 h-4" />,
      always: true,
      badge: photos.length || undefined,
    },
    {
      id: "polls" as TabId,
      labelEn: "Polls",
      labelEs: "Encuestas",
      icon: <BarChart3 className="w-4 h-4" />,
      always: false,
      badge: hasPolls ? activePolls.length : undefined,
    },
    {
      id: "qa" as TabId,
      labelEn: "Q&A",
      labelEs: "Preguntas",
      icon: <MessageSquare className="w-4 h-4" />,
      always: false,
      badge: questions.filter((q) => !q.answered).length || undefined,
    },
  ].filter(
    (t) =>
      t.always ||
      (t.id === "polls" && hasPolls) ||
      (t.id === "qa" && hasQuestions),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-primary-950 to-neutral-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Link
              href={`/events/${event.slug}`}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {isEs ? "Evento" : "Event"}
            </Link>
            <div className="flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-semibold">LIVE</span>
            </div>
          </div>

          <h1 className="text-white font-display font-bold text-lg mb-1 truncate">
            {title}
          </h1>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            <span>
              {isEs ? "Registrado como" : "Checked in as"}{" "}
              {attendee.patientName ?? (isEs ? "Asistente" : "Attendee")}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {tab.icon}
                {isEs ? tab.labelEs : tab.labelEn}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === "agenda" && (
          <AgendaTab
            itinerary={itinerary}
            announcements={announcements}
            lang={lang}
          />
        )}
        {activeTab === "presenter" && (
          <PresenterTab presentation={presentation} lang={lang} />
        )}
        {activeTab === "photos" && (
          <PhotosTab
            eventId={event.id}
            photos={photos}
            sessionToken={attendee.sessionToken}
            lang={lang}
          />
        )}
        {activeTab === "polls" && hasPolls && (
          <PollsTab
            eventId={event.id}
            polls={activePolls}
            sessionToken={attendee.sessionToken}
            votedPolls={votedPolls}
            onVote={(pollId, optionId) =>
              setVotedPolls((prev) => ({ ...prev, [pollId]: optionId }))
            }
            lang={lang}
          />
        )}
        {activeTab === "qa" && hasQuestions && (
          <QandATab
            eventId={event.id}
            questions={questions}
            sessionToken={attendee.sessionToken}
            patientId={attendee.patientId}
            patientName={attendee.patientName}
            lang={lang}
          />
        )}
      </div>
    </div>
  );
}
