"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Download, X, ExternalLink } from "lucide-react";

interface Props {
  flyerEnUrl?: string | null;
  flyerEsUrl?: string | null;
  lang: "en" | "es";
}

type FlyerLang = "en" | "es";

/** Flyers are uploaded as-is, so decide by file extension (query string ignored). */
const isPdf = (url: string) => /\.pdf$/i.test(url.split(/[?#]/)[0]);

const copy = {
  en: {
    title: "Event Flyers",
    viewEnglish: "View English Flyer",
    viewSpanish: "View Spanish Flyer",
    english: "English Flyer",
    spanish: "Volante en Español",
    download: "Download",
    fullSize: "Open full size",
    viewPdf: "View PDF",
    close: "Close",
    pdfNote: "This flyer is a PDF.",
    language: "Flyer language",
  },
  es: {
    title: "Volantes del Evento",
    viewEnglish: "Ver Volante en Inglés",
    viewSpanish: "Ver Volante en Español",
    english: "English Flyer",
    spanish: "Volante en Español",
    download: "Descargar",
    fullSize: "Abrir tamaño completo",
    viewPdf: "Ver PDF",
    close: "Cerrar",
    pdfNote: "Este volante es un PDF.",
    language: "Idioma del volante",
  },
};

/** True under Tailwind's `sm` breakpoint (640px). Tracked from mount so it is already right when the modal opens. */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

/** Locks page scroll while open and restores the exact scroll position on close. */
function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      Object.assign(body.style, prev);
      // "instant" so a site-wide smooth-scroll setting can't animate (or skip) the restore
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" as ScrollBehavior });
    };
  }, [active]);
}

export default function FlyerPreview({ flyerEnUrl, flyerEsUrl, lang }: Props) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<FlyerLang>("en");
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const isMobile = useIsMobile();
  useBodyScrollLock(open);

  const urls: Record<FlyerLang, string | null | undefined> = { en: flyerEnUrl, es: flyerEsUrl };
  const both = Boolean(flyerEnUrl && flyerEsUrl);
  const url = urls[current] ?? null;
  const t = copy[lang];

  const close = useCallback(() => {
    setOpen(false);
    openerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!flyerEnUrl && !flyerEsUrl) return null;

  const show = (language: FlyerLang, opener: HTMLElement) => {
    openerRef.current = opener;
    setCurrent(language);
    setOpen(true);
  };

  /** Cross-origin `download` attributes are ignored, so fetch the file and save the blob; fall back to a new tab. */
  const download = async () => {
    if (!url) return;
    const name = `flyer-${current}${isPdf(url) ? ".pdf" : ""}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const pdf = url ? isPdf(url) : false;
  const btn =
    "inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg font-semibold text-sm transition-colors";

  return (
    <>
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-8">
        <h2 className="text-xl font-display font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {t.title}
        </h2>
        <div className="flex flex-wrap gap-3">
          {flyerEnUrl && (
            <button
              onClick={(e) => show("en", e.currentTarget)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4" />
              {t.viewEnglish}
            </button>
          )}
          {flyerEsUrl && (
            <button
              onClick={(e) => show("es", e.currentTarget)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4" />
              {t.viewSpanish}
            </button>
          )}
        </div>
      </div>

      {open && url && (
        // Backdrop: tap/click outside the panel closes. Full-screen (dvh + safe areas) on mobile.
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current === "en" ? t.english : t.spanish}
          className="fixed inset-0 z-50 bg-black sm:bg-black/70 sm:flex sm:items-center sm:justify-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          {/* Close: always visible, >=44x44, pinned top-right above everything */}
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label={t.close}
            className="fixed z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white ring-1 ring-white/30 hover:bg-black/90 sm:hidden"
            style={{
              top: "max(0.5rem, env(safe-area-inset-top))",
              right: "max(0.5rem, env(safe-area-inset-right))",
            }}
          >
            <X className="h-6 w-6" />
          </button>

          <div
            className="flex h-[100dvh] w-full flex-col bg-black sm:h-[90vh] sm:max-w-5xl sm:rounded-2xl sm:bg-white sm:overflow-hidden"
            style={
              isMobile
                ? {
                    paddingTop: "env(safe-area-inset-top)",
                    paddingBottom: "env(safe-area-inset-bottom)",
                    paddingLeft: "env(safe-area-inset-left)",
                    paddingRight: "env(safe-area-inset-right)",
                  }
                : undefined
            }
            onClick={(e) => {
              // the gaps around the image count as backdrop on mobile
              if (isMobile && e.target === e.currentTarget) close();
            }}
          >
            {/* Header / actions */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/15 p-2 pr-16 sm:border-neutral-200 sm:p-4 sm:pr-4">
              {both && (
                <div role="group" aria-label={t.language} className="inline-flex overflow-hidden rounded-lg ring-1 ring-white/30 sm:ring-neutral-300">
                  {(["en", "es"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      aria-pressed={current === l}
                      onClick={() => setCurrent(l)}
                      className={`min-h-[44px] min-w-[48px] px-3 text-sm font-semibold transition-colors ${
                        current === l
                          ? "bg-primary text-white"
                          : "bg-transparent text-white hover:bg-white/10 sm:text-neutral-700 sm:hover:bg-neutral-100"
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
              <h3 className="hidden font-display font-bold text-neutral-900 sm:block sm:flex-1">
                {current === "en" ? t.english : t.spanish}
              </h3>
              <div className="ml-auto flex flex-wrap items-center gap-2 sm:ml-0">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${btn} border border-white/40 text-white hover:bg-white/10 sm:border-neutral-300 sm:text-neutral-700 sm:hover:bg-neutral-50`}
                >
                  <ExternalLink className="h-4 w-4" />
                  {t.fullSize}
                </a>
                <button
                  type="button"
                  onClick={download}
                  className={`${btn} bg-primary text-white hover:bg-primary-600`}
                >
                  <Download className="h-4 w-4" />
                  {t.download}
                </button>
                <button
                  type="button"
                  onClick={close}
                  aria-label={t.close}
                  className="hidden h-11 w-11 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 sm:inline-flex"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Flyer: fits the space left under the header, never cropped or stretched.
                No touch-action override, so pinch-to-zoom keeps working. */}
            <div
              className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black sm:bg-neutral-100"
              onClick={(e) => {
                if (isMobile && e.target === e.currentTarget) close();
              }}
            >
              {pdf ? (
                isMobile ? (
                  <div className="flex flex-col items-center gap-4 p-6 text-center text-white">
                    <FileText className="h-12 w-12 opacity-80" />
                    <p className="text-sm opacity-80">{t.pdfNote}</p>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${btn} bg-primary px-6 text-white hover:bg-primary-600`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t.viewPdf}
                    </a>
                  </div>
                ) : (
                  <iframe src={url} title={current === "en" ? t.english : t.spanish} className="h-full w-full" />
                )
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={current === "en" ? t.english : t.spanish}
                  className="h-full w-full object-contain"
                  onClick={(e) => {
                    // object-contain letterboxes inside the <img> box: taps on that dark gap count as the backdrop (mobile)
                    if (!isMobile) return;
                    const img = e.currentTarget;
                    const r = img.getBoundingClientRect();
                    if (!img.naturalWidth || !img.naturalHeight) return;
                    const k = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
                    const w = img.naturalWidth * k;
                    const h = img.naturalHeight * k;
                    const dx = Math.abs(e.clientX - (r.left + r.width / 2));
                    const dy = Math.abs(e.clientY - (r.top + r.height / 2));
                    if (dx > w / 2 || dy > h / 2) close();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
