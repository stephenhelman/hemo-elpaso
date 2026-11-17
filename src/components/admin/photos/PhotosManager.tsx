"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  Trash2,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
  EyeOff,
  Star,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  AlertCircle,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "@/hooks/useConfirm";

export interface AdminPhoto {
  id: string;
  url: string;
  thumbUrl: string | null;
  caption: string | null;
  captionEs: string | null;
  approved: boolean;
  width: number | null;
  height: number | null;
}

const MAX_BYTES = 25 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];
const CONCURRENCY = 3;

type UploadRow = {
  id: string;
  name: string;
  status: "queued" | "uploading" | "processing" | "done" | "error";
  progress: number;
  error?: string;
};

/** PUT with progress events (fetch cannot report upload progress). */
function putWithProgress(url: string, file: File, contentType: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload was refused (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(file);
  });
}

export default function PhotosManager({ eventId, photos: initial, coverPhotoId: initialCover }: { eventId: string; photos: AdminPhoto[]; coverPhotoId: string | null }) {
  const [photos, setPhotos] = useState<AdminPhoto[]>(initial);
  const [cover, setCover] = useState<string | null>(initialCover);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { confirm, ConfirmDialog } = useConfirm();
  const api = `/api/admin/events/${eventId}/photos`;

  const patchUpload = (id: string, patch: Partial<UploadRow>) => setUploads((u) => u.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const rows: UploadRow[] = files.map((f, i) => ({ id: `${Date.now()}-${i}-${f.name}`, name: f.name, status: "queued", progress: 0 }));
      setUploads((u) => [...rows, ...u]);

      // Reject obviously wrong files before asking for URLs (the server checks again, and checks the real bytes).
      const ok: { file: File; row: UploadRow }[] = [];
      files.forEach((file, i) => {
        const row = rows[i];
        if (!TYPES.includes(file.type)) patchUpload(row.id, { status: "error", error: "Only JPEG, PNG or WebP images (HEIC: export as JPEG first)" });
        else if (file.size > MAX_BYTES) patchUpload(row.id, { status: "error", error: "Larger than 25 MB" });
        else if (file.size === 0) patchUpload(row.id, { status: "error", error: "Empty file" });
        else ok.push({ file, row });
      });
      if (ok.length === 0) return;

      let presigned: { key?: string; url?: string; headers?: Record<string, string>; error?: string }[] = [];
      try {
        const res = await fetch(`${api}/presign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files: ok.map(({ file }) => ({ name: file.name, size: file.size, type: file.type })) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not start the upload");
        presigned = data.uploads;
      } catch (err: any) {
        ok.forEach(({ row }) => patchUpload(row.id, { status: "error", error: err.message || "Could not start the upload" }));
        return;
      }

      let next = 0;
      const worker = async () => {
        while (next < ok.length) {
          const i = next++;
          const { file, row } = ok[i];
          const p = presigned[i];
          if (!p?.url || !p.key) {
            patchUpload(row.id, { status: "error", error: p?.error || "Rejected" });
            continue;
          }
          try {
            patchUpload(row.id, { status: "uploading", progress: 0 });
            await putWithProgress(p.url, file, file.type, (pct) => patchUpload(row.id, { progress: pct }));
            patchUpload(row.id, { status: "processing", progress: 100 });
            const res = await fetch(`${api}/process`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: p.key }) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Processing failed");
            setPhotos((list) => [...list, data.photo]);
            patchUpload(row.id, { status: "done" });
          } catch (err: any) {
            patchUpload(row.id, { status: "error", error: err.message || "Failed" });
          }
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, ok.length) }, worker));
    },
    [api],
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    void uploadFiles(files);
  };
  const onDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    void uploadFiles(Array.from(e.dataTransfer.files));
  };

  const call = async (photoId: string, init: RequestInit, errorText: string) => {
    setBusy(photoId);
    try {
      const res = await fetch(`${api}/${photoId}`, init);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || errorText);
      return data;
    } catch (err: any) {
      toast.error(err.message || errorText);
      return null;
    } finally {
      setBusy(null);
    }
  };
  const patch = (photoId: string, body: object) =>
    call(photoId, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, "Update failed");

  const toggleApproved = async (p: AdminPhoto) => {
    const data = await patch(p.id, { approved: !p.approved });
    if (!data) return;
    setPhotos((l) => l.map((x) => (x.id === p.id ? { ...x, ...data.photo } : x)));
    setCover(data.coverPhotoId ?? null);
    toast.success(p.approved ? "Removed from the public gallery" : "Approved: now on the public gallery");
  };
  const makeCover = async (p: AdminPhoto) => {
    const data = await patch(p.id, { cover: cover !== p.id });
    if (data) setCover(data.coverPhotoId ?? null);
  };
  const saveCaptions = async (p: AdminPhoto, caption: string, captionEs: string) => {
    const data = await patch(p.id, { caption, captionEs });
    if (data) {
      setPhotos((l) => l.map((x) => (x.id === p.id ? { ...x, caption: data.photo.caption, captionEs: data.photo.captionEs } : x)));
      setEditing(null);
      toast.success("Caption saved");
    }
  };
  const remove = async (p: AdminPhoto) => {
    const yes = await confirm({
      title: "Delete photo?",
      message: "This permanently deletes the photo and its thumbnail from storage.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!yes) return;
    const data = await call(p.id, { method: "DELETE" }, "Delete failed");
    if (data) {
      setPhotos((l) => l.filter((x) => x.id !== p.id));
      if (cover === p.id) setCover(null);
      toast.success("Photo deleted");
    }
  };

  const saveOrder = async (list: AdminPhoto[]) => {
    const res = await fetch(`${api}/order`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: list.map((p) => p.id) }) });
    if (!res.ok) toast.error("Could not save the new order");
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length || from === to) return;
    const list = [...photos];
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    setPhotos(list);
    void saveOrder(list);
  };

  // Warn before leaving mid-upload.
  const active = uploads.some((u) => u.status === "uploading" || u.status === "processing" || u.status === "queued");
  useEffect(() => {
    if (!active) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [active]);

  return (
    <>
      <ConfirmDialog />

      {/* Upload */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
        <h3 className="font-semibold text-neutral-900 mb-4">Upload photos</h3>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onPick} className="hidden" id="photo-upload" />
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDropFiles}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 px-6 py-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-center ${dragOver ? "border-primary bg-primary-50" : "border-neutral-300 hover:border-primary hover:bg-primary-50"}`}
        >
          <Upload className="w-7 h-7 text-neutral-500" />
          <span className="font-medium text-neutral-800">Drop photos here, or click to choose</span>
          <span className="text-xs text-neutral-500">JPEG, PNG or WebP · up to 25 MB each · uploaded photos start unapproved</span>
        </div>
        <p className="text-xs text-neutral-500 mt-3">
          Photos are resized, turned upright, and stripped of all camera data (including location) before they are stored.
        </p>

        {uploads.length > 0 && (
          <ul className="mt-4 space-y-2" aria-live="polite">
            {uploads.map((u) => (
              <li key={u.id} className="text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-neutral-700">{u.name}</span>
                  <span className={`shrink-0 text-xs ${u.status === "error" ? "text-red-600" : u.status === "done" ? "text-green-600" : "text-neutral-500"}`}>
                    {u.status === "queued" && "Waiting"}
                    {u.status === "uploading" && `Uploading ${u.progress}%`}
                    {u.status === "processing" && "Processing…"}
                    {u.status === "done" && "Done"}
                    {u.status === "error" && (
                      <span className="inline-flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {u.error}
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-1.5 mt-1 rounded bg-neutral-100 overflow-hidden">
                  <div
                    className={`h-full transition-all ${u.status === "error" ? "bg-red-400" : u.status === "done" ? "bg-green-500" : "bg-primary"} ${u.status === "processing" ? "animate-pulse" : ""}`}
                    style={{ width: `${u.status === "error" ? 100 : u.progress}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        {uploads.some((u) => u.status === "done" || u.status === "error") && !active && (
          <button onClick={() => setUploads([])} className="mt-3 text-xs text-neutral-500 underline">Clear list</button>
        )}
      </div>

      {/* Gallery */}
      {photos.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">No photos uploaded yet</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-neutral-500 mb-3">
            Drag to reorder (or use the arrows). Only <strong>approved</strong> photos appear on the public gallery, in this order. The star marks the cover photo.
          </p>
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((p, i) => (
              <li
                key={p.id}
                draggable
                onDragStart={() => setDragId(p.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => dragId && e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!dragId || dragId === p.id) return;
                  move(photos.findIndex((x) => x.id === dragId), i);
                  setDragId(null);
                }}
                className={`rounded-xl border bg-white overflow-hidden flex flex-col ${dragId === p.id ? "opacity-40" : ""} ${p.approved ? "border-neutral-200" : "border-amber-300"}`}
              >
                <div className="relative aspect-square bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.thumbUrl ?? p.url} alt={p.caption || "Event photo"} loading="lazy" draggable={false} className="w-full h-full object-cover" />
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white ${p.approved ? "bg-green-600" : "bg-amber-500"}`}>
                    {p.approved ? "Public" : "Pending"}
                  </span>
                  {cover === p.id && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white text-amber-600 inline-flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500" /> Cover
                    </span>
                  )}
                  <span className="absolute bottom-2 left-2 text-white/90 cursor-grab" aria-hidden>
                    <GripVertical className="w-5 h-5 drop-shadow" />
                  </span>
                </div>

                <div className="p-2 flex flex-col gap-2">
                  {editing === p.id ? (
                    <CaptionEditor photo={p} onSave={saveCaptions} onCancel={() => setEditing(null)} saving={busy === p.id} />
                  ) : (
                    <p className="text-xs text-neutral-600 min-h-[1rem] line-clamp-2">{p.caption || <span className="text-neutral-400">No caption</span>}</p>
                  )}

                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => toggleApproved(p)}
                      disabled={busy === p.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 ${p.approved ? "bg-amber-500 hover:bg-amber-600" : "bg-green-600 hover:bg-green-700"}`}
                    >
                      {busy === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : p.approved ? <EyeOff className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {p.approved ? "Unapprove" : "Approve"}
                    </button>
                    <button onClick={() => makeCover(p)} disabled={!p.approved || busy === p.id} title={p.approved ? "Set as cover photo" : "Approve first"} aria-label="Set as cover photo" className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40">
                      <Star className={`w-4 h-4 ${cover === p.id ? "fill-amber-500 text-amber-500" : ""}`} />
                    </button>
                    <button onClick={() => setEditing(editing === p.id ? null : p.id)} title="Edit captions" aria-label="Edit captions" className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier" className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => move(i, i + 1)} disabled={i === photos.length - 1} aria-label="Move later" className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(p)} disabled={busy === p.id} aria-label="Delete photo" className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 ml-auto">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function CaptionEditor({ photo, onSave, onCancel, saving }: { photo: AdminPhoto; onSave: (p: AdminPhoto, en: string, es: string) => void; onCancel: () => void; saving: boolean }) {
  const [en, setEn] = useState(photo.caption ?? "");
  const [es, setEs] = useState(photo.captionEs ?? "");
  return (
    <div className="space-y-1.5">
      <input value={en} onChange={(e) => setEn(e.target.value)} maxLength={300} placeholder="Caption (English)" aria-label="Caption in English" className="w-full px-2 py-1.5 border border-neutral-300 rounded text-xs" />
      <input value={es} onChange={(e) => setEs(e.target.value)} maxLength={300} placeholder="Leyenda (Español)" aria-label="Caption in Spanish" className="w-full px-2 py-1.5 border border-neutral-300 rounded text-xs" />
      <div className="flex gap-2">
        <button onClick={() => onSave(photo, en, es)} disabled={saving} className="px-2.5 py-1 rounded bg-primary text-white text-xs font-semibold disabled:opacity-50">Save</button>
        <button onClick={onCancel} className="px-2.5 py-1 rounded border border-neutral-300 text-xs">Cancel</button>
      </div>
    </div>
  );
}
