"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Newspaper,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";

interface Photo {
  id: string;
  url: string;
  key: string;
  caption: string | null;
  approved: boolean;
  selectedForNewsletter: boolean;
  uploadedBy: string;
  uploadedAt: Date;
}

interface Props {
  eventId: string;
  photos: Photo[];
  adminEmail: string;
  newsletterMode?: boolean;
}

export default function PhotosManager({
  eventId,
  photos,
  adminEmail,
  newsletterMode = false,
}: Props) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newsletterLoading, setNewsletterLoading] = useState<string | null>(
    null,
  );
  const [approvingLoading, setApprovingLoading] = useState<string | null>(null);
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
        { method: "DELETE" },
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

  const handleToggleApproved = async (
    photoId: string,
    currentApproved: boolean,
  ) => {
    setApprovingLoading(photoId);
    try {
      const response = await fetch(
        `/api/admin/events/${eventId}/photos/${photoId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: !currentApproved }),
        },
      );
      if (response.ok) {
        toast.success(currentApproved ? "Photo unapproved" : "Photo approved");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update photo");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update photo");
    } finally {
      setApprovingLoading(null);
    }
  };

  const handleToggleNewsletter = async (
    photoId: string,
    currentSelected: boolean,
  ) => {
    setNewsletterLoading(photoId);
    try {
      const response = await fetch(
        `/api/admin/events/${eventId}/photos/${photoId}/newsletter`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selected: !currentSelected }),
        },
      );
      if (response.ok) {
        toast.success(
          currentSelected ? "Removed from newsletter" : "Added to newsletter",
        );
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update newsletter selection");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update newsletter selection");
    } finally {
      setNewsletterLoading(null);
    }
  };

  const approvedPhotos = photos.filter((p) => p.approved);
  const unapprovedPhotos = photos.filter((p) => !p.approved);

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

      {/* Newsletter mode banner */}
      {newsletterMode && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <Newspaper className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800">
            <strong>Newsletter Mode:</strong> Click the bookmark icon on any
            approved photo to include it in the next newsletter.
          </p>
        </div>
      )}

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No photos uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Approved Photos */}
          {approvedPhotos.length > 0 && (
            <div>
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Approved ({approvedPhotos.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {approvedPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onDelete={handleDelete}
                    onToggleApproved={handleToggleApproved}
                    onToggleNewsletter={handleToggleNewsletter}
                    deleting={deleting === photo.id}
                    approvingLoading={approvingLoading === photo.id}
                    newsletterLoading={newsletterLoading === photo.id}
                    newsletterMode={newsletterMode}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Unapproved Photos */}
          {unapprovedPhotos.length > 0 && (
            <div>
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-neutral-500" />
                Pending Approval ({unapprovedPhotos.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {unapprovedPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onDelete={handleDelete}
                    onToggleApproved={handleToggleApproved}
                    onToggleNewsletter={handleToggleNewsletter}
                    deleting={deleting === photo.id}
                    approvingLoading={approvingLoading === photo.id}
                    newsletterLoading={newsletterLoading === photo.id}
                    newsletterMode={newsletterMode}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function PhotoCard({
  photo,
  onDelete,
  onToggleApproved,
  onToggleNewsletter,
  deleting,
  approvingLoading,
  newsletterLoading,
  newsletterMode,
}: {
  photo: Photo;
  onDelete: (id: string) => void;
  onToggleApproved: (id: string, approved: boolean) => void;
  onToggleNewsletter: (id: string, selected: boolean) => void;
  deleting: boolean;
  approvingLoading: boolean;
  newsletterLoading: boolean;
  newsletterMode: boolean;
}) {
  return (
    <div
      className={`relative group aspect-square rounded-lg overflow-hidden border transition-all ${
        photo.selectedForNewsletter
          ? "border-emerald-400 ring-2 ring-emerald-200"
          : "border-neutral-200"
      }`}
    >
      <img
        src={photo.url}
        alt={photo.caption || "Event photo"}
        className="w-full h-full object-cover"
      />

      {/* Newsletter badge */}
      {photo.selectedForNewsletter && (
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold">
          <Newspaper className="w-3 h-3" />
          Newsletter
        </div>
      )}

      {/* Unapproved overlay */}
      {!photo.approved && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="px-2 py-1 rounded-full bg-amber-500 text-white text-xs font-semibold">
            Pending
          </span>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
        {/* Approve toggle */}
        <button
          onClick={() => onToggleApproved(photo.id, photo.approved)}
          disabled={approvingLoading}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
            photo.approved
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {approvingLoading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle className="w-3 h-3" />
          )}
          {photo.approved ? "Unapprove" : "Approve"}
        </button>

        {/* Newsletter toggle — only show on approved photos in newsletter mode */}
        {newsletterMode && photo.approved && (
          <button
            onClick={() =>
              onToggleNewsletter(photo.id, photo.selectedForNewsletter)
            }
            disabled={newsletterLoading}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
              photo.selectedForNewsletter
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-white text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {newsletterLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Newspaper className="w-3 h-3" />
            )}
            {photo.selectedForNewsletter ? "Deselect" : "Newsletter"}
          </button>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete(photo.id)}
          disabled={deleting}
          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Date info */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-xs text-white">
          {new Date(photo.uploadedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
