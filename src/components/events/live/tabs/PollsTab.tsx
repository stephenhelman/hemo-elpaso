"use client";

import { useState } from "react";
import { BarChart3, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";

interface PollOption {
  id: string;
  textEn: string;
  textEs: string;
  voteCount: number;
}

interface ActivePoll {
  id: string;
  questionEn: string;
  questionEs: string;
  options: PollOption[];
  totalResponses: number;
}

interface Props {
  eventId: string;
  polls: ActivePoll[];
  sessionToken: string;
  votedPolls: Record<string, string>;
  onVote: (pollId: string, optionId: string) => void;
  lang: "en" | "es";
}

export default function PollsTab({
  eventId,
  polls,
  sessionToken,
  votedPolls,
  onVote,
  lang,
}: Props) {
  const isEs = lang === "es";
  const [voting, setVoting] = useState<string | null>(null);

  const handleVote = async (pollId: string, optionId: string) => {
    if (votedPolls[pollId]) return;
    setVoting(optionId);

    try {
      const res = await fetch(`/api/events/${eventId}/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId, sessionToken }),
      });

      if (res.ok) {
        onVote(pollId, optionId);
        toast.success(isEs ? "¡Voto registrado!" : "Vote recorded!");
      } else {
        const data = await res.json();
        toast.error(data.error || (isEs ? "Error al votar" : "Failed to vote"));
      }
    } catch {
      toast.error(isEs ? "Error al votar" : "Failed to vote");
    } finally {
      setVoting(null);
    }
  };

  return (
    <div className="space-y-6">
      {polls.map((poll) => {
        const voted = votedPolls[poll.id];
        const total = poll.totalResponses || 1; // avoid divide by zero

        return (
          <div key={poll.id} className="bg-neutral-800/60 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                <BarChart3 className="w-4 h-4 text-primary-400" />
              </div>
              <p className="font-semibold text-white">
                {isEs ? poll.questionEs : poll.questionEn}
              </p>
            </div>

            <div className="space-y-2">
              {poll.options.map((option) => {
                const pct = voted
                  ? Math.round((option.voteCount / total) * 100)
                  : 0;
                const isSelected = voted === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleVote(poll.id, option.id)}
                    disabled={!!voted || voting === option.id}
                    className={`w-full text-left rounded-xl transition-all overflow-hidden ${
                      voted
                        ? "cursor-default"
                        : "hover:ring-2 hover:ring-primary cursor-pointer"
                    } ${
                      isSelected
                        ? "ring-2 ring-primary"
                        : voted
                          ? "ring-1 ring-neutral-700"
                          : "ring-1 ring-neutral-700 hover:ring-primary"
                    }`}
                  >
                    <div className="relative p-3">
                      {/* Progress bar behind */}
                      {voted && (
                        <div
                          className={`absolute inset-0 rounded-xl transition-all duration-500 ${
                            isSelected ? "bg-primary/20" : "bg-neutral-700/40"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      )}

                      <div className="relative flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary shrink-0" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              isSelected ? "text-white" : "text-neutral-300"
                            }`}
                          >
                            {isEs ? option.textEs : option.textEn}
                          </span>
                        </div>
                        {voted && (
                          <span
                            className={`text-sm font-bold shrink-0 ${
                              isSelected
                                ? "text-primary-300"
                                : "text-neutral-400"
                            }`}
                          >
                            {pct}%
                          </span>
                        )}
                        {!voted && voting === option.id && (
                          <Loader2 className="w-4 h-4 text-neutral-400 animate-spin shrink-0" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {voted && (
              <p className="text-xs text-neutral-500 text-right mt-2">
                {poll.totalResponses} {isEs ? "respuestas" : "responses"}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
