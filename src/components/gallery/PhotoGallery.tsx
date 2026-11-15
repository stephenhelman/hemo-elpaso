"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Lang } from "@/types";
import type { PublicPhoto } from "@/lib/photos/public";

const T = {
  en: { open: "Open photo", close: "Close", prev: "Previous photo", next: "Next photo", photo: "Photo", of: "of", viewer: "Photo viewer" },
  es: { open: "Abrir foto", close: "Cerrar", prev: "Foto anterior", next: "Foto siguiente", photo: "Foto", of: "de", viewer: "Visor de fotos" },
};

const captionOf = (p: PublicPhoto, locale: Lang) => (locale === "es" ? p.captionEs || p.caption : p.caption) || null;

/** Thumbnail grid (lazy-loaded) + lightbox with keyboard (arrows, Esc), swipe, captions in the visitor's language. */
export default function PhotoGallery({ photos, locale }: { photos: PublicPhoto[]; locale: Lang }) {
  const t = T[locale];
  const [index, setIndex] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const n = photos.length;

  const close = useCallback(() => {
    setIndex(null);
    opener.current?.focus();
  }, []);
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + n) % n)), [n]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab") {
        // keep focus inside the dialog: it has three buttons
        const items = Array.from(document.querySelectorAll<HTMLElement>("[data-lightbox] button"));
        if (items.length === 0) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index === null, close, step]); // eslint-disable-line react-hooks/exhaustive-deps

  // warm the neighbours so next/prev feels instant
  useEffect(() => {
    if (index === null) return;
    [1, -1].forEach((d) => {
      const img = new window.Image();
      img.src = photos[(index + d + n) % n].url;
    });
  }, [index, photos, n]);

  if (n === 0) return null;
  const current = index === null ? null : photos[index];
  const cap = current ? captionOf(current, locale) : null;

  return (
    <>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={(e) => { opener.current = e.currentTarget; setIndex(i); }}
              aria-label={`${t.open} ${i + 1} ${t.of} ${n}${captionOf(p, locale) ? `: ${captionOf(p, locale)}` : ""}`}
              className="block w-full aspect-square overflow-hidden rounded-xl bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.thumbUrl ?? p.url}
                alt={captionOf(p, locale) ?? `${t.photo} ${i + 1} ${t.of} ${n}`}
                width={400}
                height={400}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div
          data-lightbox
          role="dialog"
          aria-modal="true"
          aria-label={t.viewer}
          className="fixed inset-0 z-[100] bg-black flex flex-col"
          onTouchStart={(e) => { const c = e.touches[0]; touch.current = { x: c.clientX, y: c.clientY }; }}
          onTouchEnd={(e) => {
            const s = touch.current; touch.current = null;
            if (!s) return;
            const c = e.changedTouches[0];
            const dx = c.clientX - s.x, dy = c.clientY - s.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
            else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) close();
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white/80 text-sm">
            <span aria-live="polite">{index! + 1} {t.of} {n}</span>
            <button ref={closeBtn} type="button" onClick={close} aria-label={t.close} className="p-2 -mr-2 rounded-full hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-16" onClick={(e) => e.target === e.currentTarget && close()}>
            {n > 1 && (
              <button type="button" onClick={() => step(-1)} aria-label={t.prev} className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.url}
              alt={cap ?? `${t.photo} ${index! + 1} ${t.of} ${n}`}
              className="max-h-full max-w-full object-contain select-none"
              draggable={false}
            />
            {n > 1 && (
              <button type="button" onClick={() => step(1)} aria-label={t.next} className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="px-4 py-4 min-h-[3.5rem] text-center text-white text-sm sm:text-base">{cap}</div>
        </div>
      )}
    </>
  );
}
