"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import BilingualInput from "@/components/form/BilingualInput";
import { adminPollsTranslation } from "@/translation/adminEvents";
import type { Lang } from "@/types";

interface Props {
  eventId: string;
  locale: Lang;
}

export default function CreatePollButton({ eventId, locale }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = adminPollsTranslation[locale];

  const [formData, setFormData] = useState({
    question: { en: "", es: "" },
    options: [
      { en: "", es: "" },
      { en: "", es: "" },
    ],
  });

  const handleAddOption = () => {
    if (formData.options.length >= 6) {
      toast.error(t.maxOptions);
      return;
    }
    setFormData({
      ...formData,
      options: [...formData.options, { en: "", es: "" }],
    });
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length <= 2) {
      toast.error(t.minOptions);
      return;
    }
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const handleOptionChange = (
    index: number,
    value: { en: string; es: string },
  ) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allOptionsFilled = formData.options.every(
      (opt) => opt.en.trim() && opt.es.trim(),
    );
    if (!allOptionsFilled) {
      toast.error(t.translateAll);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          questionEn: formData.question.en,
          questionEs: formData.question.es,
          options: formData.options.map((opt) => ({
            textEn: opt.en,
            textEs: opt.es,
          })),
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
      toast.error(
        error instanceof Error ? error.message : "Failed to create poll",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question: { en: "", es: "" },
      options: [
        { en: "", es: "" },
        { en: "", es: "" },
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
        {t.createPoll}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              {/* Header */}
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

              {/* Poll Questions */}
              <div className="space-y-4 mb-6">
                <BilingualInput
                  label={t.pollQuestion}
                  name="question"
                  value={formData.question}
                  onChange={(value) =>
                    setFormData({ ...formData, question: value })
                  }
                  placeholder={t.questionPlaceholder}
                  type="textarea"
                  rows={2}
                  required
                />
              </div>

              {/* Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  {t.answerOptions}
                </label>
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm text-neutral-500 w-6">
                        {index + 1}.
                      </span>
                      <BilingualInput
                        label={t.optionLabel(index + 1)}
                        name={`option-${index}`}
                        value={option}
                        onChange={(value) => handleOptionChange(index, value)}
                        placeholder={t.optionPlaceholder(index + 1)}
                        type="input"
                        required
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
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
                    onClick={handleAddOption}
                    className="mt-3 text-sm text-primary hover:underline"
                  >
                    {t.addOption}
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
                      {t.creating}
                    </>
                  ) : (
                    t.createPoll
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
