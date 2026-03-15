"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Loader2, ImageIcon, Check } from "lucide-react";
import toast from "react-hot-toast";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  uploadedAt: string;
}

interface Props {
  eventId: string;
  photos: Photo[];
  sessionToken: string;
  lang: "en" | "es";
}

export default function PhotosTab({
  eventId,
  photos,
  sessionToken,
  lang,
}: Props) {
  const isEs = lang === "es";
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploaded(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("photo", selectedFile);
      if (caption.trim()) formData.append("caption", caption.trim());

      const res = await fetch(`/api/events/${eventId}/live-photos`, {
        method: "POST",
        headers: { "x-session-token": sessionToken },
        body: formData,
      });

      if (res.ok) {
        setUploaded(true);
        setSelectedFile(null);
        setPreviewUrl(null);
        setCaption("");
        if (fileRef.current) fileRef.current.value = "";
        toast.success(
          isEs
            ? "¡Foto enviada! Aparecerá en la galería una vez aprobada."
            : "Photo submitted! It'll appear in the gallery once approved.",
        );
      } else {
        const data = await res.json();
        toast.error(data.error || (isEs ? "Error al subir" : "Upload failed"));
      }
    } catch {
      toast.error(isEs ? "Error al subir" : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const t = {
    upload: isEs ? "Subir una foto" : "Share a Photo",
    uploadDesc: isEs
      ? "Comparte tus momentos favoritos del evento"
      : "Share your favorite moments from the event",
    select: isEs ? "Seleccionar foto" : "Select Photo",
    caption: isEs ? "Descripción (opcional)" : "Caption (optional)",
    captionPlaceholder: isEs ? "¿Qué está pasando?" : "What's happening?",
    submit: isEs ? "Enviar foto" : "Submit Photo",
    pending: isEs
      ? "Tu foto será revisada antes de aparecer"
      : "Your photo will be reviewed before appearing",
    gallery: isEs ? "Galería en vivo" : "Live Gallery",
    noPhotos: isEs
      ? "Aún no hay fotos aprobadas. ¡Sé el primero!"
      : "No approved photos yet. Be the first!",
  };

  return (
    <div className="space-y-6">
      {/* Upload section */}
      <div className="bg-neutral-800/60 rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-1">{t.upload}</h3>
        <p className="text-neutral-400 text-sm mb-4">{t.uploadDesc}</p>

        {previewUrl ? (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t.captionPlaceholder}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-700 border border-neutral-600 text-white placeholder:text-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-600 text-neutral-300 text-sm font-semibold hover:bg-neutral-700 transition-colors"
              >
                {isEs ? "Cancelar" : "Cancel"}
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {t.submit}
              </button>
            </div>
            <p className="text-xs text-neutral-500 text-center">{t.pending}</p>
          </div>
        ) : uploaded ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-white font-semibold mb-1">
              {isEs ? "¡Foto enviada!" : "Photo submitted!"}
            </p>
            <p className="text-neutral-400 text-sm mb-4">{t.pending}</p>
            <button
              onClick={() => setUploaded(false)}
              className="text-primary text-sm font-semibold hover:underline"
            >
              {isEs ? "Subir otra" : "Upload another"}
            </button>
          </div>
        ) : (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              id="live-photo-upload"
            />
            <label
              htmlFor="live-photo-upload"
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-neutral-600 cursor-pointer hover:border-primary hover:bg-neutral-700/30 transition-all"
            >
              <Camera className="w-8 h-8 text-neutral-500" />
              <span className="text-neutral-400 text-sm">{t.select}</span>
            </label>
          </>
        )}
      </div>

      {/* Gallery */}
      <div>
        <h3 className="font-semibold text-white mb-3">
          {t.gallery}
          {photos.length > 0 && (
            <span className="ml-2 text-xs text-neutral-400 font-normal">
              ({photos.length})
            </span>
          )}
        </h3>

        {photos.length === 0 ? (
          <div className="text-center py-10">
            <ImageIcon className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">{t.noPhotos}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-square rounded-xl overflow-hidden bg-neutral-800"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || "Event photo"}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
