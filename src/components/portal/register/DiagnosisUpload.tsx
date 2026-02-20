"use client";

import { useState } from "react";
import { Upload, File, X, CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  onUpload: (fileUrl: string, fileKey: string) => void;
  currentFileUrl?: string;
  required?: boolean;
  familyMemberId?: string; // If uploading for family member
}

export default function DiagnosisUpload({
  onUpload,
  currentFileUrl,
  required = false,
  familyMemberId,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState(currentFileUrl || "");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Please upload a PDF or image file");
      return;
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (familyMemberId) {
        formData.append("familyMemberId", familyMemberId);
      }

      const response = await fetch("/api/portal/diagnosis/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const { fileUrl, fileKey } = await response.json();

      setUploadedUrl(fileUrl);
      onUpload(fileUrl, fileKey);
      toast.success("Diagnosis letter uploaded successfully!");
      setFile(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploadedUrl("");
  };

  if (uploadedUrl) {
    return (
      <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">
                Diagnosis letter uploaded
              </p>
              <p className="text-sm text-green-700">
                Pending admin verification
              </p>
            </div>
          </div>
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-600 hover:text-green-700 underline"
          >
            View
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors">
          <Upload className="w-10 h-10 text-neutral-400 mb-2" />
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
        <div className="p-4 border border-neutral-200 rounded-lg bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <File className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-medium text-neutral-900">{file.name}</p>
                <p className="text-xs text-neutral-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Diagnosis Letter"
            )}
          </button>
        </div>
      )}

      {required && (
        <p className="text-xs text-amber-600 flex items-center gap-2">
          <span className="font-bold">⚠️</span>
          Required to access financial assistance and event RSVPs
        </p>
      )}
    </div>
  );
}
