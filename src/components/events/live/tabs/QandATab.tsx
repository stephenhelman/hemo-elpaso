"use client";

import { useState } from "react";
import {
  MessageSquare,
  ThumbsUp,
  Send,
  Loader2,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface Question {
  id: string;
  questionEn: string;
  questionEs: string;
  upvotes: number;
  answered: boolean;
  answerEn: string | null;
  answerEs: string | null;
  isAnonymous: boolean;
  patientName: string | null;
}

interface Props {
  eventId: string;
  questions: Question[];
  sessionToken: string;
  patientId: string | null;
  patientName: string | undefined;
  lang: "en" | "es";
}

export default function QandATab({
  eventId,
  questions,
  sessionToken,
  patientId,
  patientName,
  lang,
}: Props) {
  const isEs = lang === "es";
  const [questionText, setQuestionText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [upvoting, setUpvoting] = useState<string | null>(null);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());

  const unanswered = questions.filter((q) => !q.answered);
  const answered = questions.filter((q) => q.answered);

  const handleSubmit = async () => {
    if (!questionText.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/events/${eventId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText.trim(),
          sessionToken,
          patientId,
          patientName: isAnonymous ? null : patientName,
          isAnonymous,
          lang,
        }),
      });

      if (res.ok) {
        setQuestionText("");
        toast.success(isEs ? "¡Pregunta enviada!" : "Question submitted!");
      } else {
        const data = await res.json();
        toast.error(
          data.error || (isEs ? "Error al enviar" : "Failed to submit"),
        );
      }
    } catch {
      toast.error(isEs ? "Error al enviar" : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    if (upvoted.has(questionId)) return;
    setUpvoting(questionId);

    try {
      const res = await fetch(
        `/api/events/${eventId}/questions/${questionId}/upvote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken }),
        },
      );

      if (res.ok) {
        setUpvoted((prev) => new Set([...prev, questionId]));
      }
    } catch {
      // silently fail
    } finally {
      setUpvoting(null);
    }
  };

  const t = {
    askTitle: isEs ? "Haz una pregunta" : "Ask a Question",
    placeholder: isEs ? "¿Qué quieres preguntar?" : "What do you want to ask?",
    anonymous: isEs ? "Enviar anónimamente" : "Send anonymously",
    submit: isEs ? "Enviar" : "Submit",
    unanswered: isEs ? "Sin responder" : "Unanswered",
    answered: isEs ? "Respondidas" : "Answered",
    upvote: isEs ? "votos" : "upvotes",
    answeredBadge: isEs ? "Respondida" : "Answered",
  };

  return (
    <div className="space-y-6">
      {/* Ask a question */}
      <div className="bg-neutral-800/60 rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-3">{t.askTitle}</h3>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder={t.placeholder}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-neutral-700 border border-neutral-600 text-white placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-neutral-400 text-sm">{t.anonymous}</span>
          </label>
          <button
            onClick={handleSubmit}
            disabled={submitting || !questionText.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {t.submit}
          </button>
        </div>
      </div>

      {/* Unanswered questions */}
      {unanswered.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">
            {t.unanswered} ({unanswered.length})
          </h3>
          <div className="space-y-2">
            {unanswered.map((q) => (
              <div key={q.id} className="bg-neutral-800/60 rounded-xl p-4">
                <p className="text-white text-sm mb-3">
                  {isEs ? q.questionEs : q.questionEn}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    {q.isAnonymous
                      ? isEs
                        ? "Anónimo"
                        : "Anonymous"
                      : q.patientName}
                  </span>
                  <button
                    onClick={() => handleUpvote(q.id)}
                    disabled={upvoted.has(q.id) || upvoting === q.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      upvoted.has(q.id)
                        ? "bg-primary/20 text-primary-300 cursor-default"
                        : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600 hover:text-white"
                    }`}
                  >
                    {upvoting === q.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ThumbsUp className="w-3 h-3" />
                    )}
                    {q.upvotes + (upvoted.has(q.id) ? 1 : 0)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answered questions */}
      {answered.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">
            {t.answered} ({answered.length})
          </h3>
          <div className="space-y-2">
            {answered.map((q) => (
              <div
                key={q.id}
                className="bg-green-900/20 border border-green-800/40 rounded-xl p-4"
              >
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <p className="text-neutral-300 text-sm">
                    {isEs ? q.questionEs : q.questionEn}
                  </p>
                </div>
                {(isEs ? q.answerEs : q.answerEn) && (
                  <div className="ml-6 mt-2 pt-2 border-t border-green-800/30">
                    <p className="text-green-300 text-sm">
                      {isEs ? q.answerEs : q.answerEn}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
