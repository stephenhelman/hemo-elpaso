"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import type { Lang } from "@/types";

interface VolunteerAssignment {
  id: string;
  event: { id: string; titleEn: string; eventDate: string };
}

interface VolunteerProfile {
  id: string;
  status: string;
  createdAt: string;
  rejectionReason: string | null;
  patient: {
    email: string;
    contactProfile: {
      firstName: string;
      lastName: string;
    } | null;
  };
  applications: { submittedAt: string | null }[];
  eventAssignments: VolunteerAssignment[];
}

interface Props {
  initialVolunteers: VolunteerProfile[];
  locale: Lang;
}

const statusBadge: Record<string, { label: string; className: string }> = {
  PENDING_REVIEW: {
    label: "Pending Review",
    className: "bg-amber-100 text-amber-800",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-green-100 text-green-800",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800",
  },
};

export default function VolunteersClient({ initialVolunteers, locale: _locale }: Props) {
  const [volunteers, setVolunteers] = useState<VolunteerProfile[]>(initialVolunteers);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/volunteers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setVolunteers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: "APPROVED" } : v)),
      );
      toast.success("Volunteer approved");
    } catch (err: any) {
      toast.error(err.message || "Failed to approve");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/volunteers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setVolunteers((prev) =>
        prev.map((v) =>
          v.id === id ? { ...v, status: "REJECTED", rejectionReason } : v,
        ),
      );
      setRejectingId(null);
      setRejectionReason("");
      toast.success("Volunteer rejected");
    } catch (err: any) {
      toast.error(err.message || "Failed to reject");
    } finally {
      setLoadingId(null);
    }
  };

  if (volunteers.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-400">
        <p className="text-lg font-medium">No volunteer applications yet</p>
        <p className="text-sm mt-1">Applications will appear here when patients express interest during registration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {volunteers.map((vol) => {
        const name = vol.patient.contactProfile
          ? `${vol.patient.contactProfile.firstName} ${vol.patient.contactProfile.lastName}`
          : vol.patient.email;
        const badge = statusBadge[vol.status] ?? { label: vol.status, className: "bg-neutral-100 text-neutral-700" };
        const submittedAt = vol.applications[0]?.submittedAt
          ? new Date(vol.applications[0].submittedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—";

        return (
          <div
            key={vol.id}
            className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-neutral-900">{name}</p>
                <p className="text-sm text-neutral-500">{vol.patient.email}</p>
                <p className="text-xs text-neutral-400 mt-0.5">Applied: {submittedAt}</p>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>

            {/* Pending review actions */}
            {vol.status === "PENDING_REVIEW" && (
              <div className="space-y-3">
                {rejectingId === vol.id ? (
                  <div className="space-y-2">
                    <textarea
                      placeholder="Rejection reason (optional)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                      className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(vol.id)}
                        disabled={loadingId === vol.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        {loadingId === vol.id ? "Rejecting…" : "Confirm Reject"}
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setRejectionReason("");
                        }}
                        className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(vol.id)}
                      disabled={loadingId === vol.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {loadingId === vol.id ? "Approving…" : "Approve"}
                    </button>
                    <button
                      onClick={() => setRejectingId(vol.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-semibold hover:bg-red-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Approved: show event assignments */}
            {vol.status === "APPROVED" && (
              <div className="text-sm text-neutral-600">
                <span className="font-medium text-green-700">Approved</span>
                {vol.eventAssignments.length > 0 ? (
                  <span className="ml-2 text-neutral-500">
                    {vol.eventAssignments.length} event assignment{vol.eventAssignments.length !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="ml-2 text-neutral-400">No event assignments yet</span>
                )}
              </div>
            )}

            {/* Rejected: show reason */}
            {vol.status === "REJECTED" && vol.rejectionReason && (
              <p className="text-sm text-neutral-500">
                <span className="font-medium text-red-700">Reason:</span> {vol.rejectionReason}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
