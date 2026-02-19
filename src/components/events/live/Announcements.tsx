"use client";

import { useState, useEffect } from "react";
import { Megaphone, Loader2 } from "lucide-react";
import {
  getPriorityConfig,
  AnnouncementPriority,
} from "@/lib/announcement-priority";

interface Announcement {
  id: string;
  messageEn: string;
  messageEs: string;
  priority: AnnouncementPriority;
  createdAt: Date;
  expiresAt: Date | null;
}

interface Props {
  eventId: string;
  lang: "en" | "es";
}

export default function Announcements({ eventId, lang }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/announcements`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-8">
      {announcements.map((announcement) => {
        const message =
          lang === "en" ? announcement.messageEn : announcement.messageEs;
        const config = getPriorityConfig(announcement.priority);

        return (
          <div
            key={announcement.id}
            className={`${config.bg} ${config.border} border-2 rounded-xl p-4 shadow-lg animate-in slide-in-from-top duration-500`}
          >
            <div className="flex items-start gap-3">
              <Megaphone
                className={`w-5 h-5 ${config.icon} flex-shrink-0 mt-0.5`}
              />
              <p className={`flex-1 font-semibold ${config.text}`}>{message}</p>
              <span className={`text-xs ${config.text} opacity-75`}>
                {new Date(announcement.createdAt).toLocaleTimeString(lang, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
