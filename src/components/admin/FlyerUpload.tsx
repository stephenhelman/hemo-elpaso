"use client";

import { useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  eventId: string;
  currentFlyerEn?: string | null;
  currentFlyerEs?: string | null;
  onUploadComplete?: () => void;
}

export default function FlyerUpload({
  eventId,
  currentFlyerEn,
  currentFlyerEs,
  onUploadComplete,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [flyerEn, setFlyerEn] = useState<File | null>(null);
  const [flyerEs, setFlyerEs] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!flyerEn && !flyerEs) {
      toast.error("Please select at least one flyer to upload");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      if (flyerEn) formData.append("flyerEn", flyerEn);
      if (flyerEs) formData.append("flyerEs", flyerEs);

      const response = await fetch(`/api/admin/events/${eventId}/flyers`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Flyers uploaded successfully!");
        setFlyerEn(null);
        setFlyerEs(null);
        onUploadComplete?.();
      } else {
        const data = await response.json();
        toast.error(data.error || "Upload failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* English Flyer */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            English Flyer (PDF)
          </label>

          {currentFlyerEn && !flyerEn && (
            <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Current flyer uploaded
                </span>
              </div>
              <a
                href={currentFlyerEn}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:underline"
              >
                View
              </a>
            </div>
          )}

          <div className="relative">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFlyerEn(e.target.files?.[0] || null)}
              className="hidden"
              id="flyerEn"
            />
            <label
              htmlFor="flyerEn"
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="text-sm">
                {flyerEn ? flyerEn.name : "Select English PDF"}
              </span>
            </label>
            {flyerEn && (
              <button
                onClick={() => setFlyerEn(null)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Spanish Flyer */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Spanish Flyer (PDF)
          </label>

          {currentFlyerEs && !flyerEs && (
            <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  Current flyer uploaded
                </span>
              </div>
              <a
                href={currentFlyerEs}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:underline"
              >
                View
              </a>
            </div>
          )}

          <div className="relative">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFlyerEs(e.target.files?.[0] || null)}
              className="hidden"
              id="flyerEs"
            />
            <label
              htmlFor="flyerEs"
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="text-sm">
                {flyerEs ? flyerEs.name : "Select Spanish PDF"}
              </span>
            </label>
            {flyerEs && (
              <button
                onClick={() => setFlyerEs(null)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {(flyerEn || flyerEs) && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Flyers
            </>
          )}
        </button>
      )}
    </div>
  );
}
