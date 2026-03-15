"use client";

import { useState, useEffect, useRef } from "react";
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

// Tab imports
import AgendaTab from "./tabs/AgendaTab";
import PresenterTab from "./tabs/PresenterTab";
import PhotosTab from "./tabs/PhotosTab";
import PollsTab from "./tabs/PollsTab";
import QandATab from "./tabs/QandATab";

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

interface EventData {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  presentation: {
    currentSlide: number;
    totalSlides: number;
    slideUrls: string[];
    isLive: boolean;
  } | null;
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

export default function LiveEventTabs({ event, attendee, lang }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("agenda");
  const [liveState, setLiveState] = useState(event);
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});
  const pollInterval = useRef<NodeJS.Timeout | null>(null);
  const isEs = lang === "es";

  const title = isEs ? event.titleEs : event.titleEn;

  // Poll for live state every 3 seconds
  useEffect(() => {
    const fetchLiveState = async () => {
      try {
        const res = await fetch(`/api/events/${event.id}/live-state`);
        if (res.ok) {
          const data = await res.json();
          setLiveState((prev) => ({
            ...prev,
            presentation: data.presentation,
            itinerary: data.itinerary,
            announcements: data.announcements,
            activePolls: data.activePolls,
            questions: data.questions,
            photos: data.photos,
          }));
        }
      } catch {
        // Silently fail — stale data is better than error state
      }
    };

    pollInterval.current = setInterval(fetchLiveState, 3000);
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [event.id]);

  // Dynamic tabs
  const hasActivePolls = liveState.activePolls.length > 0;
  const hasQuestions = liveState.questions.length > 0;

  const tabs: {
    id: TabId;
    labelEn: string;
    labelEs: string;
    icon: React.ReactNode;
    badge?: number;
    always: boolean;
  }[] = [
    {
      id: "agenda",
      labelEn: "Agenda",
      labelEs: "Agenda",
      icon: <ClipboardList className="w-4 h-4" />,
      always: true,
    },
    {
      id: "presenter",
      labelEn: "Presenter",
      labelEs: "Presentador",
      icon: <MonitorPlay className="w-4 h-4" />,
      always: true,
    },
    {
      id: "photos",
      labelEn: "Photos",
      labelEs: "Fotos",
      icon: <Camera className="w-4 h-4" />,
      badge: liveState.photos.length || undefined,
      always: true,
    },
    {
      id: "polls",
      labelEn: "Polls",
      labelEs: "Encuestas",
      icon: <BarChart3 className="w-4 h-4" />,
      badge: hasActivePolls ? liveState.activePolls.length : undefined,
      always: false,
    },
    {
      id: "qa",
      labelEn: "Q&A",
      labelEs: "Preguntas",
      icon: <MessageSquare className="w-4 h-4" />,
      badge: liveState.questions.filter((q) => !q.answered).length || undefined,
      always: false,
    },
  ];

  const visibleTabs = tabs.filter(
    (t) =>
      t.always ||
      (t.id === "polls" && hasActivePolls) ||
      (t.id === "qa" && hasQuestions),
  );

  // Auto-switch to polls tab when first poll activates
  useEffect(() => {
    if (hasActivePolls && activeTab === "agenda") {
      setActiveTab("polls");
    }
  }, [hasActivePolls]);

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
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors relative ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {tab.icon}
                {isEs ? tab.labelEs : tab.labelEn}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-xs flex items-center justify-center">
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
            itinerary={liveState.itinerary}
            announcements={liveState.announcements}
            lang={lang}
          />
        )}
        {activeTab === "presenter" && (
          <PresenterTab
            presentation={liveState.presentation}
            announcements={liveState.announcements}
            lang={lang}
          />
        )}
        {activeTab === "photos" && (
          <PhotosTab
            eventId={event.id}
            photos={liveState.photos}
            sessionToken={attendee.sessionToken}
            lang={lang}
          />
        )}
        {activeTab === "polls" && hasActivePolls && (
          <PollsTab
            eventId={event.id}
            polls={liveState.activePolls}
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
            questions={liveState.questions}
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
