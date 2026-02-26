"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import BilingualInput from "@/components/form/BilingualInput";
import { Lang } from "@/types";
import { pollFormTranslation } from "@/translation/outsideRepTranslation";

interface Props {
  token: string;
  eventId: string;
  repEmail: string;
  locale: Lang;
}

export default function RepPollForm({
  token,
  eventId,
  repEmail,
  locale,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const t = pollFormTranslation[locale];

  const [formData, setFormData] = useState({
    question: { en: "", es: "" }, // CHANGED
    options: [
      { en: "", es: "" }, // CHANGED
      { en: "", es: "" }, // CHANGED
    ],
  });

  const handleAddOption = () => {
    if (formData.options.length >= 6) {
      toast.error("Maximum 6 options allowed");
      return;
    }
    setFormData({
      ...formData,
      options: [...formData.options, { en: "", es: "" }],
    });
  };

  const handleRemoveOption = (index: number) => {
    if (formData.options.length <= 2) {
      toast.error("Minimum 2 options required");
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
      toast.error("Please translate all poll options");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/polls/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
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
        setSuccess(true);
        setTimeout(() => {
          router.refresh();
          resetForm();
          setSuccess(false);
        }, 2000);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to submit poll");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit poll",
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

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">
          {t.submitComplete}
        </h3>
        <p className="text-neutral-600">{t.reviewBeforeLive}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BilingualInput
        label={t.pollQuestion}
        name="question"
        value={formData.question}
        onChange={(value) => setFormData({ ...formData, question: value })}
        placeholder={t.pollQuestionPlaceholder}
        type="textarea"
        rows={2}
        required
      />

      {/* Answer Options */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          {t.optionsHeader}
        </label>
        <div className="space-y-3">
          {formData.options.map((option, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <BilingualInput
                  label={`${t.optionLabel} ${index + 1}`}
                  name={`option-${index}`}
                  value={option}
                  onChange={(value) => handleOptionChange(index, value)}
                  placeholder={`${t.optionPlaceholder} ${index + 1}...`}
                  type="input"
                  required
                />
              </div>
              {formData.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="mt-8 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-semibold"
                >
                  {t.removeOption}
                </button>
              )}
            </div>
          ))}
        </div>

        {formData.options.length < 6 && (
          <button
            type="button"
            onClick={handleAddOption}
            className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Plus className="w-4 h-4" />
            {t.addOption}
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
              {t.submitting}...
            </>
          ) : (
            t.submit
          )}
        </button>
        <p className="text-xs text-center text-neutral-500 mt-3">{t.review}</p>
      </div>
    </form>
  );
}
