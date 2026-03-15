"use client";

import { useState } from "react";
import { X, Send, MessageSquare, Loader2 } from "lucide-react";
import BilingualInput from "@/components/form/BilingualInput";

interface Props {
  newsletterId: string;
  type: "publish" | "revision";
  month: string;
  year: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewsletterActionModal({
  newsletterId,
  type,
  month,
  year,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [presidentMessage, setPresidentMessage] = useState({
    en: "",
    es: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (type === "publish") {
      if (!presidentMessage.en.trim() || !presidentMessage.es.trim()) {
        setError(
          "Please provide your message in both English and Spanish before sending.",
        );
        return;
      }
    }

    if (type === "revision") {
      if (!revisionNotes.trim()) {
        setError(
          "Please provide feedback notes for the Communications Liaison.",
        );
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint =
        type === "publish"
          ? `/api/admin/newsletter/${newsletterId}/approve`
          : `/api/admin/newsletter/${newsletterId}/reject`;

      const body =
        type === "publish"
          ? {
              presidentMessageEn: presidentMessage.en,
              presidentMessageEs: presidentMessage.es,
            }
          : { revisionNotes };

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-neutral-900">
                {type === "publish" ? "Send Newsletter" : "Request Changes"}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                {month} {year} Newsletter
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Publish mode — President message */}
          {type === "publish" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-800">
                  Your message will appear at the top of the newsletter for all
                  members. Members will receive it in their preferred language.
                </p>
              </div>

              <BilingualInput
                label="Message from the President"
                name="presidentMessage"
                value={presidentMessage}
                onChange={setPresidentMessage}
                placeholder="Write a message to the HOEP community..."
                type="textarea"
                rows={5}
                required
              />
            </div>
          )}

          {/* Revision mode — notes for liaison */}
          {type === "revision" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">
                  Your notes will be sent to the Communications Liaison so they
                  can update the draft before resubmitting for your approval.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Revision Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  rows={5}
                  placeholder="Describe what needs to be changed or added..."
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                type === "publish"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : type === "publish" ? (
                <Send className="w-4 h-4" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              {loading
                ? "Processing..."
                : type === "publish"
                  ? "Send Newsletter"
                  : "Submit Feedback"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
