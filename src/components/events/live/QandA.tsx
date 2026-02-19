"use client";

import { useState, useEffect } from "react";
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
  originalLang: string;
  patientName: string | null;
  isAnonymous: boolean;
  upvotes: number;
  hasUpvoted: boolean;
  answered: boolean;
  answerEn: string | null;
  answerEs: string | null;
  answeredAt: Date | null;
  createdAt: Date;
}

interface Props {
  eventId: string;
  sessionToken: string;
  patientId?: string;
  patientName?: string;
  lang: "en" | "es";
}

export default function QandA({
  eventId,
  sessionToken,
  patientId,
  patientName,
  lang,
}: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "unanswered" | "answered">(
    "all",
  );

  const [newQuestion, setNewQuestion] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Fetch questions
  useEffect(() => {
    fetchQuestions();
    const interval = setInterval(fetchQuestions, 5000);
    return () => clearInterval(interval);
  }, [eventId, filter]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(
        `/api/events/${eventId}/questions?sessionToken=${sessionToken}&filter=${filter}`,
      );
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          patientId,
          patientName: isAnonymous ? null : patientName,
          isAnonymous,
          question: newQuestion,
        }),
      });

      if (response.ok) {
        toast.success("Question submitted!");
        setNewQuestion("");
        fetchQuestions();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to submit question");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    try {
      const response = await fetch(
        `/api/events/${eventId}/questions/${questionId}/upvote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken }),
        },
      );

      if (response.ok) {
        fetchQuestions();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to upvote");
      }
    } catch (error) {
      console.error("Upvote error:", error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-3" />
        <p className="text-neutral-400 text-sm">Loading questions...</p>
      </div>
    );
  }

  const t = {
    en: {
      title: "Q&A with Sponsors",
      askQuestion: "Ask a Question",
      yourQuestion: "Your question...",
      submitAnonymously: "Submit anonymously",
      submit: "Submit Question",
      all: "All",
      unanswered: "Unanswered",
      answered: "Answered",
      upvote: "Upvote",
      anonymous: "Anonymous",
      noQuestions: "No questions yet. Be the first to ask!",
      answer: "Answer",
    },
    es: {
      title: "Preguntas y Respuestas con Patrocinadores",
      askQuestion: "Hacer una Pregunta",
      yourQuestion: "Tu pregunta...",
      submitAnonymously: "Enviar anónimamente",
      submit: "Enviar Pregunta",
      all: "Todas",
      unanswered: "Sin Responder",
      answered: "Respondidas",
      upvote: "Votar",
      anonymous: "Anónimo",
      noQuestions: "¡No hay preguntas todavía. Sé el primero en preguntar!",
      answer: "Respuesta",
    },
  }[lang];

  return (
    <div className="space-y-6">
      {/* Submit Question Form */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
        <h3 className="font-display font-bold text-white text-lg mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {t.askQuestion}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder={t.yourQuestion}
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 text-primary focus:ring-primary"
              />
              <span className="text-sm text-neutral-300">
                {t.submitAnonymously}
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !newQuestion.trim()}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {t.submit}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "unanswered", "answered"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === f
                ? "bg-primary text-white"
                : "bg-white/10 text-neutral-300 hover:bg-white/20"
            }`}
          >
            {t[f]}
          </button>
        ))}
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-12 text-center">
          <MessageSquare className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
          <p className="text-neutral-400">{t.noQuestions}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onUpvote={handleUpvote}
              lang={lang}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  onUpvote,
  lang,
  t,
}: {
  question: Question;
  onUpvote: (id: string) => void;
  lang: "en" | "es";
  t: any;
}) {
  const questionText =
    lang === "en" ? question.questionEn : question.questionEs;
  const answerText = lang === "en" ? question.answerEn : question.answerEs;

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
      <div className="flex gap-4">
        {/* Upvote Button */}
        <button
          onClick={() => onUpvote(question.id)}
          disabled={question.hasUpvoted}
          className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
            question.hasUpvoted
              ? "bg-primary/20 text-primary cursor-default"
              : "bg-white/10 text-neutral-300 hover:bg-white/20"
          }`}
        >
          <ThumbsUp className="w-5 h-5" />
          <span className="text-xs font-semibold">{question.upvotes}</span>
        </button>

        {/* Question Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-white font-medium">{questionText}</p>
              <p className="text-xs text-neutral-400 mt-1">
                {question.isAnonymous ? t.anonymous : question.patientName} •{" "}
                {new Date(question.createdAt).toLocaleTimeString(lang, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {question.answered && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                <CheckCircle className="w-3 h-3" />
                {t.answered}
              </div>
            )}
          </div>

          {/* Answer */}
          {question.answered && answerText && (
            <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-primary-300 font-semibold mb-1">
                {t.answer}:
              </p>
              <p className="text-white text-sm">{answerText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
