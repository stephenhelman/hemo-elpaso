"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  User,
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import FilterBar from "@/components/ui/FilterBar";
import ExportButton from "@/components/ui/ExportButton";

interface Patient {
  id: string;
  email: string;
  diagnosisGracePeriodEndsAt: Date | null;
  contactProfile: {
    firstName: string;
    lastName: string;
  } | null;
  disorderProfile: {
    condition: string | null;
    diagnosisLetterUrl: string | null;
    diagnosisLetterUploadedAt: Date | null;
  } | null;
}

interface FamilyMember {
  id: string;
  relationship: string;
  contactProfile: {
    firstName: string;
    lastName: string;
  } | null;
  disorderProfile: {
    diagnosisLetterUrl: string | null;
    diagnosisLetterUploadedAt: Date | null;
  } | null;
  patient: {
    id: string;
    email: string;
    contactProfile: {
      firstName: string;
      lastName: string;
    } | null;
  };
}

interface Props {
  patients: Patient[];
  familyMembers: FamilyMember[];
  adminEmail: string;
  children: React.ReactNode;
}

export default function DiagnosisVerificationList({
  patients,
  familyMembers,
  adminEmail,
  children,
}: Props) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [action, setAction] = useState<{
    id: string;
    type: "patient" | "family";
    action: "approve" | "deny";
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "patient" | "family">(
    "all",
  );

  const filteredPatients = useMemo(() => {
    if (typeFilter === "family") return [];
    if (!searchQuery) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter((p) => {
      const name =
        `${p.contactProfile?.firstName ?? ""} ${p.contactProfile?.lastName ?? ""}`.toLowerCase();
      return name.includes(q) || p.email.toLowerCase().includes(q);
    });
  }, [patients, searchQuery, typeFilter]);

  const filteredFamilyMembers = useMemo(() => {
    if (typeFilter === "patient") return [];
    if (!searchQuery) return familyMembers;
    const q = searchQuery.toLowerCase();
    return familyMembers.filter((m) => {
      const name = `${m.contactProfile?.firstName ?? ""} ${m.contactProfile?.lastName ?? ""}`.toLowerCase();
      return name.includes(q) || m.patient.email.toLowerCase().includes(q);
    });
  }, [familyMembers, searchQuery, typeFilter]);

  const totalFiltered = filteredPatients.length + filteredFamilyMembers.length;
  const totalAll = patients.length + familyMembers.length;

  const exportRows = [
    ...filteredPatients.map((p) => [
      `${p.contactProfile?.firstName ?? ""} ${p.contactProfile?.lastName ?? ""}`.trim(),
      "Patient",
      "",
      "",
      p.email,
      p.disorderProfile?.condition ?? "N/A",
      p.disorderProfile?.diagnosisLetterUploadedAt
        ? new Date(p.disorderProfile.diagnosisLetterUploadedAt).toLocaleDateString()
        : "Unknown",
      p.diagnosisGracePeriodEndsAt
        ? new Date(p.diagnosisGracePeriodEndsAt).toLocaleDateString()
        : "N/A",
    ]),
    ...filteredFamilyMembers.map((m) => [
      `${m.contactProfile?.firstName ?? ""} ${m.contactProfile?.lastName ?? ""}`.trim(),
      "Family Member",
      m.relationship,
      `${m.patient.contactProfile?.firstName ?? ""} ${m.patient.contactProfile?.lastName ?? ""}`.trim(),
      m.patient.email,
      "N/A",
      m.disorderProfile?.diagnosisLetterUploadedAt
        ? new Date(m.disorderProfile.diagnosisLetterUploadedAt).toLocaleDateString()
        : "Unknown",
      "N/A",
    ]),
  ];

  const handleAction = async (
    id: string,
    type: "patient" | "family",
    actionType: "approve" | "deny",
  ) => {
    if (actionType === "deny" && !rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessing(id);

    try {
      const endpoint =
        type === "patient"
          ? `/api/admin/verification/patient/${id}`
          : `/api/admin/verification/family/${id}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          rejectedReason: actionType === "deny" ? rejectReason : undefined,
          verifiedBy: adminEmail,
        }),
      });

      if (response.ok) {
        toast.success(
          actionType === "approve"
            ? "Diagnosis verified!"
            : "Diagnosis rejected",
        );
        setAction(null);
        setRejectReason("");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update verification");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Card */}
      <FilterBar
        exportButton={
          <ExportButton
            headers={[
              "Name",
              "Type",
              "Relationship",
              "Parent Patient",
              "Email",
              "Condition",
              "Upload Date",
              "Grace Period End",
            ]}
            rows={exportRows}
            filename={`diagnosis-verification-${new Date().toISOString().split("T")[0]}.csv`}
          />
        }
        stats={
          <>
            Showing <span className="font-semibold">{totalFiltered}</span> of{" "}
            <span className="font-semibold">{totalAll}</span> pending
            verifications
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "all" | "patient" | "family")
            }
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary whitespace-nowrap"
          >
            <option value="all">All Types</option>
            <option value="patient">Patient</option>
            <option value="family">Family Member</option>
          </select>
        </div>
      </FilterBar>
      {children}
      {/* Patients */}
      {filteredPatients.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">
              Patient Diagnosis Letters
            </h2>
          </div>

          <div className="divide-y divide-neutral-200">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="p-6 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900">
                        {patient.contactProfile?.firstName} {patient.contactProfile?.lastName}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {patient.email}
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">
                        Uploaded:{" "}
                        {patient.disorderProfile?.diagnosisLetterUploadedAt
                          ? new Date(
                              patient.disorderProfile.diagnosisLetterUploadedAt,
                            ).toLocaleDateString()
                          : "Unknown"}
                      </p>

                      {patient.diagnosisGracePeriodEndsAt && (
                        <p className="text-xs text-amber-600 mt-1">
                          Grace period ends:{" "}
                          {new Date(
                            patient.diagnosisGracePeriodEndsAt,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={patient.disorderProfile?.diagnosisLetterUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Document"
                    >
                      <Download className="w-5 h-5" />
                    </a>

                    {action?.id === patient.id &&
                    action?.type === "patient" &&
                    action?.action === "deny" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection"
                          className="px-3 py-1 border border-neutral-300 rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() =>
                            handleAction(patient.id, "patient", "deny")
                          }
                          disabled={processing === patient.id}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {processing === patient.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Confirm"
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setAction(null);
                            setRejectReason("");
                          }}
                          className="px-3 py-1 border border-neutral-300 text-sm rounded hover:bg-neutral-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            handleAction(patient.id, "patient", "approve")
                          }
                          disabled={processing === patient.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            setAction({
                              id: patient.id,
                              type: "patient",
                              action: "deny",
                            })
                          }
                          disabled={processing === patient.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Family Members */}
      {filteredFamilyMembers.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">
              Family Member Diagnosis Letters
            </h2>
          </div>

          <div className="divide-y divide-neutral-200">
            {filteredFamilyMembers.map((member) => (
              <div
                key={member.id}
                className="p-6 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900">
                        {member.contactProfile?.firstName} {member.contactProfile?.lastName}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {member.relationship} of{" "}
                        {member.patient.contactProfile?.firstName}{" "}
                        {member.patient.contactProfile?.lastName}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {member.patient.email}
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">
                        Uploaded:{" "}
                        {member.disorderProfile?.diagnosisLetterUploadedAt
                          ? new Date(
                              member.disorderProfile.diagnosisLetterUploadedAt,
                            ).toLocaleDateString()
                          : "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={member.disorderProfile?.diagnosisLetterUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Document"
                    >
                      <Download className="w-5 h-5" />
                    </a>

                    {action?.id === member.id &&
                    action?.type === "family" &&
                    action?.action === "deny" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection"
                          className="px-3 py-1 border border-neutral-300 rounded text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() =>
                            handleAction(member.id, "family", "deny")
                          }
                          disabled={processing === member.id}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {processing === member.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Confirm"
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setAction(null);
                            setRejectReason("");
                          }}
                          className="px-3 py-1 border border-neutral-300 text-sm rounded hover:bg-neutral-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            handleAction(member.id, "family", "approve")
                          }
                          disabled={processing === member.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            setAction({
                              id: member.id,
                              type: "family",
                              action: "deny",
                            })
                          }
                          disabled={processing === member.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredPatients.length === 0 && filteredFamilyMembers.length === 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            {totalAll === 0 ? "No Pending Verifications" : "No Results Found"}
          </h3>
          <p className="text-neutral-600">
            {totalAll === 0
              ? "All diagnosis letters have been reviewed"
              : "Try adjusting your search or filter"}
          </p>
        </div>
      )}
    </div>
  );
}
