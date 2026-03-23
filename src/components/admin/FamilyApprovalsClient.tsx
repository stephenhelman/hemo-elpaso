"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Clock, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";

interface Membership {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  ageTier: string;
  family: {
    name: string;
    primaryPatient: {
      email: string;
      contactProfile: { firstName: string; lastName: string } | null;
    };
  };
}

interface Approval {
  id: string;
  type: string;
  status: string;
  requestedBy: string;
  requestedAt: string;
  notes: string | null;
  membership: Membership | null;
}

interface Props {
  approvals: Approval[];
}

export default function FamilyApprovalsClient({ approvals }: Props) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAction = async (
    approvalId: string,
    action: "approve" | "deny",
    memberName: string
  ) => {
    const verb = action === "approve" ? "Approve" : "Deny";
    const confirmed = await confirm({
      title: `${verb} Detachment?`,
      message:
        action === "approve"
          ? `Approve the permanent detachment of ${memberName} from their family group? This cannot be undone.`
          : `Deny the detachment request for ${memberName}? They will remain in their family group.`,
      confirmText: verb,
      variant: action === "approve" ? "success" : "danger",
    });
    if (!confirmed) return;

    setProcessing(approvalId);
    try {
      const res = await fetch(`/api/admin/family-approvals/${approvalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || `Failed to ${action}`);
        return;
      }
      toast.success(
        action === "approve"
          ? `${memberName} detached from family`
          : `Detachment request denied`
      );
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setProcessing(null);
    }
  };

  if (approvals.length === 0) {
    return (
      <>
        <ConfirmDialog />
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-neutral-500 text-sm">
            No pending family detachment requests.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <ConfirmDialog />
      <div className="space-y-4">
        {approvals.map((approval) => {
          const m = approval.membership;
          const memberName = m
            ? `${m.firstName} ${m.lastName}`
            : "Unknown Member";
          const primaryName = m?.family.primaryPatient.contactProfile
            ? `${m.family.primaryPatient.contactProfile.firstName} ${m.family.primaryPatient.contactProfile.lastName}`
            : m?.family.primaryPatient.email ?? "Unknown";

          return (
            <div
              key={approval.id}
              className="bg-white border border-neutral-200 rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                    <span className="text-xs text-neutral-400">
                      Family Detachment
                    </span>
                  </div>

                  <h3 className="font-semibold text-neutral-900 text-lg">
                    {memberName}
                  </h3>

                  <div className="text-sm text-neutral-500 mt-1 space-y-0.5">
                    {m && (
                      <>
                        <p>
                          Relationship: <span className="capitalize">{m.relationship}</span>{" "}
                          · Age tier: {m.ageTier.replace("_", " ")}
                        </p>
                        <p>
                          Family: <strong>{m.family.name}</strong> (primary
                          member: {primaryName})
                        </p>
                      </>
                    )}
                    <p>
                      Requested:{" "}
                      {new Date(approval.requestedAt).toLocaleDateString(
                        "en-US",
                        { month: "long", day: "numeric", year: "numeric" }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button
                    onClick={() =>
                      handleAction(approval.id, "deny", memberName)
                    }
                    disabled={processing === approval.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-red-300 text-red-700 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {processing === approval.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Deny
                  </button>
                  <button
                    onClick={() =>
                      handleAction(approval.id, "approve", memberName)
                    }
                    disabled={processing === approval.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
                  >
                    {processing === approval.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
