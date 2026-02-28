"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import BilingualInput from "@/components/form/BilingualInput";
import { adminCreateAnnouncementTranslation } from "@/translation/adminEvents";
import type { Lang } from "@/types";

interface Props {
  eventId: string;
  locale: Lang;
}

export default function CreateAnnouncementButton({ eventId, locale }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = adminCreateAnnouncementTranslation[locale];

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
        toast.success(t.toastPosted);
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
        {t.newAnnouncement}
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
                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t.priority}
                  </label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="info">{t.priorityOptions.info}</option>
                    <option value="normal">{t.priorityOptions.normal}</option>
                    <option value="urgent">{t.priorityOptions.urgent}</option>
                  </select>
                  <p className="text-xs text-neutral-500 mt-1">
                    {t.urgentNote}
                  </p>
                </div>

                <BilingualInput
                  label={t.messageLabel}
                  name="message"
                  value={formData.message}
                  onChange={(value) =>
                    setFormData({ ...formData, message: value })
                  }
                  placeholder={t.messagePlaceholder}
                  type="textarea"
                  rows={3}
                  required
                />

                {/* Auto-expire */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {t.autoRemove}
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
                    <option value="">{t.expiryOptions.keep}</option>
                    <option value="5">{t.expiryOptions["5"]}</option>
                    <option value="10">{t.expiryOptions["10"]}</option>
                    <option value="15">{t.expiryOptions["15"]}</option>
                    <option value="30">{t.expiryOptions["30"]}</option>
                    <option value="60">{t.expiryOptions["60"]}</option>
                  </select>
                  <p className="text-xs text-neutral-500 mt-1">
                    {t.autoRemoveNote}
                  </p>
                </div>
              </div>

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
                      {t.posting}
                    </>
                  ) : (
                    t.postAnnouncement
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
