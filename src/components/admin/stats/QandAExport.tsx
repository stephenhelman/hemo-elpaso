"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileDown, MessageSquare } from "lucide-react";

interface Question {
  id: string;
  questionEn: string;
  questionEs: string;
  answered: boolean;
  answerEn: string | null;
  answerEs: string | null;
  upvotes: number;
  isAnonymous: boolean;
  createdAt: Date;
}

interface Props {
  eventId: string;
  eventTitle: string;
  questions: Question[];
  eventSlug: string;
}

export default function QandAExport({
  eventId,
  eventTitle,
  questions,
  eventSlug,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  const handleExportCSV = () => {
    // Build PHI-free CSV - EXCLUDE patient names, only include Q&A content
    const csv = [
      `Q&A Summary - ${eventTitle}`,
      `Event ID: ${eventId}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "⚠️ PHI-FREE REPORT - No patient names included",
      "",
      "Question (EN),Question (ES),Answer (EN),Answer (ES),Upvotes,Status,Timestamp",
    ];

    questions.forEach((q) => {
      const answered = q.answered ? "Answered" : "Pending";
      const timestamp = new Date(q.createdAt).toLocaleString();

      csv.push(
        [
          `"${q.questionEn.replace(/"/g, '""')}"`,
          `"${q.questionEs.replace(/"/g, '""')}"`,
          q.answerEn ? `"${q.answerEn.replace(/"/g, '""')}"` : "",
          q.answerEs ? `"${q.answerEs.replace(/"/g, '""')}"` : "",
          q.upvotes,
          answered,
          timestamp,
        ].join(","),
      );
    });

    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventSlug}_q-and-a-summary_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const answeredQuestions = questions.filter((q) => q.answered);
  const topQuestions = [...questions]
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 mb-8">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5 text-neutral-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-neutral-600" />
              )}
            </button>
            <h2 className="text-xl font-display font-bold text-neutral-900">
              Q&A Summary (PHI-Free)
            </h2>
          </div>

          {questions.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-6">
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">
                No Q&A questions for this event
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <p className="text-sm font-medium text-purple-900">
                    Total Questions
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {questions.length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm font-medium text-green-900">Answered</p>
                  <p className="text-2xl font-bold text-green-900">
                    {answeredQuestions.length}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">
                    Answer Rate
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {Math.round(
                      (answeredQuestions.length / questions.length) * 100,
                    )}
                    %
                  </p>
                </div>
              </div>

              {/* Top 5 Questions by Upvotes */}
              <div>
                <h3 className="font-semibold text-neutral-900 mb-4">
                  Top Questions by Community Interest
                </h3>
                <div className="space-y-4">
                  {topQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className="p-4 rounded-lg border border-neutral-200 bg-neutral-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-purple-600">
                              #{index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-neutral-900 mb-1">
                              {question.questionEn}
                            </p>
                            <p className="text-sm text-neutral-600 italic">
                              {question.questionEs}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                            {question.upvotes} upvotes
                          </span>
                          {question.answered && (
                            <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                              Answered
                            </span>
                          )}
                        </div>
                      </div>

                      {question.answered && question.answerEn && (
                        <div className="mt-3 pl-11 border-l-2 border-green-200">
                          <p className="text-sm text-neutral-700 mb-1">
                            <strong>Answer:</strong> {question.answerEn}
                          </p>
                          <p className="text-xs text-neutral-600 italic">
                            {question.answerEs}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-1">
              ✅ PHI-Free & Sponsor-Safe
            </p>
            <p className="text-xs text-green-700">
              This report contains only questions, answers, and engagement
              metrics. No patient names or identifiable information is included.
              Safe to share with sponsors and external stakeholders.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
