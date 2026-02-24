"use client";

import { useState } from "react";
import { Upload, File, X, AlertCircle } from "lucide-react";

interface Props {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function DiagnosisStep({
  data,
  updateData,
  onNext,
  onBack,
}: Props) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [canSkip, setCanSkip] = useState(false);

  // Check if patient has selected a condition
  const hasCondition =
    data.primaryCondition &&
    data.primaryCondition !== "" &&
    data.primaryCondition !== "none";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF or image file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large (max 10MB)");
      return;
    }

    setUploadedFile(file);
    updateData({ diagnosisLetterFile: file });
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    updateData({ diagnosisLetterFile: null });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Only warn about diagnosis letter if patient HAS a condition
    if (hasCondition && !uploadedFile && !canSkip) {
      const confirmed = confirm(
        "You haven't uploaded your diagnosis letter. You will have 60 days to upload it, " +
          "but you won't be able to RSVP for events or apply for financial assistance until it's verified.\n\n" +
          "Continue without uploading?",
      );
      if (!confirmed) return;
      setCanSkip(true);
    }

    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-neutral-900 text-xl mb-1">
          Diagnosis Information
        </h2>
        <p className="text-neutral-500 text-sm">
          Help us understand if you or your family members have a bleeding
          disorder.
        </p>
      </div>

      <FormField label="Do you have a bleeding disorder?" required>
        <select
          required
          value={data.primaryCondition || ""}
          onChange={(e) => {
            const value = e.target.value;
            updateData({
              primaryCondition: value === "none" ? "" : value,
              // Clear other fields if selecting "none"
              ...(value === "none" && {
                severity: "",
                diagnosisDate: "",
                treatingPhysician: "",
                specialtyPharmacy: "",
                diagnosisLetterFile: null,
              }),
            });
            if (value === "none") {
              setUploadedFile(null);
            }
          }}
          className={inputClass}
        >
          <option value="">Select...</option>
          <option value="none">No, I do not have a bleeding disorder</option>
          <option value="Hemophilia_a">Yes - Hemophilia A</option>
          <option value="Hemophilia_b">Yes - Hemophilia B</option>
          <option value="Von_Willebrand">Yes - Von Willebrand Disease</option>
          <option value="other">Yes - Other Bleeding Disorder</option>
        </select>
      </FormField>

      {/* Only show rest of form if they have a condition */}
      {hasCondition && (
        <>
          <FormField label="Severity" required>
            <select
              required
              value={data.severity}
              onChange={(e) => updateData({ severity: e.target.value })}
              className={inputClass}
            >
              <option value="">Select severity...</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </FormField>

          <FormField label="Date of Diagnosis" required>
            <input
              type="date"
              required
              value={data.diagnosisDate}
              onChange={(e) => updateData({ diagnosisDate: e.target.value })}
              className={inputClass}
            />
          </FormField>

          <FormField label="Treating Physician">
            <input
              type="text"
              value={data.treatingPhysician}
              onChange={(e) =>
                updateData({ treatingPhysician: e.target.value })
              }
              className={inputClass}
              placeholder="Dr. Smith"
            />
          </FormField>

          <FormField label="Specialty Pharmacy">
            <input
              type="text"
              value={data.specialtyPharmacy}
              onChange={(e) =>
                updateData({ specialtyPharmacy: e.target.value })
              }
              className={inputClass}
              placeholder="Pharmacy name"
            />
          </FormField>

          {/* DIAGNOSIS LETTER UPLOAD */}
          <div className="pt-4 border-t border-neutral-200">
            <FormField label="Diagnosis Letter">
              <p className="text-xs text-neutral-600 mb-3">
                Please upload your official diagnosis letter from your
                physician. This helps us verify your eligibility for services.
              </p>

              {!uploadedFile ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors">
                  <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                  <span className="text-sm text-neutral-600 mb-1">
                    Click to upload diagnosis letter
                  </span>
                  <span className="text-xs text-neutral-500">
                    PDF, JPG, or PNG (max 10MB)
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="p-4 border border-green-200 bg-green-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <File className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900 text-sm">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-green-700">
                          {(uploadedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {!uploadedFile && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div className="text-xs text-amber-800">
                      <p className="font-semibold mb-1">
                        Don't have your diagnosis letter yet?
                      </p>
                      <p>
                        You can skip this step and upload it later. You'll have{" "}
                        <strong>60 days</strong> from registration to upload
                        your diagnosis letter. Without it, you won't be able to:
                      </p>
                      <ul className="list-disc ml-4 mt-1">
                        <li>RSVP for events</li>
                        <li>Apply for financial assistance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </FormField>
          </div>
        </>
      )}

      {/* Info message if no condition */}
      {!hasCondition && data.primaryCondition === "" && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            💡 If you don't have a bleeding disorder but your family members do,
            you can add them in the next step.
          </p>
        </div>
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
          type="submit"
          className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
        >
          Continue →
        </button>
      </div>
    </form>
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
