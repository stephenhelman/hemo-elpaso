"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Loader2, Plus, Trash2, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";
import DiagnosisUploadSection from "./register/DiagnosisUploadSection";
import {
  profileFormTranslation,
  portalProfilePageTranslation,
} from "@/translation/portalPages";
import { Lang } from "@/types";

interface Patient {
  id: string;
  email: string;
  diagnosisGracePeriodEndsAt: Date | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;

  // Contact Profile (always exists after registration)
  contactProfile: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    dateOfBirth: Date | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
  } | null;

  // Disorder Profile (only if patient has condition)
  disorderProfile: {
    id: string;
    condition: string;
    severity: string;
    dateOfDiagnosis: Date | null;
    treatingPhysician: string | null;
    specialtyPharmacy: string | null;
    diagnosisLetterUrl: string | null;
    diagnosisLetterKey: string | null;
    diagnosisLetterUploadedAt: Date | null;
    diagnosisVerified: boolean;
    diagnosisVerifiedBy: string | null;
    diagnosisVerifiedAt: Date | null;
    diagnosisRejectedReason: string | null;
  } | null;

  familyMembers: FamilyMember[];
}

interface FamilyMember {
  id: string;
  relationship: string;
  hasBleedingDisorder: boolean;
  migrationEligibleAt: Date | null;

  contactProfile: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date | null;
  } | null;

  disorderProfile: {
    id: string;
    condition: string;
    severity: string;
    dateOfDiagnosis: Date | null;
    treatingPhysician: string | null;
    specialtyPharmacy: string | null;
    diagnosisLetterUrl: string | null;
    diagnosisLetterKey: string | null;
    diagnosisLetterUploadedAt: Date | null;
    diagnosisVerified: boolean;
    diagnosisVerifiedBy: string | null;
    diagnosisVerifiedAt: Date | null;
    diagnosisRejectedReason: string | null;
  } | null;
}

interface Props {
  patient: Patient;
  initialTab?: "personal" | "medical" | "family" | "verification";
  locale: Lang;
}

export default function ProfileEditForm({
  patient,
  initialTab = "personal",
  locale,
}: Props) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const f = profileFormTranslation[locale];
  const t = portalProfilePageTranslation[locale];
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "personal" | "medical" | "family" | "verification"
  >(initialTab);

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
    diagnosisDate: "",
    treatingPhysician: "",
    specialtyPharmacy: "",
  });

  const [formData, setFormData] = useState({
    // Contact Profile fields
    firstName: patient.contactProfile?.firstName || "",
    lastName: patient.contactProfile?.lastName || "",
    phone: patient.contactProfile?.phone || "",
    dateOfBirth: patient.contactProfile?.dateOfBirth
      ? new Date(patient.contactProfile.dateOfBirth).toISOString().split("T")[0]
      : "",
    addressLine1: patient.contactProfile?.addressLine1 || "",
    addressLine2: patient.contactProfile?.addressLine2 || "",
    city: patient.contactProfile?.city || "",
    state: patient.contactProfile?.state || "",
    zipCode: patient.contactProfile?.zipCode || "",

    // Disorder Profile fields (may be null)
    primaryCondition: patient.disorderProfile?.condition || "",
    severity: patient.disorderProfile?.severity || "",
    dateOfDiagnosis: patient.disorderProfile?.dateOfDiagnosis
      ? new Date(patient.disorderProfile.dateOfDiagnosis)
          .toISOString()
          .split("T")[0]
      : "",
    treatingPhysician: patient.disorderProfile?.treatingPhysician || "",
    specialtyPharmacy: patient.disorderProfile?.specialtyPharmacy || "",

    // Emergency Contact (on Patient)
    emergencyContactName: patient.emergencyContactName || "",
    emergencyContactPhone: patient.emergencyContactPhone || "",
    emergencyContactRelationship: patient.emergencyContactRelationship || "",

    preferredLanguage: locale,
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
        toast.success(f.saved);
      } else {
        const data = await response.json();
        toast.error(data.error || f.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : f.error);
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
      diagnosisDate: "",
      treatingPhysician: "",
      specialtyPharmacy: "",
    });
    setShowAddMember(true);
  };

  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member.id);
    setFamilyMemberForm({
      firstName: member.contactProfile?.firstName || "",
      lastName: member.contactProfile?.lastName || "",
      dateOfBirth: member.contactProfile?.dateOfBirth
        ? new Date(member.contactProfile.dateOfBirth)
            .toISOString()
            .split("T")[0]
        : "",
      relationship: member.relationship,
      hasBleedingDisorder: member.hasBleedingDisorder,
      condition: member.disorderProfile?.condition || "",
      severity: member.disorderProfile?.severity || "",
      diagnosisDate: member.disorderProfile?.dateOfDiagnosis
        ? new Date(member.disorderProfile.dateOfDiagnosis)
            .toISOString()
            .split("T")[0]
        : "",
      treatingPhysician: member.disorderProfile?.treatingPhysician || "",
      specialtyPharmacy: member.disorderProfile?.specialtyPharmacy || "",
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
        toast.success(
          editingMember ? "Family member updated" : "Family member added",
        );
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
          diagnosisDate: "",
          treatingPhysician: "",
          specialtyPharmacy: "",
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
        toast.success("Family member removed");
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
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
          {t.heading}
        </h1>
        <p className="text-neutral-500">{t.subtitle}</p>
      </div>
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
              {f.tabPersonal}
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
              {f.tabMedical}
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
              {f.tabFamily} ({patient.familyMembers.length})
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
              {f.tabVerification}
            </button>
          </div>

          {/* Personal Info Tab */}
          {activeTab === "personal" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {f.firstName}
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
                    {f.lastName}
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
                    {f.phone}
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
                    {f.dateOfBirth}
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
                  {f.address1}
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
                  {f.address2}
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
                    {f.city}
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
                    {f.state}
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
                    {f.zip}
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

              {/* Language Preference */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {f.languagePreference}
                </label>
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferredLanguage: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="en">{f.english}</option>
                  <option value="es">{f.spanish}</option>
                </select>
              </div>
            </div>
          )}

          {/* Medical Info Tab */}
          {activeTab === "medical" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {f.primaryCondition}
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
                    <option value="">{f.selectCondition}</option>
                    <option value="Hemophilia_a">{f.hemophiliaA}</option>
                    <option value="Hemophilia_b">{f.hemophiliaB}</option>
                    <option value="Von_Willebrand">{f.vonWillebrand}</option>
                    <option value="other">{f.other}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {f.severity}
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({ ...formData, severity: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{f.selectSeverity}</option>
                    <option value="mild">{f.mild}</option>
                    <option value="moderate">{f.moderate}</option>
                    <option value="severe">{f.severe}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {f.diagnosisDate}
                </label>
                <input
                  type="date"
                  value={formData.dateOfDiagnosis}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dateOfDiagnosis: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Treating Physician
                  </label>
                  <input
                    type="text"
                    value={formData.treatingPhysician}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        treatingPhysician: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Dr. Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Specialty Pharmacy
                  </label>
                  <input
                    type="text"
                    value={formData.specialtyPharmacy}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialtyPharmacy: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Pharmacy name"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-200">
                <h3 className="font-semibold text-neutral-900 mb-4">
                  {f.emergencyContact}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {f.contactName}
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
                      Relationship
                    </label>
                    <select
                      value={formData.emergencyContactRelationship}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContactRelationship: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select...</option>
                      <option value="spouse">Spouse</option>
                      <option value="parent">Parent</option>
                      <option value="child">Child</option>
                      <option value="sibling">Sibling</option>
                      <option value="friend">Friend</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {f.contactPhone}
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
                  {f.addFamilyMember}
                </button>
              )}

              {/* Add/Edit Member Form */}
              {showAddMember && (
                <div className="p-6 border-2 border-primary-200 rounded-xl bg-primary-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-neutral-900">
                      {editingMember ? f.editFamilyMember : f.addFamilyMember}
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
                          {f.firstName}
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
                          {f.lastName}
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
                          {f.dateOfBirth}
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
                          <option value="son">Son</option>
                          <option value="daughter">Daughter</option>
                          <option value="parent">Parent</option>
                          <option value="sibling">Sibling</option>
                          <option value="other">{f.other}</option>
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
                            ...(e.target.checked
                              ? {
                                  treatingPhysician:
                                    familyMemberForm.treatingPhysician ||
                                    formData.treatingPhysician,
                                  specialtyPharmacy:
                                    familyMemberForm.specialtyPharmacy ||
                                    formData.specialtyPharmacy,
                                }
                              : {
                                  condition: "",
                                  severity: "",
                                  diagnosisDate: "",
                                  treatingPhysician: "",
                                  specialtyPharmacy: "",
                                }),
                          })
                        }
                        className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary mt-0.5"
                      />
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">
                          {f.hasBleedingDisorder}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {f.hasBleedingDisorderDesc}
                        </p>
                      </div>
                    </label>

                    {/* Conditional Diagnosis Fields */}
                    {familyMemberForm.hasBleedingDisorder && (
                      <div className="space-y-4 pt-2 border-t border-neutral-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              {f.conditionLabel}
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
                              <option value="">{f.selectCondition}</option>
                              <option value="Hemophilia_a">
                                {f.hemophiliaA}
                              </option>
                              <option value="Hemophilia_b">
                                {f.hemophiliaB}
                              </option>
                              <option value="Von_Willebrand">
                                {f.vonWillebrand}
                              </option>
                              <option value="other">{f.other}</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              {f.severityLabel}
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
                              <option value="">{f.selectSeverity}</option>
                              <option value="mild">{f.mild}</option>
                              <option value="moderate">{f.moderate}</option>
                              <option value="severe">{f.severe}</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Date of Diagnosis
                          </label>
                          <input
                            type="date"
                            value={familyMemberForm.diagnosisDate}
                            onChange={(e) =>
                              setFamilyMemberForm({
                                ...familyMemberForm,
                                diagnosisDate: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              Treating Physician
                            </label>
                            <input
                              type="text"
                              value={familyMemberForm.treatingPhysician}
                              onChange={(e) =>
                                setFamilyMemberForm({
                                  ...familyMemberForm,
                                  treatingPhysician: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                              placeholder={
                                formData.treatingPhysician || "Dr. Smith"
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                              Specialty Pharmacy
                            </label>
                            <input
                              type="text"
                              value={familyMemberForm.specialtyPharmacy}
                              onChange={(e) =>
                                setFamilyMemberForm({
                                  ...familyMemberForm,
                                  specialtyPharmacy: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                              placeholder={
                                formData.specialtyPharmacy || "Pharmacy name"
                              }
                            />
                          </div>
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
                        {f.cancelButton}
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
                        {loading ? f.saving : f.saveMember}
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
                            {member.contactProfile?.firstName}{" "}
                            {member.contactProfile?.lastName}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {member.relationship.charAt(0).toUpperCase() +
                              member.relationship.slice(1)}
                            {member.contactProfile?.dateOfBirth &&
                              ` • Born ${new Date(member.contactProfile.dateOfBirth).toLocaleDateString()}`}
                            {member.hasBleedingDisorder &&
                              ` • ${f.hasBleedingDisorder}`}
                          </p>
                          {member.hasBleedingDisorder &&
                            member.disorderProfile?.condition && (
                              <p className="text-xs text-neutral-400 mt-1">
                                {member.disorderProfile.condition.replace(
                                  "_",
                                  " ",
                                )}{" "}
                                {member.disorderProfile.severity &&
                                  `(${member.disorderProfile.severity})`}
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
                  {f.noFamilyMembers}
                </div>
              )}
            </div>
          )}

          {/* Verification Tab */}
          {activeTab === "verification" && (
            <div className="space-y-6">
              {/* Patient's Diagnosis Letter */}
              <div>
                <h3 className="font-semibold text-neutral-900 mb-4">
                  {f.diagnosisLetter}
                </h3>

                {patient.disorderProfile ? (
                  <DiagnosisUploadSection
                    patientId={patient.id}
                    currentFileUrl={patient.disorderProfile.diagnosisLetterUrl}
                    diagnosisVerified={
                      patient.disorderProfile.diagnosisVerified
                    }
                    diagnosisVerifiedAt={
                      patient.disorderProfile.diagnosisVerifiedAt
                    }
                    diagnosisRejectedReason={
                      patient.disorderProfile.diagnosisRejectedReason
                    }
                    gracePeriodEndsAt={patient.diagnosisGracePeriodEndsAt}
                  />
                ) : (
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-600">
                    {f.noConditionOnFile}
                  </div>
                )}
              </div>

              {/* Family Members with Bleeding Disorders */}
              {patient.familyMembers.filter((m) => m.hasBleedingDisorder)
                .length > 0 && (
                <div className="pt-6 border-t border-neutral-200">
                  <h3 className="font-semibold text-neutral-900 mb-4">
                    {f.familyDiagnosisLetters}
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
                            {member.contactProfile?.firstName}{" "}
                            {member.contactProfile?.lastName}
                          </p>

                          {member.disorderProfile ? (
                            <DiagnosisUploadSection
                              patientId={patient.id}
                              familyMemberId={member.id}
                              currentFileUrl={
                                member.disorderProfile.diagnosisLetterUrl
                              }
                              diagnosisVerified={
                                member.disorderProfile.diagnosisVerified
                              }
                              diagnosisVerifiedAt={
                                member.disorderProfile.diagnosisVerifiedAt
                              }
                              diagnosisRejectedReason={
                                member.disorderProfile.diagnosisRejectedReason
                              }
                            />
                          ) : (
                            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-sm text-neutral-600">
                              No disorder profile on file
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save Button - Only show for Personal and Medical tabs */}
        {activeTab !== "family" && activeTab !== "verification" && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {f.saving}
                </>
              ) : (
                f.saveChanges
              )}
            </button>
          </div>
        )}
        <ConfirmDialog />
      </form>
    </>
  );
}
