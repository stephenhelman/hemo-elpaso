"use client";

import { useState, useEffect } from "react";
import { BarChart3, Users, CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  titleEn: string;
  titleEs: string;
  options: PollOption[];
  totalVotes: number;
  active: boolean;
}

interface Props {
  eventId: string;
  sessionToken: string;
  lang: string;
}

export default function LivePoll({ eventId, sessionToken, lang }: Props) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());

  // Fetch active polls
  useEffect(() => {
    fetchPolls();

    // Poll every 5 seconds for updates
    const interval = setInterval(fetchPolls, 5000);
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchPolls = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/polls`);
      if (response.ok) {
        const data = await response.json();
        setPolls(data.polls || []);
        setVotedPolls(new Set(data.votedPollIds || []));
      }
    } catch (error) {
      console.error("Failed to fetch polls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    setVoting(pollId);

    try {
      const response = await fetch(
        `/api/events/${eventId}/polls/${pollId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken,
            optionId,
          }),
        },
      );

      if (response.ok) {
        setVotedPolls((prev) => new Set([...prev, pollId]));
        await fetchPolls(); // Refresh results
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to vote");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit vote",
      );
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-3" />
        <p className="text-neutral-400 text-sm">Loading polls...</p>
      </div>
    );
  }

  const activePolls = polls.filter((p) => p.active);

  if (activePolls.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
        <BarChart3 className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
        <p className="text-neutral-400 text-sm">
          No active polls at the moment
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activePolls.map((poll) => {
        const hasVoted = votedPolls.has(poll.id);
        const isVoting = voting === poll.id;
        const title = lang === "en" ? poll.titleEn : poll.titleEs;

        return (
          <div
            key={poll.id}
            className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6"
          >
            {/* Poll Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h3 className="font-display font-bold text-white text-lg mb-1">
                  {title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Users className="w-4 h-4" />
                  <span>{poll.totalVotes} votes</span>
                </div>
              </div>
              {hasVoted && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                  <CheckCircle className="w-3 h-3" />
                  Voted
                </div>
              )}
            </div>

            {/* Poll Options */}
            <div className="space-y-3">
              {poll.options.map((option) => {
                const percentage =
                  poll.totalVotes > 0
                    ? Math.round((option.votes / poll.totalVotes) * 100)
                    : 0;

                return (
                  <button
                    key={option.id}
                    onClick={() =>
                      !hasVoted && !isVoting && handleVote(poll.id, option.id)
                    }
                    disabled={hasVoted || isVoting}
                    className={`
                      w-full text-left relative overflow-hidden rounded-xl border-2 transition-all
                      ${
                        hasVoted
                          ? "border-white/10 cursor-default"
                          : "border-white/20 hover:border-primary-400 hover:bg-white/10 cursor-pointer"
                      }
                      ${isVoting ? "opacity-50" : ""}
                    `}
                  >
                    {/* Progress Bar Background */}
                    {hasVoted && (
                      <div
                        className="absolute inset-0 bg-primary-500/20 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    )}

                    {/* Option Content */}
                    <div className="relative z-10 p-4 flex items-center justify-between">
                      <span className="font-medium text-white">
                        {option.text}
                      </span>
                      {hasVoted && (
                        <span className="text-primary-300 font-bold text-sm">
                          {percentage}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Loading State */}
            {isVoting && (
              <div className="mt-4 flex items-center justify-center gap-2 text-primary-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting vote...
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
