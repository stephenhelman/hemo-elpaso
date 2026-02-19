"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileDown, BarChart3 } from "lucide-react";

interface PollOption {
  id: string;
  textEn: string;
  textEs: string;
  _count: {
    responses: number;
  };
}

interface Poll {
  id: string;
  questionEn: string;
  questionEs: string;
  _count: {
    responses: number;
  };
  options: PollOption[];
}

interface Props {
  eventId: string;
  eventTitle: string;
  polls: Poll[];
  eventSlug: string;
}

export default function PollResultsExport({
  eventId,
  eventTitle,
  polls,
  eventSlug,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  const handleExportCSV = () => {
    // Build PHI-free CSV
    const csv = [
      `Poll Results - ${eventTitle}`,
      `Event ID: ${eventId}`,
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "⚠️ PHI-FREE REPORT - Contains aggregate data only",
      "",
    ];

    polls.forEach((poll, pollIndex) => {
      csv.push(`Poll ${pollIndex + 1}: ${poll.questionEn}`);
      csv.push(`Spanish: ${poll.questionEs}`);
      csv.push(`Total Responses: ${poll._count.responses}`);
      csv.push("");
      csv.push("Option,Votes,Percentage");

      poll.options.forEach((option) => {
        const percentage =
          poll._count.responses > 0
            ? ((option._count.responses / poll._count.responses) * 100).toFixed(
                1,
              )
            : "0.0";
        csv.push(
          `"${option.textEn}",${option._count.responses},${percentage}%`,
        );
      });

      csv.push("");
      csv.push("---");
      csv.push("");
    });

    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // BETTER NAMING: event-slug_poll-results_date.csv
    a.download = `${eventSlug}_poll-results_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
              Poll Results (PHI-Free)
            </h2>
          </div>

          {polls.length > 0 && (
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
          {polls.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">No polls for this event</p>
            </div>
          ) : (
            <div className="space-y-8">
              {polls.map((poll, pollIndex) => {
                const totalVotes = poll._count.responses;

                return (
                  <div key={poll.id} className="space-y-4">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900 mb-1">
                            Poll {pollIndex + 1}: {poll.questionEn}
                          </h3>
                          <p className="text-sm text-neutral-600 italic">
                            {poll.questionEs}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                          {totalVotes} votes
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {poll.options.map((option) => {
                        const votes = option._count.responses;
                        const percentage =
                          totalVotes > 0
                            ? ((votes / totalVotes) * 100).toFixed(1)
                            : "0.0";

                        return (
                          <div key={option.id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-neutral-900">
                                {option.textEn}
                              </span>
                              <span className="text-neutral-600">
                                {votes} votes ({percentage}%)
                              </span>
                            </div>
                            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {pollIndex < polls.length - 1 && (
                      <div className="border-t border-neutral-200 mt-6" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">
              ℹ️ PHI-Free Report
            </p>
            <p className="text-xs text-blue-700">
              This report contains only aggregate poll results. No personally
              identifiable information (PHI) is included. Safe to share with
              sponsors and donors.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
