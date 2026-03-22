"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import MinutesEditor, {
  type MinutesSection,
} from "@/components/admin/minutes/MinutesEditor";
import MinutesViewer from "@/components/admin/minutes/MinutesViewer";

export default function NewMinutesPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewLang, setPreviewLang] = useState<"en" | "es">("en");

  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [sections, setSections] = useState<MinutesSection[]>([
    {
      type: "header",
      contentEn: "Call to Order",
      contentEs: "Llamada al Orden",
      redacted: false,
    },
    { type: "paragraph", contentEn: "", contentEs: "", redacted: false },
  ]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!meetingDate) {
      toast.error("Please select a meeting date");
      return;
    }
    if (sections.length === 0) {
      toast.error("Please add at least one section");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          meetingDate,
          content: { sections },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Minutes saved");
        router.push(`/admin/minutes/${data.minutes.id}`);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save minutes");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save minutes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/minutes"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Minutes
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            New Board Minutes
          </h1>
          <div className="flex gap-3">
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
              Save Minutes
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Board Meeting — March 2026"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Meeting Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Editor or Preview */}
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
              {title && (
                <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                  {title}
                </h2>
              )}
              {meetingDate && (
                <p className="text-sm text-neutral-500 mb-6">
                  {new Date(meetingDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
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
  );
}
