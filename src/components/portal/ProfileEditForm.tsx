"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Loader2, Plus, Trash2, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";
import DiagnosisUploadSection from "./register/DiagnosisUploadSection";

interface Patient {
  id: string;
  email: string;
  diagnosisLetterUrl: string | null;
  diagnosisLetterKey: string | null;
  diagnosisLetterUploadedAt: Date | null;
  diagnosisVerified: boolean;
  diagnosisVerifiedBy: string | null;
  diagnosisVerifiedAt: Date | null;
  diagnosisRejectedReason: string | null;
  registrationCompletedAt: Date | null;
  diagnosisGracePeriodEndsAt: Date | null;

  profile: {
    firstName: string;
    lastName: string;
    phone: string | null;
    dateOfBirth: Date | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    primaryCondition: string | null;
    severity: string | null;
    dateOfDiagnosis: Date | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
  } | null;

  familyMembers: FamilyMember[];
}

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  relationship: string;
  hasBleedingDisorder: boolean;
  condition: string;
  severity: string;
  diagnosisLetterUrl: string | null;
  diagnosisLetterKey: string | null;
  diagnosisLetterUploadedAt: Date | null;
  diagnosisVerified: boolean;
  diagnosisVerifiedBy: string | null;
  diagnosisVerifiedAt: Date | null;
  diagnosisRejectedReason: string | null;
}

interface Props {
  patient: Patient;
}

export default function ProfileEditForm({ patient }: Props) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "personal" | "medical" | "family" | "verification"
  >("personal");

  // Family member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [familyMemberForm, setFamilyMemberForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    relationship: "",
    hasBleedingDisorder: false,
    condition: "",
    severity: "",
  });

  const [formData, setFormData] = useState({
    firstName: patient.profile?.firstName || "",
    lastName: patient.profile?.lastName || "",
    phone: patient.profile?.phone || "",
    dateOfBirth: patient.profile?.dateOfBirth
      ? new Date(patient.profile.dateOfBirth).toISOString().split("T")[0]
      : "",
    addressLine1: patient.profile?.addressLine1 || "",
    addressLine2: patient.profile?.addressLine2 || "",
    city: patient.profile?.city || "",
    state: patient.profile?.state || "",
    zipCode: patient.profile?.zipCode || "",
    primaryCondition: patient.profile?.primaryCondition || "",
    severity: patient.profile?.severity || "",
    dateOfDiagnosis: patient.profile?.dateOfDiagnosis
      ? new Date(patient.profile.dateOfDiagnosis).toISOString().split("T")[0]
      : "",
    emergencyContactName: patient.profile?.emergencyContactName || "",
    emergencyContactPhone: patient.profile?.emergencyContactPhone || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/patient/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.refresh();
        toast.success("Profile updated successfully!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setFamilyMemberForm({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      relationship: "",
      hasBleedingDisorder: false,
      condition: "",
      severity: "",
    });
    setShowAddMember(true);
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member.id);
    setFamilyMemberForm({
      firstName: member.firstName,
      lastName: member.lastName,
      dateOfBirth: member.dateOfBirth
        ? new Date(member.dateOfBirth).toISOString().split("T")[0]
        : "",
      relationship: member.relationship,
      hasBleedingDisorder: member.hasBleedingDisorder || false,
      condition: member.condition || "",
      severity: member.severity || "",
    });
    setShowAddMember(true);
  };

  const handleSaveMember = async () => {
    setLoading(true);

    try {
      const url = editingMember
        ? `/api/patient/family-members/${editingMember}`
        : "/api/patient/family-members";

      const method = editingMember ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(familyMemberForm),
      });

      if (response.ok) {
        router.refresh();
        setShowAddMember(false);
        setEditingMember(null);
        setFamilyMemberForm({
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          relationship: "",
          hasBleedingDisorder: false,
          condition: "",
          severity: "",
        });
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save family member");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save family member",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    const confirmed = await confirm({
      title: "Remove Family Member?",
      message:
        "Are you sure you want to remove this family member? This action cannot be undone.",
      confirmText: "Remove",
      variant: "danger",
    });
    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/patient/family-members/${memberId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete family member");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete family member",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-3xl font-bold">
              {formData.firstName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-neutral-900">
              {formData.firstName} {formData.lastName}
            </h2>
            <p className="text-neutral-500">{patient.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-200 mb-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`whitespace-nowrap px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "personal"
                ? "border-primary text-primary"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Personal Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("medical")}
            className={`whitespace-nowrap px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "medical"
                ? "border-primary text-primary"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Medical Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("family")}
            className={`whitespace-nowrap px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "family"
                ? "border-primary text-primary"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Family Members ({patient.familyMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("verification")}
            className={`whitespace-nowrap px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "verification"
                ? "border-primary text-primary"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Verification
          </button>
        </div>

        {/* Personal Info Tab */}
        {activeTab === "personal" && (
          <div className="space-y-6">
            {/* ... keep existing personal info fields ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Address Line 1
              </label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine1: e.target.value })
                }
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine2: e.target.value })
                }
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipCode: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        )}

        {/* Medical Info Tab */}
        {activeTab === "medical" && (
          <div className="space-y-6">
            {/* ... keep existing medical info fields ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Primary Condition
                </label>
                <select
                  value={formData.primaryCondition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryCondition: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select condition</option>
                  <option value="hemophilia_a">Hemophilia A</option>
                  <option value="hemophilia_b">Hemophilia B</option>
                  <option value="von_willebrand">Von Willebrand Disease</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({ ...formData, severity: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select severity</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Date of Diagnosis
              </label>
              <input
                type="date"
                value={formData.dateOfDiagnosis}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfDiagnosis: e.target.value })
                }
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="pt-6 border-t border-neutral-200">
              <h3 className="font-semibold text-neutral-900 mb-4">
                Emergency Contact
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContactName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContactPhone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Family Members Tab */}
        {activeTab === "family" && (
          <div className="space-y-4">
            {/* Add Member Button */}
            {!showAddMember && (
              <button
                type="button"
                onClick={handleAddMember}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Family Member
              </button>
            )}

            {/* Add/Edit Member Form */}
            {showAddMember && (
              <div className="p-6 border-2 border-primary-200 rounded-xl bg-primary-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-neutral-900">
                    {editingMember ? "Edit Family Member" : "Add Family Member"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMember(false);
                      setEditingMember(null);
                    }}
                    className="p-1 text-neutral-600 hover:text-neutral-900"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={familyMemberForm.firstName}
                        onChange={(e) =>
                          setFamilyMemberForm({
                            ...familyMemberForm,
                            firstName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={familyMemberForm.lastName}
                        onChange={(e) =>
                          setFamilyMemberForm({
                            ...familyMemberForm,
                            lastName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={familyMemberForm.dateOfBirth}
                        onChange={(e) =>
                          setFamilyMemberForm({
                            ...familyMemberForm,
                            dateOfBirth: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Relationship *
                      </label>
                      <select
                        value={familyMemberForm.relationship}
                        onChange={(e) =>
                          setFamilyMemberForm({
                            ...familyMemberForm,
                            relationship: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      >
                        <option value="">Select relationship</option>
                        <option value="spouse">Spouse</option>
                        <option value="child">Child</option>
                        <option value="parent">Parent</option>
                        <option value="sibling">Sibling</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Bleeding Disorder Checkbox */}
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 bg-white cursor-pointer hover:border-primary-200 transition-colors">
                    <input
                      type="checkbox"
                      checked={familyMemberForm.hasBleedingDisorder}
                      onChange={(e) =>
                        setFamilyMemberForm({
                          ...familyMemberForm,
                          hasBleedingDisorder: e.target.checked,
                          // Clear condition/severity if unchecked
                          ...(e.target.checked
                            ? {}
                            : { condition: "", severity: "" }),
                        })
                      }
                      className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-neutral-900 text-sm">
                        Has a bleeding disorder
                      </p>
                      <p className="text-xs text-neutral-500">
                        Check if this family member has been diagnosed
                      </p>
                    </div>
                  </label>

                  {/* Conditional Diagnosis Fields */}
                  {familyMemberForm.hasBleedingDisorder && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Condition
                        </label>
                        <select
                          value={familyMemberForm.condition}
                          onChange={(e) =>
                            setFamilyMemberForm({
                              ...familyMemberForm,
                              condition: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        >
                          <option value="">Select condition</option>
                          <option value="hemophilia_a">Hemophilia A</option>
                          <option value="hemophilia_b">Hemophilia B</option>
                          <option value="von_willebrand">
                            Von Willebrand Disease
                          </option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Severity
                        </label>
                        <select
                          value={familyMemberForm.severity}
                          onChange={(e) =>
                            setFamilyMemberForm({
                              ...familyMemberForm,
                              severity: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        >
                          <option value="">Select severity</option>
                          <option value="mild">Mild</option>
                          <option value="moderate">Moderate</option>
                          <option value="severe">Severe</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddMember(false);
                        setEditingMember(null);
                      }}
                      className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMember}
                      disabled={
                        loading ||
                        !familyMemberForm.firstName ||
                        !familyMemberForm.lastName ||
                        !familyMemberForm.relationship
                      }
                      className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Member"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Family Members List */}
            {patient.familyMembers.length > 0 ? (
              <div className="space-y-3">
                {patient.familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 border border-neutral-200 rounded-lg flex items-center justify-between hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {member.relationship.charAt(0).toUpperCase() +
                            member.relationship.slice(1)}
                          {member.dateOfBirth &&
                            ` • Born ${new Date(member.dateOfBirth).toLocaleDateString()}`}
                          {member.hasBleedingDisorder &&
                            ` • Has bleeding disorder`}
                        </p>
                        {member.hasBleedingDisorder && member.condition && (
                          <p className="text-xs text-neutral-400 mt-1">
                            {member.condition.replace("_", " ")}{" "}
                            {member.severity && `(${member.severity})`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditMember(member)}
                        className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member.id)}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                No family members added yet. Click "Add Family Member" to get
                started.
              </div>
            )}
          </div>
        )}
        {activeTab === "verification" && (
          <div className="space-y-6">
            {/* Patient's Diagnosis Letter */}
            <div>
              <h3 className="font-semibold text-neutral-900 mb-4">
                Your Diagnosis Letter
              </h3>

              {patient.profile?.primaryCondition ? (
                <DiagnosisUploadSection
                  patientId={patient.id}
                  currentFileUrl={patient.diagnosisLetterUrl}
                  diagnosisVerified={patient.diagnosisVerified}
                  diagnosisVerifiedAt={patient.diagnosisVerifiedAt}
                  diagnosisRejectedReason={patient.diagnosisRejectedReason}
                  gracePeriodEndsAt={patient.diagnosisGracePeriodEndsAt}
                />
              ) : (
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-600">
                  No bleeding disorder indicated in medical information.
                </div>
              )}
            </div>

            {/* Family Members with Bleeding Disorders */}
            {patient.familyMembers.filter((m) => m.hasBleedingDisorder).length >
              0 && (
              <div className="pt-6 border-t border-neutral-200">
                <h3 className="font-semibold text-neutral-900 mb-4">
                  Family Member Diagnosis Letters
                </h3>

                <div className="space-y-4">
                  {patient.familyMembers
                    .filter((m) => m.hasBleedingDisorder)
                    .map((member) => (
                      <div
                        key={member.id}
                        className="p-4 border border-neutral-200 rounded-lg"
                      >
                        <p className="font-medium text-neutral-900 mb-3">
                          {member.firstName} {member.lastName}
                        </p>

                        <DiagnosisUploadSection
                          patientId={patient.id}
                          familyMemberId={member.id}
                          currentFileUrl={member.diagnosisLetterUrl}
                          diagnosisVerified={member.diagnosisVerified}
                          diagnosisVerifiedAt={member.diagnosisVerifiedAt}
                          diagnosisRejectedReason={
                            member.diagnosisRejectedReason
                          }
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button - Only show for Personal and Medical tabs */}
      {activeTab !== "family" && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      )}
      <ConfirmDialog />
    </form>
  );
}
