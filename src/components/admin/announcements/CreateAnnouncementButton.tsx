"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import BilingualInput from "@/components/form/BilingualInput";

interface Props {
  eventId: string;
}

export default function CreateAnnouncementButton({ eventId }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    message: { en: "", es: "" },
    priority: "normal",
    expiresInMinutes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageEn: formData.message.en,
          messageEs: formData.message.es,
          priority: formData.priority,
          expiresInMinutes: formData.expiresInMinutes
            ? parseInt(formData.expiresInMinutes)
            : null,
        }),
      });

      if (response.ok) {
        toast.success("Announcement posted!");
        setShowModal(false);
        resetForm();
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to post announcement");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      message: { en: "", es: "" },
      priority: "normal",
      expiresInMinutes: "",
    });
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Announcement
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-neutral-900">
                  Post Announcement
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
                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Priority *
                  </label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="info">Info (Gray)</option>
                    <option value="normal">Normal (Blue)</option>
                    <option value="urgent">Urgent (Red)</option>
                  </select>
                  <p className="text-xs text-neutral-500 mt-1">
                    Use urgent for critical updates only
                  </p>
                </div>

                <BilingualInput
                  label="Announcement Message"
                  name="message"
                  value={formData.message}
                  onChange={(value) =>
                    setFormData({ ...formData, message: value })
                  }
                  placeholder="e.g., Dinner will be served in 15 minutes..."
                  type="textarea"
                  rows={3}
                  required
                />

                {/* Auto-expire */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Auto-Remove After (Optional)
                  </label>
                  <select
                    value={formData.expiresInMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expiresInMinutes: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">
                      Keep visible until manually removed
                    </option>
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                  </select>
                  <p className="text-xs text-neutral-500 mt-1">
                    Announcement will automatically disappear after this time
                  </p>
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
                      Posting...
                    </>
                  ) : (
                    "Post Announcement"
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
