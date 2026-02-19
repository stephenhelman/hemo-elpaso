"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Trash2, CheckCircle, Clock, Pencil } from "lucide-react";

interface Poll {
  id: string;
  titleEn: string;
  titleEs: string;
  options: any;
  status: string;
  active: boolean;
  sequenceOrder: number;
  createdBy: string | null;
  createdAt: Date;
}

interface Props {
  eventId: string;
  polls: Poll[];
  adminEmail: string;
}

export default function PollsList({ eventId, polls, adminEmail }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Group polls by status
  const pendingPolls = polls.filter((p) => p.status === "pending");
  const approvedPolls = polls.filter(
    (p) => p.status === "approved" || p.status === "active",
  );
  const draftPolls = polls.filter((p) => p.status === "draft");

  const handleToggleActive = async (pollId: string, currentActive: boolean) => {
    setLoading(pollId);

    try {
      const response = await fetch(`/api/admin/polls/${pollId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to toggle poll");
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(null);
    }
  };

  const handleApprove = async (pollId: string) => {
    setLoading(pollId);

    try {
      const response = await fetch(`/api/admin/polls/${pollId}/approve`, {
        method: "PATCH",
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to approve poll");
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (pollId: string) => {
    if (!confirm("Are you sure you want to delete this poll?")) return;

    setLoading(pollId);

    try {
      const response = await fetch(`/api/admin/polls/${pollId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to delete poll");
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(null);
    }
  };

  if (polls.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <BarChart3 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <p className="text-neutral-500 mb-4">No polls created yet</p>
        <p className="text-sm text-neutral-400">
          Create a poll manually or invite a rep to create one
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Polls - Need Approval */}
      {pendingPolls.length > 0 && (
        <div>
          <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Pending Approval ({pendingPolls.length})
          </h2>
          <div className="space-y-3">
            {pendingPolls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                onToggleActive={handleToggleActive}
                onApprove={handleApprove}
                onDelete={handleDelete}
                loading={loading === poll.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active/Approved Polls */}
      {approvedPolls.length > 0 && (
        <div>
          <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Active & Approved ({approvedPolls.length})
          </h2>
          <div className="space-y-3">
            {approvedPolls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                onToggleActive={handleToggleActive}
                onApprove={handleApprove}
                onDelete={handleDelete}
                loading={loading === poll.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Draft Polls */}
      {draftPolls.length > 0 && (
        <div>
          <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Pencil className="w-5 h-5 text-neutral-600" />
            Drafts ({draftPolls.length})
          </h2>
          <div className="space-y-3">
            {draftPolls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                onToggleActive={handleToggleActive}
                onApprove={handleApprove}
                onDelete={handleDelete}
                loading={loading === poll.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PollCard({
  poll,
  onToggleActive,
  onApprove,
  onDelete,
  loading,
}: {
  poll: Poll;
  onToggleActive: (id: string, active: boolean) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const options = poll.options?.options || [];
  const isFromRep = poll.createdBy?.startsWith("rep:");
  const repEmail = isFromRep ? poll.createdBy.replace("rep:", "") : null;

  const statusConfig =
    {
      draft: { bg: "bg-neutral-100", text: "text-neutral-600", label: "Draft" },
      pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
      approved: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Approved",
      },
      active: { bg: "bg-blue-100", text: "text-blue-700", label: "Live" },
    }[poll.status] || statusConfig.draft;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-neutral-900 text-lg">
              {poll.titleEn}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
            >
              {statusConfig.label}
            </span>
            {poll.active && (
              <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                LIVE
              </div>
            )}
          </div>

          {repEmail && (
            <p className="text-sm text-neutral-500">
              Created by rep: {repEmail}
            </p>
          )}

          <div className="mt-3 space-y-2">
            {options.map((opt: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-sm text-neutral-600"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                {opt.text}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {poll.status === "pending" && (
            <button
              onClick={() => onApprove(poll.id)}
              disabled={loading}
              className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
              title="Approve"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
          )}

          {(poll.status === "approved" || poll.status === "active") && (
            <button
              onClick={() => onToggleActive(poll.id, poll.active)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                poll.active
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
              title={poll.active ? "Remove from live feed" : "Add to live feed"}
            >
              {poll.active ? "Remove from Live" : "Add to Live"}
            </button>
          )}

          <button
            onClick={() => onDelete(poll.id)}
            disabled={loading}
            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
