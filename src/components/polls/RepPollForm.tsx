"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, CheckCircle } from "lucide-react";

interface Props {
  token: string;
  eventId: string;
  repEmail: string;
}

export default function RepPollForm({ token, eventId, repEmail }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    titleEn: "",
    titleEs: "",
    options: [
      { id: "1", text: "" },
      { id: "2", text: "" },
    ],
  });

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { id: Date.now().toString(), text: "" }],
    });
  };

  const removeOption = (id: string) => {
    setFormData({
      ...formData,
      options: formData.options.filter((opt) => opt.id !== id),
    });
  };

  const updateOption = (id: string, text: string) => {
    setFormData({
      ...formData,
      options: formData.options.map((opt) =>
        opt.id === id ? { ...opt, text } : opt,
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/polls/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          eventId,
          repEmail,
          titleEn: formData.titleEn,
          titleEs: formData.titleEs,
          options: formData.options.filter((opt) => opt.text.trim()),
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.refresh();
          resetForm();
          setSuccess(false);
        }, 2000);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create poll");
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titleEn: "",
      titleEs: "",
      options: [
        { id: "1", text: "" },
        { id: "2", text: "" },
      ],
    });
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">
          Poll Submitted!
        </h3>
        <p className="text-neutral-600">
          Your poll will be reviewed by HOEP before going live.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* English Question */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Question (English) *
        </label>
        <input
          type="text"
          required
          value={formData.titleEn}
          onChange={(e) =>
            setFormData({ ...formData, titleEn: e.target.value })
          }
          placeholder="e.g., What treatment option interests you most?"
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-neutral-500 mt-1">
          Ask a clear, engaging question for attendees
        </p>
      </div>

      {/* Spanish Question */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Question (Spanish) *
        </label>
        <input
          type="text"
          required
          value={formData.titleEs}
          onChange={(e) =>
            setFormData({ ...formData, titleEs: e.target.value })
          }
          placeholder="e.g., ¿Qué opción de tratamiento le interesa más?"
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-neutral-500 mt-1">
          Provide the Spanish translation
        </p>
      </div>

      {/* Answer Options */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Answer Options * (minimum 2, maximum 6)
        </label>
        <div className="space-y-3">
          {formData.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-3">
              <span className="text-sm text-neutral-500 font-medium w-6">
                {index + 1}.
              </span>
              <input
                type="text"
                required
                value={option.text}
                onChange={(e) => updateOption(option.id, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {formData.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(option.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove option"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {formData.options.length < 6 && (
          <button
            type="button"
            onClick={addOption}
            className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Plus className="w-4 h-4" />
            Add Option
          </button>
        )}
      </div>

      {/* Submit */}
      <div className="pt-4 border-t border-neutral-200">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting Poll...
            </>
          ) : (
            "Submit Poll for Review"
          )}
        </button>
        <p className="text-xs text-center text-neutral-500 mt-3">
          Your poll will be reviewed by HOEP staff before being activated
        </p>
      </div>
    </form>
  );
}
