"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";

interface Photo {
  id: string;
  url: string;
  key: string;
  caption: string | null;
  uploadedBy: string;
  uploadedAt: Date;
}

interface Props {
  eventId: string;
  photos: Photo[];
  adminEmail: string;
}

export default function PhotosManager({ eventId, photos, adminEmail }: Props) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { confirm, ConfirmDialog } = useConfirm();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select photos to upload");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("photos", file);
      });

      const response = await fetch(`/api/admin/events/${eventId}/photos`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success(`${selectedFiles.length} photo(s) uploaded!`);
        setSelectedFiles([]);
        router.refresh();
        // Reset file input
        const input = document.getElementById(
          "photo-upload",
        ) as HTMLInputElement;
        if (input) input.value = "";
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

  const handleDelete = async (photoId: string) => {
    const confirmed = await confirm({
      title: "Delete Photo?",
      message: "This will permanently remove the photo from the gallery.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    setDeleting(photoId);

    try {
      const response = await fetch(
        `/api/admin/events/${eventId}/photos/${photoId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        toast.success("Photo deleted");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Delete failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <ConfirmDialog />

      {/* Upload Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
        <h3 className="font-semibold text-neutral-900 mb-4">Upload Photos</h3>

        <div className="space-y-4">
          <div>
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="photo-upload"
              className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors"
            >
              <Upload className="w-6 h-6" />
              <span>
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file(s) selected`
                  : "Select Photos (JPG, PNG, WebP)"}
              </span>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                >
                  {file.name}
                </div>
              ))}
            </div>
          )}

          {selectedFiles.length > 0 && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading {selectedFiles.length} photo(s)...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload {selectedFiles.length} Photo(s)
                </>
              )}
            </button>
          )}

          <p className="text-xs text-neutral-500">
            Photos will be optimized and converted to WebP format for faster
            loading.
          </p>
        </div>
      </div>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No photos uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group aspect-square rounded-lg overflow-hidden border border-neutral-200"
            >
              <img
                src={photo.url}
                alt={photo.caption || "Event photo"}
                className="w-full h-full object-cover"
              />

              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleDelete(photo.id)}
                  disabled={deleting === photo.id}
                  className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting === photo.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-xs text-white">
                  {new Date(photo.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
