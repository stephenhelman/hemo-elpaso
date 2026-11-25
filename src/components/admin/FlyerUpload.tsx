"use client";

import { useEffect, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { FLYER_ALT_MAX, FLYER_MAX_BYTES, FLYER_MIME, isPdfUrl } from "@/lib/flyers";

interface Props {
  eventId: string;
  currentFlyerEn?: string | null;
  currentFlyerEs?: string | null;
  currentAltEn?: string | null;
  currentAltEs?: string | null;
  onUploadComplete?: () => void;
}

/** One language: preview (new file, else the saved one), file picker, and the short description used as alt text. */
function FlyerSlot(p: {
  id: string; label: string; altLabel: string; altHelp: string; saved: string | null | undefined;
  file: File | null; setFile: (f: File | null) => void; alt: string; setAlt: (v: string) => void;
}) {
  const [blob, setBlob] = useState<string | null>(null);
  useEffect(() => {
    if (!p.file || p.file.type === "application/pdf") { setBlob(null); return; }
    const u = URL.createObjectURL(p.file);
    setBlob(u);
    return () => URL.revokeObjectURL(u);
  }, [p.file]);

  const showUrl = p.file ? blob : p.saved ?? null;
  const showsPdf = p.file ? p.file.type === "application/pdf" : p.saved ? isPdfUrl(p.saved) : false;

  const pick = (f: File | null) => {
    if (f && !(FLYER_MIME as readonly string[]).includes(f.type)) { toast.error("Flyers must be PNG, JPG or PDF"); return; }
    if (f && f.size > FLYER_MAX_BYTES) { toast.error("Flyers must be 10 MB or smaller"); return; }
    p.setFile(f);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700">{p.label} (PDF, JPG, PNG, max 10 MB)</label>

      {(showUrl || showsPdf) && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2">
          {showsPdf ? (
            <div className="flex items-center gap-2 p-3 text-sm text-neutral-700">
              <FileText className="w-5 h-5 text-neutral-500" aria-hidden />
              {p.file ? p.file.name : "PDF flyer"}
              {!p.file && p.saved && <a href={p.saved} target="_blank" rel="noopener noreferrer" className="ml-auto text-primary hover:underline">View</a>}
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={showUrl!} alt={p.alt || p.label} className="mx-auto max-h-64 w-auto rounded" />
          )}
          {p.file && <p className="mt-1 px-1 text-xs text-amber-700">Not saved yet: press “Save flyers”.</p>}
        </div>
      )}

      <div className="relative">
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { pick(e.target.files?.[0] || null); e.target.value = ""; }} className="hidden" id={p.id} />
        <label htmlFor={p.id} className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors">
          <Upload className="w-5 h-5" />
          <span className="text-sm">{p.file ? p.file.name : p.saved ? "Replace flyer" : `Select ${p.label}`}</span>
        </label>
        {p.file && (
          <button type="button" aria-label="Remove selected file" onClick={() => p.setFile(null)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <div>
        <label htmlFor={`${p.id}-alt`} className="block text-sm font-medium text-neutral-700">{p.altLabel}</label>
        <input
          id={`${p.id}-alt`} type="text" value={p.alt} maxLength={FLYER_ALT_MAX} onChange={(e) => p.setAlt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-neutral-500">{p.altHelp}</p>
      </div>
    </div>
  );
}

export default function FlyerUpload({ eventId, currentFlyerEn, currentFlyerEs, currentAltEn, currentAltEs, onUploadComplete }: Props) {
  const [uploading, setUploading] = useState(false);
  const [flyerEn, setFlyerEn] = useState<File | null>(null);
  const [flyerEs, setFlyerEs] = useState<File | null>(null);
  const [altEn, setAltEn] = useState(currentAltEn ?? "");
  const [altEs, setAltEs] = useState(currentAltEs ?? "");

  const dirty = !!flyerEn || !!flyerEs || altEn !== (currentAltEn ?? "") || altEs !== (currentAltEs ?? "");

  const handleUpload = async () => {
    if (!dirty) {
      toast.error("Nothing to save yet");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      if (flyerEn) formData.append("flyerEn", flyerEn);
      if (flyerEs) formData.append("flyerEs", flyerEs);
      formData.append("flyerEnAlt", altEn);
      formData.append("flyerEsAlt", altEs);

      const response = await fetch(`/api/admin/events/${eventId}/flyers`, { method: "POST", body: formData });
      if (response.ok) {
        toast.success("Flyers saved");
        setFlyerEn(null);
        setFlyerEs(null);
        onUploadComplete?.();
      } else {
        const data = await response.json().catch(() => ({}));
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FlyerSlot
          id="flyerEn" label="English flyer" altLabel="Short description (English)" altHelp="Read aloud by screen readers and shown when images are blocked in the email."
          saved={currentFlyerEn} file={flyerEn} setFile={setFlyerEn} alt={altEn} setAlt={setAltEn}
        />
        <FlyerSlot
          id="flyerEs" label="Spanish flyer" altLabel="Descripción corta (español)" altHelp="La leen los lectores de pantalla y se muestra si el correo bloquea las imágenes."
          saved={currentFlyerEs} file={flyerEs} setFile={setFlyerEs} alt={altEs} setAlt={setAltEs}
        />
      </div>
      <button
        type="button" onClick={handleUpload} disabled={uploading || !dirty}
        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
      >
        {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save flyers"}
      </button>
    </div>
  );
}
