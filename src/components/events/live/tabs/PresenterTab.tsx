"use client";

import { MonitorPlay } from "lucide-react";

interface Presentation {
  currentSlide: number;
  totalSlidesEn: number;
  totalSlidesEs: number;
  slideUrlsEn: string[];
  slideUrlsEs: string[];
  isLive: boolean;
}

interface Props {
  presentation: Presentation | null;
  lang: "en" | "es";
}

export default function PresenterTab({ presentation, lang }: Props) {
  const isEs = lang === "es";

  if (!presentation || !presentation.isLive) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
          <MonitorPlay className="w-7 h-7 text-neutral-500" />
        </div>
        <p className="text-neutral-400 font-semibold mb-1">
          {isEs ? "Presentación no activa" : "No presentation active"}
        </p>
        <p className="text-neutral-600 text-sm">
          {isEs
            ? "El presentador aún no ha comenzado"
            : "The presenter hasn't started yet"}
        </p>
      </div>
    );
  }

  // Serve the attendee's preferred language deck
  // Fall back to the other language if their preferred deck is empty
  const enAvailable = (presentation.slideUrlsEn?.length ?? 0) > 0;
  const esAvailable = (presentation.slideUrlsEs?.length ?? 0) > 0;

  const slideUrls = isEs
    ? esAvailable
      ? presentation.slideUrlsEs // Spanish preferred + available
      : presentation.slideUrlsEn // Spanish preferred but only English exists
    : enAvailable
      ? presentation.slideUrlsEn // English preferred + available
      : presentation.slideUrlsEs; // English preferred but only Spanish exists

  const totalSlides = slideUrls?.length ?? 0;
  const currentUrl = slideUrls?.[presentation.currentSlide];

  // Show a subtle language fallback notice
  const isUsingFallback =
    (isEs && !esAvailable && enAvailable) ||
    (!isEs && !enAvailable && esAvailable);

  if (totalSlides === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
          <MonitorPlay className="w-7 h-7 text-neutral-500" />
        </div>
        <p className="text-neutral-400 font-semibold mb-1">
          {isEs ? "Presentación no activa" : "No presentation active"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Language fallback notice */}
      {isUsingFallback && (
        <div className="px-4 py-2 rounded-xl bg-amber-900/30 border border-amber-700/40 text-center">
          <p className="text-amber-400 text-xs">
            {isEs
              ? "Presentación solo disponible en inglés"
              : "Presentation only available in Spanish"}
          </p>
        </div>
      )}

      {/* Slide display */}
      <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={`Slide ${presentation.currentSlide + 1}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MonitorPlay className="w-12 h-12 text-neutral-700" />
          </div>
        )}

        {/* Slide counter */}
        {totalSlides > 0 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-semibold">
            {presentation.currentSlide + 1} / {totalSlides}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {totalSlides > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {slideUrls.map((url, idx) => (
            <div
              key={idx}
              className={`shrink-0 w-16 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                idx === presentation.currentSlide
                  ? "border-primary"
                  : "border-neutral-700"
              }`}
            >
              <img
                src={url}
                alt={`Slide ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-neutral-500">
        {isEs
          ? "Las diapositivas avanzan automáticamente con el presentador"
          : "Slides advance automatically with the presenter"}
      </p>
    </div>
  );
}
