"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Mail,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  UserX,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  relationship: string;
  ageTier: "RECORD_ONLY" | "YOUTH" | "ADULT";
  status: "ACTIVE" | "PENDING_INVITE" | "DETACHED";
  hasBleedingDisorder: boolean;
  diagnosisVerified: boolean;
  patientId: string | null;
  inviteEmail: string | null;
  inviteSentAt: string | null;
  boardApprovalId: string | null;
  disorderCondition: string | null;
  disorderSeverity: string | null;
}

interface Family {
  id: string;
  name: string;
  primaryPatientId: string;
  memberships: FamilyMember[];
}

interface Props {
  initialFamily: Family | null;
  patientId: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const AGE_TIER_LABEL: Record<string, string> = {
  RECORD_ONLY: "Under 13",
  YOUTH: "Youth (13–17)",
  ADULT: "Adult (18+)",
};

const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Spouse / Partner" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "other", label: "Other Family" },
];

const inputClass =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary";

// ─── Main component ───────────────────────────────────────────────────────────

export default function FamilyPageContent({ initialFamily, patientId }: Props) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [family, setFamily] = useState<Family | null>(initialFamily);
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // ── Create family ─────────────────────────────────────────────────────────

  const handleCreateFamily = async () => {
    setCreatingFamily(true);
    try {
      const res = await fetch("/api/portal/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        toast.error("Failed to create family");
        return;
      }
      const data = await res.json();
      setFamily({ ...data.family, memberships: [] });
      toast.success("Family created!");
    } catch {
      toast.error("Failed to create family");
    } finally {
      setCreatingFamily(false);
    }
  };

  // ── Refresh ───────────────────────────────────────────────────────────────

  const refresh = () => router.refresh();

  // ── No family state ───────────────────────────────────────────────────────

  if (!family) {
    return (
      <>
        <ConfirmDialog />
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold text-neutral-900 mb-2">
            Create Your Family Group
          </h2>
          <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
            Add your family members so you can RSVP together and share relevant
            resources.
          </p>
          <button
            onClick={handleCreateFamily}
            disabled={creatingFamily}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {creatingFamily ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Create Family Group
          </button>
        </div>
      </>
    );
  }

  const activeMembers = family.memberships.filter(
    (m) => m.status !== "DETACHED"
  );

  return (
    <>
      <ConfirmDialog />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              {family.name}
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {activeMembers.length} member{activeMembers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>

        {/* Add member form */}
        {showAddForm && (
          <AddMemberForm
            familyId={family.id}
            onSuccess={() => {
              setShowAddForm(false);
              refresh();
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Member list */}
        {activeMembers.length === 0 && !showAddForm ? (
          <div className="text-center py-10 border-2 border-dashed border-neutral-200 rounded-2xl">
            <p className="text-sm text-neutral-400">
              No family members yet. Add your first member above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isPrimary={member.patientId === patientId}
                onInviteSuccess={refresh}
                onDetachSuccess={refresh}
                onDeleteSuccess={refresh}
                confirm={confirm}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── AddMemberForm ────────────────────────────────────────────────────────────

function AddMemberForm({
  familyId,
  onSuccess,
  onCancel,
}: {
  familyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    relationship: "",
    hasBleedingDisorder: false,
    disorderCondition: "",
    disorderSeverity: "",
  });

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.relationship) {
      toast.error("First name, last name, and relationship are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/portal/family/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Failed to add member");
        return;
      }
      toast.success(`${form.firstName} added to your family`);
      onSuccess();
    } catch {
      toast.error("Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold text-neutral-900">Add Family Member</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className={inputClass}
            placeholder="First name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className={inputClass}
            placeholder="Last name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            className={inputClass}
          />
          <p className="text-xs text-neutral-400 mt-1">
            Used to determine invite eligibility
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Relationship <span className="text-red-500">*</span>
          </label>
          <select
            value={form.relationship}
            onChange={(e) => setForm({ ...form, relationship: e.target.value })}
            className={inputClass}
          >
            <option value="">Select...</option>
            {RELATIONSHIP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 bg-white cursor-pointer">
        <input
          type="checkbox"
          checked={form.hasBleedingDisorder}
          onChange={(e) =>
            setForm({ ...form, hasBleedingDisorder: e.target.checked })
          }
          className="w-4 h-4 mt-0.5 rounded border-neutral-300 text-primary focus:ring-primary"
        />
        <div>
          <p className="text-sm font-medium text-neutral-900">
            Has a bleeding disorder
          </p>
          <p className="text-xs text-neutral-500">
            A diagnosis letter will be requested for verification
          </p>
        </div>
      </label>

      {form.hasBleedingDisorder && (
        <div className="grid grid-cols-2 gap-4 pl-2 border-l-2 border-primary-200">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Condition
            </label>
            <select
              value={form.disorderCondition}
              onChange={(e) =>
                setForm({ ...form, disorderCondition: e.target.value })
              }
              className={inputClass}
            >
              <option value="">Select...</option>
              <option value="Hemophilia_a">Hemophilia A</option>
              <option value="Hemophilia_b">Hemophilia B</option>
              <option value="Von_Willebrand">Von Willebrand Disease</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Severity
            </label>
            <select
              value={form.disorderSeverity}
              onChange={(e) =>
                setForm({ ...form, disorderSeverity: e.target.value })
              }
              className={inputClass}
            >
              <option value="">Select...</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Add Member
        </button>
      </div>
    </div>
  );
}

// ─── MemberCard ───────────────────────────────────────────────────────────────

function MemberCard({
  member,
  isPrimary,
  onInviteSuccess,
  onDetachSuccess,
  onDeleteSuccess,
  confirm,
}: {
  member: FamilyMember;
  isPrimary: boolean;
  onInviteSuccess: () => void;
  onDetachSuccess: () => void;
  onDeleteSuccess: () => void;
  confirm: (opts: { title: string; message: string; confirmText: string; variant?: "danger" | "warning" | "info" | "success" }) => Promise<boolean>;
}) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(member.inviteEmail ?? "");
  const [parentalConsent, setParentalConsent] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [requestingDetach, setRequestingDetach] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canInvite =
    !member.patientId &&
    member.ageTier !== "RECORD_ONLY" &&
    member.status !== "PENDING_INVITE";

  const canDetach =
    member.ageTier === "ADULT" &&
    member.status === "ACTIVE" &&
    !member.boardApprovalId &&
    !isPrimary;

  const isPendingDetach =
    member.ageTier === "ADULT" &&
    member.boardApprovalId !== null &&
    member.status === "ACTIVE";

  const handleSendInvite = async () => {
    if (!inviteEmail) {
      toast.error("Email is required");
      return;
    }
    if (member.ageTier === "YOUTH" && !parentalConsent) {
      toast.error("Parental consent is required for youth members");
      return;
    }
    setSendingInvite(true);
    try {
      const res = await fetch(`/api/portal/family/members/${member.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, parentalConsentGiven: parentalConsent }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Failed to send invite");
        return;
      }
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInviteForm(false);
      onInviteSuccess();
    } catch {
      toast.error("Failed to send invite");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRequestDetach = async () => {
    const confirmed = await confirm({
      title: "Request Detachment?",
      message: `This will submit a board approval request to permanently detach ${member.firstName} ${member.lastName} from your family group. This cannot be undone once approved.`,
      confirmText: "Submit Request",
      variant: "danger",
    });
    if (!confirmed) return;

    setRequestingDetach(true);
    try {
      const res = await fetch(`/api/portal/family/members/${member.id}/detach`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Failed to submit request");
        return;
      }
      toast.success("Detachment request submitted for board approval");
      onDetachSuccess();
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setRequestingDetach(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Remove Member?",
      message: `Remove ${member.firstName} ${member.lastName} from your family group?`,
      confirmText: "Remove",
      variant: "danger",
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/portal/family/members/${member.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Failed to remove member");
        return;
      }
      toast.success("Member removed");
      onDeleteSuccess();
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <p className="font-semibold text-neutral-900">
              {member.firstName} {member.lastName}
            </p>
            {isPrimary && (
              <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary text-xs font-semibold">
                You
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium capitalize">
              {member.relationship}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
              {AGE_TIER_LABEL[member.ageTier]}
            </span>
            {member.status === "PENDING_INVITE" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                <Clock className="w-3 h-3" />
                Invite Sent
              </span>
            )}
          </div>

          {/* Diagnosis status */}
          {member.hasBleedingDisorder && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {member.diagnosisVerified ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  Diagnosis verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                  <AlertCircle className="w-3 h-3" />
                  Diagnosis not yet verified
                </span>
              )}
            </div>
          )}

          {/* Pending detachment */}
          {isPendingDetach && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                Pending board approval for detachment
              </span>
            </div>
          )}

          {/* Linked account */}
          {member.patientId && !isPrimary && (
            <p className="text-xs text-neutral-400 mt-1">Has portal account</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-4 shrink-0">
          {canInvite && (
            <button
              onClick={() => setShowInviteForm((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Invite
            </button>
          )}
          {canDetach && (
            <button
              onClick={handleRequestDetach}
              disabled={requestingDetach}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-orange-300 text-orange-700 text-xs font-semibold hover:bg-orange-50 transition-colors disabled:opacity-50"
            >
              {requestingDetach ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserX className="w-3.5 h-3.5" />
              )}
              Detach
            </button>
          )}
          {!member.patientId && !isPrimary && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Remove member"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Invite form inline */}
      {showInviteForm && (
        <div className="mt-4 pt-4 border-t border-neutral-200 space-y-3">
          <p className="text-sm font-medium text-neutral-700">
            Send invitation to {member.firstName}
          </p>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="their@email.com"
            />
          </div>

          {member.ageTier === "YOUTH" && (
            <label className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <input
                type="checkbox"
                checked={parentalConsent}
                onChange={(e) => setParentalConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Parental / Guardian Consent
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  I confirm I have parental or guardian consent to invite this
                  youth member (13–17) to create a HOEP account.
                </p>
              </div>
            </label>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSendInvite}
              disabled={sendingInvite}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {sendingInvite ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              Send Invite
            </button>
            <button
              onClick={() => setShowInviteForm(false)}
              className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
