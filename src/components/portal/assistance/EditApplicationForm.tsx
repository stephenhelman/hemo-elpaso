"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, FileText, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Lang } from "@/types";
import { editApplicationFormTranslation } from "@/translation/portalAssistance";

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  description: string | null;
  uploadedAt: Date;
}

interface Application {
  id: string;
  assistanceType: string;
  requestedAmount: number;
  purpose: string;
  description: string | null;
  status: string;
  documents: Document[];
}

interface Props {
  application: Application;
  locale: Lang;
}

interface UploadedFile {
  file: File;
  preview: string;
  description: string;
}

export default function EditApplicationForm({ application, locale }: Props) {
  const router = useRouter();
  const t = editApplicationFormTranslation[locale];
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    assistanceType: application.assistanceType,
    requestedAmount: application.requestedAmount.toString(),
    purpose: application.purpose,
    description: application.description || "",
  });

  const [existingDocuments, setExistingDocuments] = useState<Document[]>(
    application.documents,
  );
  const [newFiles, setNewFiles] = useState<UploadedFile[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (
      existingDocuments.length + newFiles.length + selectedFiles.length >
      10
    ) {
      toast.error("Maximum 10 files allowed");
      return;
    }

    const files: UploadedFile[] = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      description: "",
    }));

    setNewFiles([...newFiles, ...files]);
  };

  const handleRemoveNewFile = (index: number) => {
    const files = newFiles.filter((_, i) => i !== index);
    URL.revokeObjectURL(newFiles[index].preview);
    setNewFiles(files);
  };

  const handleFileDescriptionChange = (index: number, description: string) => {
    const files = [...newFiles];
    files[index].description = description;
    setNewFiles(files);
  };

  const handleDeleteExistingDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    setDeletingDoc(documentId);

    try {
      const response = await fetch(
        `/api/portal/assistance/${application.id}/documents/${documentId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setExistingDocuments(
          existingDocuments.filter((doc) => doc.id !== documentId),
        );
        toast.success("Document deleted");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete document");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setDeletingDoc(null);
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

    if (existingDocuments.length + newFiles.length === 0) {
      toast.error("Please upload at least one supporting document");
      return;
    }

    setLoading(true);
    setUploadingFiles(true);

    try {
      // Step 1: Update application
      const response = await fetch(`/api/portal/assistance/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "SUBMITTED",
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update application");
      }

      // Step 2: Upload new files
      for (const uploadedFile of newFiles) {
        const fileFormData = new FormData();
        fileFormData.append("file", uploadedFile.file);
        fileFormData.append("applicationId", application.id);
        fileFormData.append("description", uploadedFile.description);

        const uploadResponse = await fetch("/api/portal/assistance/upload", {
          method: "POST",
          body: fileFormData,
        });

        if (!uploadResponse.ok) {
          console.error("File upload failed:", uploadedFile.file.name);
        }
      }

      toast.success("Application updated successfully!");
      router.push(`/portal/assistance/${application.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/portal/assistance/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "DRAFT",
        }),
      });

      if (response.ok) {
        toast.success("Draft saved successfully!");
        router.push(`/portal/assistance/${application.id}`);
        router.refresh();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Application Details */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          {t.applicationDetails}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t.typeNeeded}
            </label>
            <select
              required
              value={formData.assistanceType}
              onChange={(e) =>
                setFormData({ ...formData, assistanceType: e.target.value })
              }
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="EVENT_FEES">{locale === "es" ? "Cuotas de Evento" : "Event Fees"}</option>
              <option value="TRANSPORTATION">{locale === "es" ? "Transporte" : "Transportation"}</option>
              <option value="MEDICATION">{locale === "es" ? "Medicamento" : "Medication"}</option>
              <option value="MEDICAL_EQUIPMENT">{locale === "es" ? "Equipo Médico" : "Medical Equipment"}</option>
              <option value="EMERGENCY_SUPPORT">{locale === "es" ? "Apoyo de Emergencia" : "Emergency Support"}</option>
              <option value="OTHER">{locale === "es" ? "Otro" : "Other"}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t.amountRequested}
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
              {t.purpose}
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
              placeholder={t.purposePlaceholder}
            />
            <p className="text-xs text-neutral-500 mt-1">
              {t.charCount(200 - formData.purpose.length)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t.additionalDetails}
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t.additionalPlaceholder}
            />
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">
          {t.supportingDocuments}
        </h2>
        <p className="text-sm text-neutral-600 mb-4">{t.uploadAdditional}</p>

        {/* Existing Documents */}
        {existingDocuments.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">
              {t.currentDocuments}
            </h3>
            <div className="space-y-2">
              {existingDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {doc.fileName}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-neutral-600">
                          {doc.description}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500">
                        {(doc.fileSize / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteExistingDocument(doc.id)}
                    disabled={deletingDoc === doc.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  >
                    {deletingDoc === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Upload */}
        {existingDocuments.length + newFiles.length < 10 && (
          <div className="mb-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors">
              <Upload className="w-8 h-8 text-neutral-400 mb-2" />
              <span className="text-sm text-neutral-600">
                {t.uploadInstructions}
              </span>
              <span className="text-xs text-neutral-500">{t.uploadFormats}</span>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.heic"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* New Files List */}
        {newFiles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-700">
              {t.newDocuments}
            </h3>
            {newFiles.map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border border-green-200 bg-green-50 rounded-lg"
              >
                <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {(uploadedFile.file.size / 1024).toFixed(2)} KB
                  </p>
                  <input
                    type="text"
                    placeholder={t.descriptionPlaceholder}
                    value={uploadedFile.description}
                    onChange={(e) =>
                      handleFileDescriptionChange(index, e.target.value)
                    }
                    className="mt-2 w-full px-3 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveNewFile(index)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
        >
          {t.cancelButton}
        </button>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={loading}
          className="px-6 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          {t.saveDraft}
        </button>
        <button
          type="submit"
          disabled={loading || uploadingFiles}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {uploadingFiles ? t.uploading : t.updating}
            </>
          ) : (
            t.updateApplication
          )}
        </button>
      </div>
    </form>
  );
}
