"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  eventId: string;
}

export default function CreatePollButton({ eventId }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const response = await fetch(`/api/admin/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          titleEn: formData.titleEn,
          titleEs: formData.titleEs,
          options: formData.options.filter((opt) => opt.text.trim()),
        }),
      });

      if (response.ok) {
        router.refresh();
        setShowModal(false);
        resetForm();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create poll");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create poll");
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

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create Poll
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-neutral-900">
                  Create Poll
                </h2>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Poll Questions */}
              <div className="space-y-4 mb-6">
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
                    placeholder="e.g., What topic interests you most?"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

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
                    placeholder="e.g., ¿Qué tema te interesa más?"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Answer Options * (minimum 2)
                </label>
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <span className="text-sm text-neutral-500 w-6">
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        required
                        value={option.text}
                        onChange={(e) =>
                          updateOption(option.id, e.target.value)
                        }
                        placeholder="Option text"
                        className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(option.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    className="mt-3 text-sm text-primary hover:underline"
                  >
                    + Add Option
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
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
                      Creating...
                    </>
                  ) : (
                    "Create Poll"
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
