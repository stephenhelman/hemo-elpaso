"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";
import {
  Clock,
  Trash2,
  CheckCircle,
  SkipForward,
  Play,
  MapPin,
} from "lucide-react";
import { getStatusConfig, ItineraryStatus } from "@/lib/itinerary-status";
import { adminItineraryTranslation } from "@/translation/adminEvents";
import type { Lang } from "@/types";

interface ItineraryItem {
  id: string;
  titleEn: string;
  titleEs: string;
  descriptionEn: string | null;
  descriptionEs: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  status: ItineraryStatus;
  location: string | null;
  sequenceOrder: number;
  createdBy: string;
  createdAt: Date;
}

interface Props {
  eventId: string;
  items: ItineraryItem[];
  adminEmail: string;
  locale: Lang;
}

export default function ItineraryList({ eventId, items, adminEmail, locale }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();
  const t = adminItineraryTranslation[locale];

  const handleUpdateStatus = async (
    itemId: string,
    newStatus: ItineraryStatus,
  ) => {
    setLoading(itemId);

    try {
      const response = await fetch(
        `/api/events/${eventId}/itinerary/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (response.ok) {
        toast.success(t.toastStatusUpdated);
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    const confirmed = await confirm({
      title: t.deleteConfirmTitle,
      message: t.deleteConfirmMsg,
      confirmText: t.deleteConfirmBtn,
      variant: "danger",
    });

    if (!confirmed) return;

    setLoading(itemId);

    try {
      const response = await fetch(
        `/api/events/${eventId}/itinerary/${itemId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        toast.success(t.toastDeleted);
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete item");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <Clock className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <p className="text-neutral-500">{t.noItems}</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog />

      <div className="space-y-3">
        {items.map((item) => {
          const config = getStatusConfig(item.status);
          const startTime = new Date(item.startTime);

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-neutral-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 pt-1">{config.icon}</div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className={`font-semibold text-neutral-900 ${config.textStyle}`}
                      >
                        {item.titleEn}
                      </h3>
                      <span className="px-2 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-semibold">
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-neutral-500 mb-3">
                      <span>
                        {startTime.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      {item.duration && <span>• {t.min(item.duration)}</span>}
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </span>
                      )}
                    </div>

                    {item.descriptionEn && (
                      <p className="text-sm text-neutral-600 mb-2">
                        {item.descriptionEn}
                      </p>
                    )}

                    {/* Spanish */}
                    <details className="text-xs text-neutral-500">
                      <summary className="cursor-pointer hover:text-neutral-700">
                        {t.spanishVersion}
                      </summary>
                      <p className="mt-2">
                        <strong>{item.titleEs}</strong>
                      </p>
                      {item.descriptionEs && (
                        <p className="mt-1">{item.descriptionEs}</p>
                      )}
                    </details>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {item.status === "scheduled" && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, "current")}
                      disabled={loading === item.id}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                      title={t.markCurrent}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}

                  {(item.status === "scheduled" ||
                    item.status === "current") && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(item.id, "completed")}
                        disabled={loading === item.id}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        title={t.markCompleted}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(item.id, "skipped")}
                        disabled={loading === item.id}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                        title={t.skipItem}
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={loading === item.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title={t.deleteItem}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
