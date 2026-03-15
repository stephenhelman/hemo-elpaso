"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Trash2,
  Loader2,
  Search,
  Mail,
  Crown,
  Clock,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";

// -------------------------------------------------------
// Types
// -------------------------------------------------------
interface BoardRoleRecord {
  id: string;
  role: string;
  fromEmail: string | null;
  active: boolean;
  assignedBy: string;
  assignedAt: string;
  patient: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface PatientResult {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface Props {
  boardRoles: BoardRoleRecord[];
  canAssign: boolean;
}

// -------------------------------------------------------
// Role config
// -------------------------------------------------------
const ROLE_LABELS: Record<string, string> = {
  PRESIDENT: "President",
  VICE_PRESIDENT: "Vice President",
  TREASURER: "Treasurer",
  SECRETARY: "Secretary",
  EVENTS_COORDINATOR: "Events Coordinator",
  SPONSOR_LIAISON: "Sponsor Liaison",
  COMMUNICATIONS_LEAD: "Communications Lead",
  YOUTH_COORDINATOR: "Youth Coordinator",
  VOLUNTEER_COORDINATOR: "Volunteer Coordinator",
  FUNDRAISING_COORDINATOR: "Fundraising Coordinator",
  BOARD_MEMBER_AT_LARGE: "Board Member at Large",
};

const EXECUTIVE_ROLES = [
  "PRESIDENT",
  "VICE_PRESIDENT",
  "TREASURER",
  "SECRETARY",
];
const COMMUNITY_ROLES = [
  "EVENTS_COORDINATOR",
  "SPONSOR_LIAISON",
  "COMMUNICATIONS_LEAD",
  "YOUTH_COORDINATOR",
  "VOLUNTEER_COORDINATOR",
  "FUNDRAISING_COORDINATOR",
  "BOARD_MEMBER_AT_LARGE",
];

const ROLE_FROM_EMAILS: Record<string, string> = {
  PRESIDENT: "president@hemo-el-paso.org",
  VICE_PRESIDENT: "vicepresident@hemo-el-paso.org",
  TREASURER: "treasurer@hemo-el-paso.org",
  SECRETARY: "secretary@hemo-el-paso.org",
  EVENTS_COORDINATOR: "events@hemo-el-paso.org",
  SPONSOR_LIAISON: "sponsors@hemo-el-paso.org",
  COMMUNICATIONS_LEAD: "communications@hemo-el-paso.org",
};

// -------------------------------------------------------
// Main component
// -------------------------------------------------------
export default function BoardManagementClient({
  boardRoles,
  canAssign,
}: Props) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [showHistory, setShowHistory] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);

  const activeRoles = boardRoles.filter((r) => r.active);
  const pastRoles = boardRoles.filter((r) => !r.active);

  const executiveRoles = activeRoles.filter((r) =>
    EXECUTIVE_ROLES.includes(r.role),
  );
  const communityRoles = activeRoles.filter((r) =>
    COMMUNITY_ROLES.includes(r.role),
  );

  const handleRemove = async (
    roleId: string,
    roleName: string,
    patientName: string,
  ) => {
    const confirmed = await confirm({
      title: "Remove Board Role?",
      message: `This will remove the ${roleName} role from ${patientName}. The record will be preserved in board history.`,
      confirmText: "Remove",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/settings/board/${roleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`${roleName} role removed`);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove role");
      }
    } catch {
      toast.error("Failed to remove role");
    }
  };

  const getPatientName = (patient: BoardRoleRecord["patient"]) =>
    patient.firstName && patient.lastName
      ? `${patient.firstName} ${patient.lastName}`
      : patient.email;

  return (
    <>
      <ConfirmDialog />

      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              Board Management
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Assign and manage board roles for HOEP members
            </p>
          </div>
          {canAssign && (
            <button
              onClick={() => setShowAssignForm((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Assign Role
            </button>
          )}
        </div>

        {/* Assign role form */}
        {showAssignForm && canAssign && (
          <AssignRoleForm
            onSuccess={() => {
              setShowAssignForm(false);
              router.refresh();
            }}
            onCancel={() => setShowAssignForm(false)}
          />
        )}

        {/* Executive Board */}
        <div>
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            Executive Board
          </h3>

          {executiveRoles.length === 0 ? (
            <div className="p-6 rounded-xl border-2 border-dashed border-neutral-200 text-center">
              <p className="text-sm text-neutral-400">
                No executive board members assigned yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {EXECUTIVE_ROLES.map((role) => {
                const record = executiveRoles.find((r) => r.role === role);
                return (
                  <BoardRoleCard
                    key={role}
                    roleKey={role}
                    record={record ?? null}
                    canAssign={canAssign}
                    onRemove={handleRemove}
                    getPatientName={getPatientName}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Community at Large */}
        {communityRoles.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-500" />
              Community at Large
            </h3>
            <div className="space-y-3">
              {communityRoles.map((record) => (
                <BoardRoleCard
                  key={record.id}
                  roleKey={record.role}
                  record={record}
                  canAssign={canAssign}
                  onRemove={handleRemove}
                  getPatientName={getPatientName}
                />
              ))}
            </div>
          </div>
        )}

        {/* Board history */}
        {pastRoles.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <Clock className="w-4 h-4" />
              Board History ({pastRoles.length} past role
              {pastRoles.length !== 1 ? "s" : ""})
              {showHistory ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showHistory && (
              <div className="mt-4 space-y-2">
                {pastRoles.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 border border-neutral-200 opacity-70"
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-700">
                        {getPatientName(record.patient)}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {ROLE_LABELS[record.role] ?? record.role}
                      </p>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Until{" "}
                      {new Date(record.assignedAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// -------------------------------------------------------
// BoardRoleCard
// -------------------------------------------------------
function BoardRoleCard({
  roleKey,
  record,
  canAssign,
  onRemove,
  getPatientName,
}: {
  roleKey: string;
  record: BoardRoleRecord | null;
  canAssign: boolean;
  onRemove: (id: string, role: string, name: string) => void;
  getPatientName: (p: BoardRoleRecord["patient"]) => string;
}) {
  const router = useRouter();
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState(record?.fromEmail ?? "");
  const [savingEmail, setSavingEmail] = useState(false);

  const handleSaveEmail = async () => {
    if (!record) return;
    setSavingEmail(true);
    try {
      const res = await fetch(`/api/admin/settings/board/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromEmail: emailValue }),
      });
      if (res.ok) {
        toast.success("Email updated");
        setEditingEmail(false);
        router.refresh();
      } else {
        toast.error("Failed to update email");
      }
    } catch {
      toast.error("Failed to update email");
    } finally {
      setSavingEmail(false);
    }
  };

  const label = ROLE_LABELS[roleKey] ?? roleKey;
  const suggestedEmail = ROLE_FROM_EMAILS[roleKey];

  if (!record) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-neutral-200">
        <div>
          <p className="font-semibold text-neutral-400">{label}</p>
          <p className="text-xs text-neutral-300">Unassigned</p>
        </div>
        {canAssign && (
          <span className="text-xs text-neutral-400 italic">
            Use "Assign Role" above
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <p className="font-semibold text-neutral-900">
              {getPatientName(record.patient)}
            </p>
            <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary text-xs font-semibold">
              {label}
            </span>
          </div>
          <p className="text-sm text-neutral-500">{record.patient.email}</p>

          {/* From email */}
          <div className="mt-3 flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            {editingEmail ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder={suggestedEmail ?? `role@hemo-el-paso.org`}
                  className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleSaveEmail}
                  disabled={savingEmail}
                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                >
                  {savingEmail ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditingEmail(false);
                    setEmailValue(record.fromEmail ?? "");
                  }}
                  className="p-1 text-neutral-400 hover:bg-neutral-100 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">
                  {record.fromEmail ?? (
                    <span className="italic text-neutral-400">
                      No send-as email set
                      {suggestedEmail && ` (suggested: ${suggestedEmail})`}
                    </span>
                  )}
                </span>
                {canAssign && (
                  <button
                    onClick={() => {
                      setEmailValue(record.fromEmail ?? suggestedEmail ?? "");
                      setEditingEmail(true);
                    }}
                    className="p-1 text-neutral-400 hover:text-neutral-600 rounded transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-neutral-400 mt-2">
            Assigned{" "}
            {new Date(record.assignedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}{" "}
            by {record.assignedBy}
          </p>
        </div>

        {canAssign && (
          <button
            onClick={() =>
              onRemove(record.id, label, getPatientName(record.patient))
            }
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4 shrink-0"
            title="Remove role"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// AssignRoleForm
// -------------------------------------------------------
function AssignRoleForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(
    null,
  );
  const [selectedRole, setSelectedRole] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const allRoles = [...EXECUTIVE_ROLES, ...COMMUNITY_ROLES];

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/admin/settings/board/search?q=${encodeURIComponent(q)}`,
      );
      const data = await res.json();
      setResults(data.patients ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setFromEmail(ROLE_FROM_EMAILS[role] ?? "");
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !selectedRole) {
      toast.error("Please select a patient and a role");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          role: selectedRole,
          fromEmail: fromEmail || null,
        }),
      });
      if (res.ok) {
        toast.success(
          `${ROLE_LABELS[selectedRole]} role assigned to ${selectedPatient.firstName ?? selectedPatient.email}`,
        );
        onSuccess();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to assign role");
      }
    } catch {
      toast.error("Failed to assign role");
    } finally {
      setSaving(false);
    }
  };

  const patientDisplayName = (p: PatientResult) =>
    p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.email;

  return (
    <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-6">
      <h3 className="font-semibold text-neutral-900 mb-5">Assign Board Role</h3>

      <div className="space-y-5">
        {/* Patient search */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Search Member <span className="text-red-500">*</span>
          </label>
          {selectedPatient ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-primary">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {patientDisplayName(selectedPatient)}
                </p>
                <p className="text-xs text-neutral-500">
                  {selectedPatient.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setQuery("");
                  setResults([]);
                }}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-9 pr-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 animate-spin" />
                )}
              </div>

              {results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPatient(p);
                        setResults([]);
                        setQuery("");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {(p.firstName ?? p.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          {patientDisplayName(p)}
                        </p>
                        <p className="text-xs text-neutral-500">{p.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query.length >= 2 && results.length === 0 && !searching && (
                <p className="text-xs text-neutral-400 mt-2">
                  No registered members found for "{query}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Role select */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select a role...</option>
            <optgroup label="Executive Board">
              {EXECUTIVE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Community at Large">
              {COMMUNITY_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* From email */}
        {selectedRole && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Send-As Email
              <span className="text-neutral-400 font-normal ml-1">
                (optional)
              </span>
            </label>
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder={
                ROLE_FROM_EMAILS[selectedRole] ?? "role@hemo-el-paso.org"
              }
              className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-neutral-400 mt-1">
              When this board member sends emails through the portal, they'll
              appear to come from this address via Resend.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !selectedPatient || !selectedRole}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Assign Role
          </button>
        </div>
      </div>
    </div>
  );
}
