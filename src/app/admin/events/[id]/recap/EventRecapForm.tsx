"use client";

import { useState } from "react";
import { Globe, Eye, EyeOff, Loader2, Check, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface EventData {
  id: string;
  slug: string;
  titleEn: string;
  titleEs: string;
  recapTitleEn: string | null;
  recapTitleEs: string | null;
  recapBodyEn: string | null;
  recapBodyEs: string | null;
  recapGalleryEmbedUrl: string | null;
  recapPublishedAt: Date | null;
}

export default function EventRecapForm({ event }: { event: EventData }) {
  const [recapTitleEn, setRecapTitleEn] = useState(event.recapTitleEn ?? "");
  const [recapTitleEs, setRecapTitleEs] = useState(event.recapTitleEs ?? "");
  const [recapBodyEn, setRecapBodyEn] = useState(event.recapBodyEn ?? "");
  const [recapBodyEs, setRecapBodyEs] = useState(event.recapBodyEs ?? "");
  const [recapGalleryEmbedUrl, setRecapGalleryEmbedUrl] = useState(
    event.recapGalleryEmbedUrl ?? "",
  );
  const [isPublished, setIsPublished] = useState(!!event.recapPublishedAt);
  const [saving, setSaving] = useState(false);

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${event.id}/recap`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recapTitleEn: recapTitleEn || null,
          recapTitleEs: recapTitleEs || null,
          recapBodyEn: recapBodyEn || null,
          recapBodyEs: recapBodyEs || null,
          recapGalleryEmbedUrl: recapGalleryEmbedUrl || null,
          publish,
        }),
      });
      if (!res.ok) throw new Error();
      setIsPublished(publish);
      toast.success(publish ? "Recap published!" : "Draft saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Status banner */}
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          isPublished
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}
      >
        {isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        <span>
          {isPublished
            ? "This recap is published and visible on the public event page."
            : "This recap is saved as a draft and not yet visible to the public."}
        </span>
        {isPublished && (
          <a
            href={`/events/${event.slug}/recap`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-green-700 hover:underline"
          >
            View <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* English recap */}
      <section className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-neutral-900">English Recap</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
          <input
            type="text"
            value={recapTitleEn}
            onChange={(e) => setRecapTitleEn(e.target.value)}
            placeholder={`Recap: ${event.titleEn}`}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Body</label>
          <textarea
            value={recapBodyEn}
            onChange={(e) => setRecapBodyEn(e.target.value)}
            rows={10}
            placeholder="Write the event recap in English..."
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-y font-mono text-sm"
          />
          <p className="text-xs text-neutral-400 mt-1">Plain text. Line breaks are preserved.</p>
        </div>
      </section>

      {/* Spanish recap */}
      <section className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-neutral-900">Recap en Español</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Título</label>
          <input
            type="text"
            value={recapTitleEs}
            onChange={(e) => setRecapTitleEs(e.target.value)}
            placeholder={`Resumen: ${event.titleEs}`}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Cuerpo</label>
          <textarea
            value={recapBodyEs}
            onChange={(e) => setRecapBodyEs(e.target.value)}
            rows={10}
            placeholder="Escribe el resumen del evento en español..."
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-y font-mono text-sm"
          />
        </div>
      </section>

      {/* Photo gallery embed */}
      <section className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-3">
        <h2 className="font-semibold text-neutral-900">Photo Gallery</h2>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Gallery embed URL
            <span className="ml-2 text-neutral-400 font-normal text-xs">(iframe src)</span>
          </label>
          <input
            type="url"
            value={recapGalleryEmbedUrl}
            onChange={(e) => setRecapGalleryEmbedUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          />
          <p className="text-xs text-neutral-400 mt-1">
            Paste an embeddable URL (e.g. Google Photos album embed, Flickr slideshow, YouTube
            playlist). Leave blank to omit.
          </p>
        </div>

        {recapGalleryEmbedUrl && (
          <div className="rounded-xl overflow-hidden border border-neutral-200 aspect-video">
            <iframe
              src={recapGalleryEmbedUrl}
              className="w-full h-full"
              allowFullScreen
              title="Gallery preview"
            />
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save Draft
        </button>

        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPublished ? (
            <Check className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {isPublished ? "Update & Keep Published" : "Publish Recap"}
        </button>

        {isPublished && (
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-300 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-colors disabled:opacity-50"
          >
            <EyeOff className="w-4 h-4" />
            Unpublish
          </button>
        )}
      </div>
    </div>
  );
}
