"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  eventId: string;
}

export default function CreateItineraryItemButton({ eventId }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    titleEn: "",
    titleEs: "",
    descriptionEn: "",
    descriptionEs: "",
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
          titleEn: formData.titleEn,
          titleEs: formData.titleEs,
          descriptionEn: formData.descriptionEn || null,
          descriptionEs: formData.descriptionEs || null,
          startTime: formData.startTime,
          duration: formData.duration ? parseInt(formData.duration) : null,
          location: formData.location || null,
          sequenceOrder: 0, // Could make this dynamic
        }),
      });

      if (response.ok) {
        toast.success("Itinerary item added!");
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
      titleEn: "",
      titleEs: "",
      descriptionEn: "",
      descriptionEs: "",
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
        Add Item
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-neutral-900">
                  Add Schedule Item
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
                {/* Title English */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleEn}
                    onChange={(e) =>
                      setFormData({ ...formData, titleEn: e.target.value })
                    }
                    placeholder="e.g., Registration & Welcome"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Title Spanish */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Title (Spanish) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleEs}
                    onChange={(e) =>
                      setFormData({ ...formData, titleEs: e.target.value })
                    }
                    placeholder="e.g., Registro y Bienvenida"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Time and Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Start Time *
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
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      placeholder="e.g., 30"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="e.g., Main Hall, Room B"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Description English */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description (English)
                  </label>
                  <textarea
                    value={formData.descriptionEn}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        descriptionEn: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="Optional details about this activity"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Description Spanish */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description (Spanish)
                  </label>
                  <textarea
                    value={formData.descriptionEs}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        descriptionEs: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="Detalles opcionales sobre esta actividad"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add to Schedule"
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
