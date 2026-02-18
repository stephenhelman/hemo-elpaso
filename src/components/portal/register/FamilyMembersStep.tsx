"use client";

import { useState } from "react";
import { Plus, Trash2, User } from "lucide-react";

interface Props {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function FamilyMembersStep({
  data,
  updateData,
  onNext,
  onBack,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentMember, setCurrentMember] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    relationship: "",
    hasBleedingDisorder: false,
    condition: "",
    severity: "",
  });

  const addMember = () => {
    if (editingIndex !== null) {
      // Update existing member
      const updated = [...data.familyMembers];
      updated[editingIndex] = currentMember;
      updateData({ familyMembers: updated });
      setEditingIndex(null);
    } else {
      // Add new member
      updateData({
        familyMembers: [...data.familyMembers, currentMember],
      });
    }
    resetForm();
  };

  const editMember = (index: number) => {
    setCurrentMember(data.familyMembers[index]);
    setEditingIndex(index);
    setShowForm(true);
  };

  const deleteMember = (index: number) => {
    updateData({
      familyMembers: data.familyMembers.filter(
        (_: any, i: number) => i !== index,
      ),
    });
  };

  const resetForm = () => {
    setCurrentMember({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      relationship: "",
      hasBleedingDisorder: false,
      condition: "",
      severity: "",
    });
    setShowForm(false);
  };

  const canProceed = data.familyMembers.length > 0 || !showForm;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-neutral-900 text-xl mb-1">
          Family Members
        </h2>
        <p className="text-neutral-500 text-sm">
          Add family members who will attend events with you. This helps us plan
          capacity and meals.
        </p>
      </div>

      {/* Existing Members List */}
      {data.familyMembers.length > 0 && (
        <div className="space-y-2">
          {data.familyMembers.map((member: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 bg-neutral-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {member.relationship}
                    {member.hasBleedingDisorder && " • Has bleeding disorder"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => editMember(index)}
                  className="px-3 py-1.5 text-sm text-primary hover:bg-primary-50 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteMember(index)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Form */}
      {showForm ? (
        <div className="border border-neutral-200 rounded-xl p-6 space-y-4 bg-neutral-50">
          <h3 className="font-semibold text-neutral-900">
            {editingIndex !== null ? "Edit Family Member" : "Add Family Member"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First Name" required>
              <input
                type="text"
                required
                value={currentMember.firstName}
                onChange={(e) =>
                  setCurrentMember({
                    ...currentMember,
                    firstName: e.target.value,
                  })
                }
                className={inputClass}
                placeholder="First name"
              />
            </FormField>

            <FormField label="Last Name" required>
              <input
                type="text"
                required
                value={currentMember.lastName}
                onChange={(e) =>
                  setCurrentMember({
                    ...currentMember,
                    lastName: e.target.value,
                  })
                }
                className={inputClass}
                placeholder="Last name"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date of Birth">
              <input
                type="date"
                value={currentMember.dateOfBirth}
                onChange={(e) =>
                  setCurrentMember({
                    ...currentMember,
                    dateOfBirth: e.target.value,
                  })
                }
                className={inputClass}
              />
            </FormField>

            <FormField label="Relationship" required>
              <select
                required
                value={currentMember.relationship}
                onChange={(e) =>
                  setCurrentMember({
                    ...currentMember,
                    relationship: e.target.value,
                  })
                }
                className={inputClass}
              >
                <option value="">Select relationship...</option>
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="spouse">Spouse/Partner</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other Family</option>
              </select>
            </FormField>
          </div>

          {/* Bleeding Disorder Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 bg-white cursor-pointer hover:border-primary-200 transition-colors">
            <input
              type="checkbox"
              checked={currentMember.hasBleedingDisorder}
              onChange={(e) =>
                setCurrentMember({
                  ...currentMember,
                  hasBleedingDisorder: e.target.checked,
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
          {currentMember.hasBleedingDisorder && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <FormField label="Condition">
                <select
                  value={currentMember.condition}
                  onChange={(e) =>
                    setCurrentMember({
                      ...currentMember,
                      condition: e.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Select condition...</option>
                  <option value="hemophilia_a">Hemophilia A</option>
                  <option value="hemophilia_b">Hemophilia B</option>
                  <option value="von_willebrand">Von Willebrand Disease</option>
                  <option value="other">Other</option>
                </select>
              </FormField>

              <FormField label="Severity">
                <select
                  value={currentMember.severity}
                  onChange={(e) =>
                    setCurrentMember({
                      ...currentMember,
                      severity: e.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Select severity...</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </FormField>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={addMember}
              disabled={
                !currentMember.firstName ||
                !currentMember.lastName ||
                !currentMember.relationship
              }
              className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingIndex !== null ? "Update Member" : "Add Member"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-500 hover:border-primary hover:text-primary hover:bg-primary-50/50 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Family Member
        </button>
      )}

      {/* Skip Option */}
      {data.familyMembers.length === 0 && !showForm && (
        <p className="text-center text-sm text-neutral-400">
          You can skip this step and add family members later from your profile.
        </p>
      )}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-full border-2 border-neutral-300 text-neutral-700 font-semibold hover:border-neutral-400 transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = `
  w-full px-4 py-2 rounded-xl border border-neutral-200
  text-neutral-900 text-sm sm:text-base placeholder:text-neutral-400
  focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
  transition-colors
`.trim();
