"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface Patient {
  id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
  } | null;
}

interface Props {
  patient: Patient;
}

interface UploadedFile {
  file: File;
  preview: string;
  description: string;
}

export default function ApplicationForm({ patient }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [formData, setFormData] = useState({
    assistanceType: "EVENT_FEES",
    requestedAmount: "",
    purpose: "",
    description: "",
  });

  const [files, setFiles] = useState<UploadedFile[]>([]);

  const assistanceTypes = [
    { value: "EVENT_FEES", label: "Event Fees (Registration, Meals)" },
    { value: "TRANSPORTATION", label: "Transportation (Gas, Parking, Travel)" },
    { value: "MEDICATION", label: "Medication Copays" },
    { value: "MEDICAL_EQUIPMENT", label: "Medical Equipment" },
    { value: "EMERGENCY_SUPPORT", label: "Emergency Support" },
    { value: "OTHER", label: "Other" },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (files.length + selectedFiles.length > 10) {
      toast.error("Maximum 10 files allowed");
      return;
    }

    const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      description: "",
    }));

    setFiles([...files, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    URL.revokeObjectURL(files[index].preview);
    setFiles(newFiles);
  };

  const handleFileDescriptionChange = (index: number, description: string) => {
    const newFiles = [...files];
    newFiles[index].description = description;
    setFiles(newFiles);
  };

  const handleSaveDraft = async () => {
    if (
      !formData.assistanceType ||
      !formData.requestedAmount ||
      !formData.purpose
    ) {
      toast.error("Please fill in required fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/portal/assistance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "DRAFT",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Draft saved successfully!");
        router.push(`/portal/assistance/${data.applicationId}`);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save draft");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.assistanceType ||
      !formData.requestedAmount ||
      !formData.purpose
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (files.length === 0) {
      toast.error("Please upload at least one supporting document");
      return;
    }

    setLoading(true);
    setUploadingFiles(true);

    try {
      // Step 1: Create application
      const response = await fetch("/api/portal/assistance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "SUBMITTED",
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create application");
      }

      const { applicationId } = await response.json();

      // Step 2: Upload files
      for (const uploadedFile of files) {
        const fileFormData = new FormData();
        fileFormData.append("file", uploadedFile.file);
        fileFormData.append("applicationId", applicationId);
        fileFormData.append("description", uploadedFile.description);

        const uploadResponse = await fetch("/api/portal/assistance/upload", {
          method: "POST",
          body: fileFormData,
        });

        if (!uploadResponse.ok) {
          console.error("File upload failed:", uploadedFile.file.name);
        }
      }

      toast.success("Application submitted successfully!");
      router.push("/portal/assistance");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Assistance Type */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Application Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Type of Assistance Needed *
            </label>
            <select
              required
              value={formData.assistanceType}
              onChange={(e) =>
                setFormData({ ...formData, assistanceType: e.target.value })
              }
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {assistanceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Amount Requested *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                $
              </span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.requestedAmount}
                onChange={(e) =>
                  setFormData({ ...formData, requestedAmount: e.target.value })
                }
                className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Purpose (Brief Summary) *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value })
              }
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Transportation to monthly clinic appointments"
            />
            <p className="text-xs text-neutral-500 mt-1">
              {formData.purpose.length}/200 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Additional Details
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Provide any additional context that would help us understand your need..."
            />
          </div>
        </div>
      </div>

      {/* Document Upload */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">
          Supporting Documents *
        </h2>
        <p className="text-sm text-neutral-600 mb-4">
          Upload receipts, bills, prescriptions, or other supporting documents
          (Max 10 files, 10MB each)
        </p>

        {/* File Input */}
        <div className="mb-4">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors">
            <Upload className="w-8 h-8 text-neutral-400 mb-2" />
            <span className="text-sm text-neutral-600">
              Click to upload or drag and drop
            </span>
            <span className="text-xs text-neutral-500">
              PDF, JPG, PNG, or HEIC (max 10MB)
            </span>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.heic"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="space-y-3">
            {files.map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg"
              >
                <FileText className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {(uploadedFile.file.size / 1024).toFixed(2)} KB
                  </p>
                  <input
                    type="text"
                    placeholder="Description (e.g., Receipt for medication)"
                    value={uploadedFile.description}
                    onChange={(e) =>
                      handleFileDescriptionChange(index, e.target.value)
                    }
                    className="mt-2 w-full px-3 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Important Information */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="font-semibold text-amber-900 mb-2">
          Important Information
        </h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>
            • Applications are typically reviewed within 5-7 business days
          </li>
          <li>
            • You will receive an email notification when your application is
            reviewed
          </li>
          <li>
            • Approved assistance will be provided via check or reimbursement
          </li>
          <li>• Keep copies of all receipts and documents for your records</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={loading}
          className="px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          Save Draft
        </button>
        <button
          type="submit"
          disabled={loading || uploadingFiles}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {uploadingFiles ? "Uploading Files..." : "Submitting..."}
            </>
          ) : (
            "Submit Application"
          )}
        </button>
      </div>
    </form>
  );
}
