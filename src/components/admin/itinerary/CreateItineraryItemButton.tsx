"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import BilingualInput from "@/components/form/BilingualInput";
import { adminCreateItineraryTranslation } from "@/translation/adminEvents";
import type { Lang } from "@/types";

interface Props {
  eventId: string;
  locale: Lang;
}

export default function CreateItineraryItemButton({ eventId, locale }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = adminCreateItineraryTranslation[locale];

  const [formData, setFormData] = useState({
    title: { en: "", es: "" },
    description: { en: "", es: "" },
    startTime: "",
    duration: "",
    location: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleEn: formData.title.en,
          titleEs: formData.title.es,
          descriptionEn: formData.description.en || null,
          descriptionEs: formData.description.es || null,
          startTime: formData.startTime,
          duration: formData.duration ? parseInt(formData.duration) : null,
          location: formData.location || null,
          sequenceOrder: 0,
        }),
      });

      if (response.ok) {
        toast.success(t.toastAdded);
        setShowModal(false);
        resetForm();
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to add item");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: { en: "", es: "" },
      description: { en: "", es: "" },
      startTime: "",
      duration: "",
      location: "",
    });
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t.addItem}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-neutral-900">
                  {t.modalTitle}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <BilingualInput
                  label={t.activityTitle}
                  name="title"
                  value={formData.title}
                  onChange={(value) =>
                    setFormData({ ...formData, title: value })
                  }
                  placeholder={t.titlePlaceholder}
                  type="input"
                  required
                />
              </div>

              {/* Time and Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t.startTime}
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t.duration}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    placeholder={t.durationPlaceholder}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t.location}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder={t.locationPlaceholder}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <BilingualInput
                label={t.descriptionLabel}
                name="description"
                value={formData.description}
                onChange={(value) =>
                  setFormData({ ...formData, description: value })
                }
                placeholder={t.descriptionPlaceholder}
                type="textarea"
                rows={2}
              />

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.adding}
                    </>
                  ) : (
                    t.addToSchedule
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
