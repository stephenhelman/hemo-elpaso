"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Users, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";
import { useLanguage } from "@/context/LanguageContext";
import { rsvpButtonTranslation } from "@/translation/rsvp";

interface Props {
  eventId: string;
  eventTitle: string;
  hasRsvp: boolean;
  rsvpId?: string;
  maxCapacity?: number;
  currentRsvps: number;
}

export default function RsvpButton({
  eventId,
  eventTitle,
  hasRsvp,
  rsvpId,
  maxCapacity,
  currentRsvps,
}: Props) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const { locale } = useLanguage();
  const t = rsvpButtonTranslation[locale];
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [dietaryNotes, setDietaryNotes] = useState("");

  const spotsLeft = maxCapacity ? maxCapacity - currentRsvps : 999;
  const isFull = maxCapacity ? currentRsvps >= maxCapacity : false;

  const handleRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          adultsCount,
          childrenCount,
          dietaryNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.code === "VERIFICATION_REQUIRED") {
          toast.error(result.error, { duration: 5000 });
          router.push("/portal/profile?tab=verification");
        } else {
          toast.error(result.error || t.failedToRsvp);
        }
        return;
      }

      setShowForm(false);
      router.refresh();
      toast.success(t.rsvpConfirmed);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t.failedToSubmit,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const confirmed = await confirm({
      title: t.cancelTitle,
      message: t.cancelMessage,
      confirmText: t.cancelConfirm,
      variant: "warning",
    });
    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/rsvp?rsvpId=${rsvpId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        toast.error(t.failedToCancel);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t.failedToCancel,
      );
    } finally {
      setLoading(false);
    }
  };

  // If already RSVP'd
  if (hasRsvp) {
    return (
      <>
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-semibold">{t.youreRegistered}</span>
          </div>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="w-full px-4 py-2 rounded-full border-2 border-neutral-300 text-neutral-700 text-sm font-semibold hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            {loading ? t.cancelling : t.cancelRsvp}
          </button>
        </div>
        <ConfirmDialog />
      </>
    );
  }

  // If event is full
  if (isFull) {
    return (
      <div className="px-4 py-2 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200 text-sm font-semibold text-center">
        {t.eventFull}
      </div>
    );
  }

  // Show RSVP form
  if (showForm) {
    return (
      <form
        onSubmit={handleRsvp}
        className="space-y-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50"
      >
        <h3 className="font-semibold text-neutral-900">
          {t.rsvpFor} {eventTitle}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-neutral-600 block mb-1">
              {t.adults}
            </label>
            <input
              type="number"
              min="0"
              value={adultsCount}
              onChange={(e) => setAdultsCount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 block mb-1">
              {t.children}
            </label>
            <input
              type="number"
              min="0"
              value={childrenCount}
              onChange={(e) => setChildrenCount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-600 block mb-1">
            {t.dietaryNotes}
          </label>
          <textarea
            value={dietaryNotes}
            onChange={(e) => setDietaryNotes(e.target.value)}
            placeholder={t.dietaryPlaceholder}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || adultsCount + childrenCount === 0}
            className="flex-1 px-4 py-2 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.submitting}
              </>
            ) : (
              t.confirmRsvp
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-2 rounded-full border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-100 transition-colors"
          >
            {t.cancel}
          </button>
        </div>

        {spotsLeft <= 10 && (
          <p className="text-xs text-orange-600 font-medium">
            {t.spotsRemaining(spotsLeft)}
          </p>
        )}
      </form>
    );
  }

  // Show RSVP button
  return (
    <button
      onClick={() => setShowForm(true)}
      className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
    >
      <Users className="w-4 h-4" />
      {t.rsvpNow}
    </button>
  );
}
