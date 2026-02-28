"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";
import { Megaphone, Trash2, Clock } from "lucide-react";
import {
  getPriorityConfig,
  AnnouncementPriority,
} from "@/lib/announcement-priority";
import { adminAnnouncementsTranslation } from "@/translation/adminEvents";
import type { Lang } from "@/types";

interface Announcement {
  id: string;
  messageEn: string;
  messageEs: string;
  priority: AnnouncementPriority;
  active: boolean;
  expiresAt: Date | null;
  createdBy: string;
  createdAt: Date;
}

interface Props {
  eventId: string;
  announcements: Announcement[];
  adminEmail: string;
  locale: Lang;
}

export default function AnnouncementsList({
  eventId,
  announcements,
  adminEmail,
  locale,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();
  const t = adminAnnouncementsTranslation[locale];

  const handleDelete = async (announcementId: string) => {
    const confirmed = await confirm({
      title: t.removeConfirmTitle,
      message: t.removeConfirmMsg,
      confirmText: t.removeConfirmBtn,
      variant: "warning",
    });

    if (!confirmed) return;

    setLoading(announcementId);

    try {
      const response = await fetch(
        `/api/events/${eventId}/announcements/${announcementId}`,
        { method: "DELETE" },
      );

      if (response.ok) {
        toast.success(t.toastRemoved);
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to remove announcement");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(null);
    }
  };

  if (announcements.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <Megaphone className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <p className="text-neutral-500">{t.noAnnouncements}</p>
      </div>
    );
  }

  const activeAnnouncements = announcements.filter((a) => a.active);
  const inactiveAnnouncements = announcements.filter((a) => !a.active);

  return (
    <>
      <ConfirmDialog />

      <div className="space-y-6">
        {/* Active Announcements */}
        {activeAnnouncements.length > 0 && (
          <div>
            <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-green-600" />
              {t.active(activeAnnouncements.length)}
            </h2>
            <div className="space-y-3">
              {activeAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onDelete={handleDelete}
                  loading={loading === announcement.id}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}

        {/* Inactive Announcements */}
        {inactiveAnnouncements.length > 0 && (
          <div>
            <h2 className="font-semibold text-neutral-500 mb-4">
              {t.removed(inactiveAnnouncements.length)}
            </h2>
            <div className="space-y-3 opacity-60">
              {inactiveAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onDelete={handleDelete}
                  loading={loading === announcement.id}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function AnnouncementCard({
  announcement,
  onDelete,
  loading,
  t,
}: {
  announcement: Announcement;
  onDelete: (id: string) => void;
  loading: boolean;
  t: typeof adminAnnouncementsTranslation["en"];
}) {
  const config = getPriorityConfig(announcement.priority);
  const now = new Date();
  const isExpired =
    announcement.expiresAt && new Date(announcement.expiresAt) < now;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
            >
              {announcement.priority.toUpperCase()}
            </span>
            {announcement.active && !isExpired && (
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                {t.live}
              </span>
            )}
            {isExpired && (
              <span className="px-2 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold">
                {t.expired}
              </span>
            )}
          </div>

          <p className="text-sm text-neutral-500 mb-3">
            {t.posted} {new Date(announcement.createdAt).toLocaleString()}
            {announcement.expiresAt && (
              <>
                {" "}
                • {t.expires} {new Date(announcement.expiresAt).toLocaleString()}
              </>
            )}
          </p>
        </div>

        {announcement.active && (
          <button
            onClick={() => onDelete(announcement.id)}
            disabled={loading}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title={t.removeConfirmBtn}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-neutral-500 font-semibold mb-1">
            {t.english}
          </p>
          <p className="text-neutral-900">{announcement.messageEn}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 font-semibold mb-1">
            {t.spanish}
          </p>
          <p className="text-neutral-900">{announcement.messageEs}</p>
        </div>
      </div>
    </div>
  );
}
