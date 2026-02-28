"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";
import {
  MessageSquare,
  ThumbsUp,
  Trash2,
  CheckCircle,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { adminQuestionsTranslation } from "@/translation/adminEvents";
import type { Lang } from "@/types";

interface Question {
  id: string;
  questionEn: string;
  questionEs: string;
  originalLang: string;
  patientName: string | null;
  isAnonymous: boolean;
  upvotes: number;
  answered: boolean;
  answerEn: string | null;
  answerEs: string | null;
  answeredAt: Date | null;
  createdAt: Date;
}

interface Props {
  eventId: string;
  questions: Question[];
  adminEmail: string;
  locale: Lang;
}

export default function QuestionsList({
  eventId,
  questions,
  adminEmail,
  locale,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [answerForm, setAnswerForm] = useState({ answerEn: "", answerEs: "" });
  const { confirm, ConfirmDialog } = useConfirm();
  const t = adminQuestionsTranslation[locale];

  const handleStartAnswer = (question: Question) => {
    setEditingId(question.id);
    setAnswerForm({
      answerEn: question.answerEn || "",
      answerEs: question.answerEs || "",
    });
  };

  const handleCancelAnswer = () => {
    setEditingId(null);
    setAnswerForm({ answerEn: "", answerEs: "" });
  };

  const handleSaveAnswer = async (questionId: string) => {
    if (!answerForm.answerEn.trim() || !answerForm.answerEs.trim()) {
      toast.error(t.provideAnswers);
      return;
    }

    setLoading(questionId);

    try {
      const response = await fetch(
        `/api/admin/questions/${questionId}/answer`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answerEn: answerForm.answerEn,
            answerEs: answerForm.answerEs,
            answeredBy: adminEmail,
          }),
        },
      );

      if (response.ok) {
        toast.success(t.toastAnswerSaved);
        setEditingId(null);
        setAnswerForm({ answerEn: "", answerEs: "" });
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save answer");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (questionId: string) => {
    const confirmed = await confirm({
      title: t.deleteConfirmTitle,
      message: t.deleteConfirmMsg,
      confirmText: t.deleteConfirmBtn,
      variant: "danger",
    });

    if (!confirmed) return;

    setLoading(questionId);

    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(t.toastDeleted);
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete question");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(null);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <p className="text-neutral-500">{t.noQuestions}</p>
      </div>
    );
  }

  const unanswered = questions.filter((q) => !q.answered);
  const answered = questions.filter((q) => q.answered);

  return (
    <>
      <ConfirmDialog />

      <div className="space-y-6">
        {/* Unanswered Questions */}
        {unanswered.length > 0 && (
          <div>
            <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600" />
              {t.unanswered(unanswered.length)}
            </h2>
            <div className="space-y-4">
              {unanswered.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  isEditing={editingId === question.id}
                  answerForm={answerForm}
                  onStartAnswer={handleStartAnswer}
                  onCancelAnswer={handleCancelAnswer}
                  onSaveAnswer={handleSaveAnswer}
                  onDelete={handleDelete}
                  onAnswerChange={setAnswerForm}
                  loading={loading === question.id}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}

        {/* Answered Questions */}
        {answered.length > 0 && (
          <div>
            <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              {t.answered(answered.length)}
            </h2>
            <div className="space-y-4">
              {answered.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  isEditing={editingId === question.id}
                  answerForm={answerForm}
                  onStartAnswer={handleStartAnswer}
                  onCancelAnswer={handleCancelAnswer}
                  onSaveAnswer={handleSaveAnswer}
                  onDelete={handleDelete}
                  onAnswerChange={setAnswerForm}
                  loading={loading === question.id}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function QuestionCard({
  question,
  isEditing,
  answerForm,
  onStartAnswer,
  onCancelAnswer,
  onSaveAnswer,
  onDelete,
  onAnswerChange,
  loading,
  t,
}: {
  question: Question;
  isEditing: boolean;
  answerForm: { answerEn: string; answerEs: string };
  onStartAnswer: (q: Question) => void;
  onCancelAnswer: () => void;
  onSaveAnswer: (id: string) => void;
  onDelete: (id: string) => void;
  onAnswerChange: (form: any) => void;
  loading: boolean;
  t: typeof adminQuestionsTranslation["en"];
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      {/* Question Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100">
              <ThumbsUp className="w-4 h-4 text-neutral-600" />
              <span className="text-sm font-semibold text-neutral-900">
                {question.upvotes}
              </span>
            </div>
            {question.answered && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                <CheckCircle className="w-3 h-3" />
                {t.answeredBadge}
              </div>
            )}
          </div>

          <p className="text-sm text-neutral-500 mb-1">
            {question.isAnonymous ? t.anonymous : question.patientName} •{" "}
            {new Date(question.createdAt).toLocaleString()}
          </p>
        </div>

        <button
          onClick={() => onDelete(question.id)}
          disabled={loading}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title={t.deleteConfirmBtn}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Question Content */}
      <div className="space-y-3 mb-4">
        <div>
          <p className="text-xs text-neutral-500 font-semibold mb-1">
            {t.english}
          </p>
          <p className="text-neutral-900">{question.questionEn}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 font-semibold mb-1">
            {t.spanish}
          </p>
          <p className="text-neutral-900">{question.questionEs}</p>
        </div>
      </div>

      {/* Answer Section */}
      {isEditing ? (
        <div className="space-y-4 p-4 bg-primary-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t.answerEnglish}
            </label>
            <textarea
              value={answerForm.answerEn}
              onChange={(e) =>
                onAnswerChange({ ...answerForm, answerEn: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t.answerSpanish}
            </label>
            <textarea
              value={answerForm.answerEs}
              onChange={(e) =>
                onAnswerChange({ ...answerForm, answerEs: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancelAnswer}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button
              onClick={() => onSaveAnswer(question.id)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {t.saveAnswer}
            </button>
          </div>
        </div>
      ) : question.answered ? (
        <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
          <div>
            <p className="text-xs text-green-700 font-semibold mb-1">
              {t.answerEnglish}
            </p>
            <p className="text-neutral-900">{question.answerEn}</p>
          </div>
          <div>
            <p className="text-xs text-green-700 font-semibold mb-1">
              {t.answerSpanish}
            </p>
            <p className="text-neutral-900">{question.answerEs}</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => onStartAnswer(question)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-primary hover:bg-primary-50 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              {t.editAnswer}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onStartAnswer(question)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          {t.answerQuestion}
        </button>
      )}
    </div>
  );
}
