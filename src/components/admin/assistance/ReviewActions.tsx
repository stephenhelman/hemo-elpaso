"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  applicationId: string;
  requestedAmount: number;
  adminEmail: string;
}

export default function ReviewActions({
  applicationId,
  requestedAmount,
  adminEmail,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"approve" | "deny" | null>(null);

  const [formData, setFormData] = useState({
    approvedAmount: requestedAmount.toString(),
    reviewNotes: "",
  });

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.approvedAmount || parseFloat(formData.approvedAmount) <= 0) {
      toast.error("Please enter a valid approved amount");
      return;
    }

    if (!confirm("Are you sure you want to approve this application?")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/assistance/${applicationId}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "APPROVE",
            approvedAmount: parseFloat(formData.approvedAmount),
            reviewNotes: formData.reviewNotes,
            reviewedBy: adminEmail,
          }),
        },
      );

      if (response.ok) {
        toast.success("Application approved!");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to approve application");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleDeny = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reviewNotes.trim()) {
      toast.error("Please provide a reason for denial");
      return;
    }

    if (!confirm("Are you sure you want to deny this application?")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/assistance/${applicationId}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "DENY",
            reviewNotes: formData.reviewNotes,
            reviewedBy: adminEmail,
          }),
        },
      );

      if (response.ok) {
        toast.success("Application denied");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to deny application");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  if (!action) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Review Application
        </h2>

        <div className="flex gap-3">
          <button
            onClick={() => setAction("approve")}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Approve
          </button>
          <button
            onClick={() => setAction("deny")}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
          >
            <XCircle className="w-5 h-5" />
            Deny
          </button>
        </div>
      </div>
    );
  }

  if (action === "approve") {
    return (
      <form
        onSubmit={handleApprove}
        className="bg-green-50 border border-green-200 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-green-900 mb-4">
          Approve Application
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-green-900 mb-2">
              Approved Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-700">
                $
              </span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.approvedAmount}
                onChange={(e) =>
                  setFormData({ ...formData, approvedAmount: e.target.value })
                }
                className="w-full pl-8 pr-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-green-700 mt-1">
              Requested: ${requestedAmount.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-green-900 mb-2">
              Review Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.reviewNotes}
              onChange={(e) =>
                setFormData({ ...formData, reviewNotes: e.target.value })
              }
              className="w-full px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Any notes for the patient or internal team..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => setAction(null)}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-green-300 text-green-700 font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Confirm Approval
              </>
            )}
          </button>
        </div>
      </form>
    );
  }

  // Deny form
  return (
    <form
      onSubmit={handleDeny}
      className="bg-red-50 border border-red-200 rounded-2xl p-6"
    >
      <h2 className="text-lg font-semibold text-red-900 mb-4">
        Deny Application
      </h2>

      <div>
        <label className="block text-sm font-medium text-red-900 mb-2">
          Reason for Denial *
        </label>
        <textarea
          required
          rows={4}
          value={formData.reviewNotes}
          onChange={(e) =>
            setFormData({ ...formData, reviewNotes: e.target.value })
          }
          className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Explain why this application is being denied. This will be visible to the patient."
        />
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={() => setAction(null)}
          disabled={loading}
          className="flex-1 px-4 py-2 rounded-lg border border-red-300 text-red-700 font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Denying...
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5" />
              Confirm Denial
            </>
          )}
        </button>
      </div>
    </form>
  );
}
