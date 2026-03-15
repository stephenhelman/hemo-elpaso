"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import MinutesEditor, {
  type MinutesSection,
} from "@/components/admin/minutes/MinutesEditor";
import MinutesViewer from "@/components/admin/minutes/MinutesViewer";
import { useConfirm } from "@/hooks/useConfirm";

interface Minutes {
  id: string;
  title: string;
  meetingDate: string;
  content: { sections: MinutesSection[] };
  isPublic: boolean;
  markedPublicBy: string | null;
  markedPublicAt: string | null;
  uploadedBy: string;
  createdAt: string;
}

interface Props {
  minutes: Minutes;
  isSecretary: boolean;
}

export default function MinutesDetailClient({ minutes, isSecretary }: Props) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();

  const [saving, setSaving] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewLang, setPreviewLang] = useState<"en" | "es">("en");

  const [title, setTitle] = useState(minutes.title);
  const [sections, setSections] = useState<MinutesSection[]>(
    minutes.content.sections,
  );

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/minutes/${minutes.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: { sections } }),
      });
      if (response.ok) {
        toast.success("Minutes saved");
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!isSecretary) {
      toast.error("Only the Secretary can change minutes visibility");
      return;
    }
    setTogglingVisibility(true);
    try {
      const response = await fetch(`/api/admin/minutes/${minutes.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !minutes.isPublic }),
      });
      if (response.ok) {
        toast.success(
          minutes.isPublic ? "Minutes set to private" : "Minutes published",
        );
        router.refresh();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update visibility");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update visibility");
    } finally {
      setTogglingVisibility(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Minutes?",
      message:
        "This will permanently delete these board minutes. This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/minutes/${minutes.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Minutes deleted");
        router.push("/admin/minutes");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const redactedCount = sections.filter((s) => s.redacted).length;

  return (
    <>
      <ConfirmDialog />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/admin/minutes"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Minutes
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
                {title}
              </h1>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    minutes.isPublic
                      ? "bg-green-100 text-green-700"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {minutes.isPublic ? (
                    <>
                      <Globe className="w-3 h-3" /> Public
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" /> Private
                    </>
                  )}
                </span>
                {redactedCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                    <EyeOff className="w-3 h-3" />
                    {redactedCount} redacted section
                    {redactedCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-end">
              {/* Visibility toggle — Secretary only */}
              {isSecretary && (
                <button
                  onClick={handleToggleVisibility}
                  disabled={togglingVisibility}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                    minutes.isPublic
                      ? "border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {togglingVisibility ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : minutes.isPublic ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  {minutes.isPublic ? "Unpublish" : "Publish"}
                </button>
              )}

              <button
                onClick={() => setPreview((v) => !v)}
                className="px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
              >
                {preview ? "Edit" : "Preview"}
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>

          {/* Published info */}
          {minutes.isPublic && minutes.markedPublicAt && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-sm text-green-800">
                Published by <strong>{minutes.markedPublicBy}</strong> on{" "}
                {new Date(minutes.markedPublicAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}

          {/* Title input */}
          {!preview && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Editor / Preview */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            {preview ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-neutral-900">Preview</h2>
                  <div className="flex gap-2">
                    {(["en", "es"] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setPreviewLang(l)}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                          previewLang === l
                            ? "bg-primary text-white"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        }`}
                      >
                        {l === "en" ? "English" : "Español"}
                      </button>
                    ))}
                  </div>
                </div>
                <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                  {title}
                </h2>
                <p className="text-sm text-neutral-500 mb-6">
                  {new Date(minutes.meetingDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <MinutesViewer sections={sections} lang={previewLang} />
              </>
            ) : (
              <>
                <h2 className="font-semibold text-neutral-900 mb-4">Content</h2>
                <MinutesEditor sections={sections} onChange={setSections} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
