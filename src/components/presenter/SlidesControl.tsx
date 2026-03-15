"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  Loader2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

interface Presentation {
  id: string;
  currentSlide: number;
  isLive: boolean;
  slideUrlsEn: string[];
  slideUrlsEs: string[];
  totalSlidesEn: number;
  totalSlidesEs: number;
  originalFileUrlEn?: string | null;
  originalFileNameEn?: string | null;
  originalFileUrlEs?: string | null;
  originalFileNameEs?: string | null;
  conversionStatusEn?: string | null;
  conversionStatusEs?: string | null;
}

interface Props {
  token: string;
  presentation: Presentation | null;
  onUpdate: (p: Presentation) => void;
}

type LangUploadState = {
  state: "idle" | "uploading" | "converting" | "done" | "error";
  fileName: string;
  progress: number | null;
  error: string;
};

const ACCEPTED_EXTENSIONS = ".pdf,.pptx,.ppt,.key,.odp,.jpg,.jpeg,.png,.webp";

const defaultLangState: LangUploadState = {
  state: "idle",
  fileName: "",
  progress: null,
  error: "",
};

export default function SlidesControl({
  token,
  presentation,
  onUpdate,
}: Props) {
  const [en, setEn] = useState<LangUploadState>({
    ...defaultLangState,
    state:
      presentation?.conversionStatusEn === "processing" ? "converting" : "idle",
    fileName: presentation?.originalFileNameEn ?? "",
  });
  const [es, setEs] = useState<LangUploadState>({
    ...defaultLangState,
    state:
      presentation?.conversionStatusEs === "processing" ? "converting" : "idle",
    fileName: presentation?.originalFileNameEs ?? "",
  });

  const [advancing, setAdvancing] = useState(false);
  const pollEnRef = useRef<NodeJS.Timeout | null>(null);
  const pollEsRef = useRef<NodeJS.Timeout | null>(null);
  const fileEnRef = useRef<HTMLInputElement>(null);
  const fileEsRef = useRef<HTMLInputElement>(null);

  // Resume polling if page loads mid-conversion
  useEffect(() => {
    if (presentation?.conversionStatusEn === "processing") startPolling("en");
    if (presentation?.conversionStatusEs === "processing") startPolling("es");
    return () => {
      if (pollEnRef.current) clearInterval(pollEnRef.current);
      if (pollEsRef.current) clearInterval(pollEsRef.current);
    };
  }, []);

  const setLang = (lang: "en" | "es", updates: Partial<LangUploadState>) => {
    if (lang === "en") setEn((p) => ({ ...p, ...updates }));
    else setEs((p) => ({ ...p, ...updates }));
  };

  const getLang = (lang: "en" | "es") => (lang === "en" ? en : es);

  const startPolling = (lang: "en" | "es") => {
    const pollRef = lang === "en" ? pollEnRef : pollEsRef;
    if (pollRef.current) clearInterval(pollRef.current);
    setLang(lang, { state: "converting" });

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/presenter/${token}/slides/status?lang=${lang}`,
        );
        const data = await res.json();

        if (data.status === "done") {
          clearInterval(pollRef.current!);
          onUpdate(data.presentation);
          setLang(lang, { state: "done" });
          toast.success(
            `${lang === "en" ? "English" : "Spanish"} slides ready — ${data.presentation[lang === "en" ? "totalSlidesEn" : "totalSlidesEs"]} slides`,
          );
        } else if (data.status === "error") {
          clearInterval(pollRef.current!);
          setLang(lang, {
            state: "error",
            error: data.error ?? "Conversion failed",
          });
        } else if (data.progress !== undefined) {
          setLang(lang, { progress: data.progress });
        }
      } catch {
        // Keep polling on transient errors
      }
    }, 3000);
  };

  const handleFileSelect = async (
    lang: "en" | "es",
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "webp"].includes(ext ?? "");
    const isPresentation = ["pdf", "pptx", "ppt", "key", "odp"].includes(
      ext ?? "",
    );

    if (!isImage && !isPresentation) {
      toast.error("Unsupported file type");
      return;
    }

    setLang(lang, {
      state: "uploading",
      fileName: file.name,
      error: "",
      progress: null,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/presenter/${token}/slides/upload?lang=${lang}`,
        { method: "POST", body: formData },
      );

      const data = await res.json();

      if (!res.ok) {
        setLang(lang, { state: "error", error: data.error || "Upload failed" });
        return;
      }

      if (data.status === "done") {
        onUpdate(data.presentation);
        setLang(lang, { state: "done" });
        toast.success(`${lang === "en" ? "English" : "Spanish"} slide ready`);
      } else if (data.status === "processing") {
        startPolling(lang);
      }
    } catch (err: any) {
      setLang(lang, { state: "error", error: err.message || "Upload failed" });
    } finally {
      const ref = lang === "en" ? fileEnRef : fileEsRef;
      if (ref.current) ref.current.value = "";
    }
  };

  const handleToggleLive = async () => {
    try {
      const res = await fetch(`/api/presenter/${token}/slides`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-live" }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.presentation);
      }
    } catch {
      toast.error("Failed to toggle");
    }
  };

  const handleSlideAction = async (
    action: "next" | "prev" | "goto",
    slideIndex?: number,
  ) => {
    if (!presentation) return;
    setAdvancing(true);
    try {
      const res = await fetch(`/api/presenter/${token}/slides`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, slideIndex }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.presentation);
      }
    } catch {
      toast.error("Failed to advance slide");
    } finally {
      setAdvancing(false);
    }
  };

  const hasAnySlides =
    (presentation?.totalSlidesEn ?? 0) > 0 ||
    (presentation?.totalSlidesEs ?? 0) > 0;

  const isAnyConverting =
    en.state === "uploading" ||
    en.state === "converting" ||
    es.state === "uploading" ||
    es.state === "converting";

  // Use English slides for preview in control panel (presenter likely has English)
  const previewUrls =
    (presentation?.slideUrlsEn?.length ?? 0) > 0
      ? presentation!.slideUrlsEn
      : (presentation?.slideUrlsEs ?? []);

  const currentSlide = presentation?.currentSlide ?? 0;
  const totalSlides = Math.max(
    presentation?.totalSlidesEn ?? 0,
    presentation?.totalSlidesEs ?? 0,
  );

  return (
    <div className="space-y-5">
      {/* Upload zones — side by side */}
      <div className="grid grid-cols-2 gap-3">
        {(["en", "es"] as const).map((lang) => {
          const state = getLang(lang);
          const fileRef = lang === "en" ? fileEnRef : fileEsRef;
          const label = lang === "en" ? "🇺🇸 English" : "🇲🇽 Spanish";
          const slideCount =
            lang === "en"
              ? presentation?.totalSlidesEn
              : presentation?.totalSlidesEs;
          const originalUrl =
            lang === "en"
              ? presentation?.originalFileUrlEn
              : presentation?.originalFileUrlEs;
          const originalName =
            lang === "en"
              ? presentation?.originalFileNameEn
              : presentation?.originalFileNameEs;

          return (
            <div
              key={lang}
              className="bg-neutral-800/60 rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white text-sm">{label}</p>
                {slideCount !== undefined && slideCount > 0 && (
                  <span className="text-xs text-neutral-400">
                    {slideCount} slides
                  </span>
                )}
              </div>

              {/* State display */}
              {state.state === "uploading" || state.state === "converting" ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <p className="text-xs text-neutral-400 text-center">
                    {state.state === "uploading"
                      ? "Uploading..."
                      : "Converting..."}
                  </p>
                  {state.progress !== null && (
                    <div className="w-full">
                      <div className="w-full bg-neutral-700 rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${state.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-neutral-500 text-right mt-1">
                        {state.progress}%
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-neutral-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Don&#39;t close this window
                  </p>
                </div>
              ) : state.state === "done" || (slideCount ?? 0) > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <p className="text-xs truncate">
                      {state.fileName || originalName || "Ready"}
                    </p>
                  </div>
                  {originalUrl && originalName && (
                    <a
                      href={originalUrl}
                      download={originalName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Download original
                    </a>
                  )}
                  <button
                    onClick={() => setLang(lang, { state: "idle" })}
                    className="text-xs text-neutral-500 hover:text-white underline text-left"
                  >
                    Replace
                  </button>
                </div>
              ) : state.state === "error" ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400">{state.error}</p>
                  </div>
                  <button
                    onClick={() => setLang(lang, { state: "idle", error: "" })}
                    className="text-xs text-neutral-500 hover:text-white underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    onChange={(e) => handleFileSelect(lang, e)}
                    className="hidden"
                    id={`slide-upload-${lang}`}
                  />
                  <label
                    htmlFor={`slide-upload-${lang}`}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-neutral-600 cursor-pointer hover:border-primary hover:bg-neutral-700/20 transition-all"
                  >
                    <Upload className="w-5 h-5 text-neutral-500" />
                    <p className="text-xs text-neutral-400 text-center">
                      PDF · PPTX · KEY
                      <br />
                      <span className="text-neutral-600">or image files</span>
                    </p>
                  </label>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Slide controls */}
      {hasAnySlides && !isAnyConverting && (
        <div className="bg-neutral-800/60 rounded-2xl p-5 space-y-4">
          {/* Live toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">Presentation Live</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {presentation?.isLive
                  ? "Attendees see slides in their language"
                  : "Hidden from attendees"}
              </p>
            </div>
            <button
              onClick={handleToggleLive}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                presentation?.isLive
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {presentation?.isLive ? (
                <>
                  <Pause className="w-4 h-4" /> Hide
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Go Live
                </>
              )}
            </button>
          </div>

          {/* Slide counter */}
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>
              🇺🇸 {presentation?.totalSlidesEn ?? 0} slides
              {(presentation?.totalSlidesEn ?? 0) === 0 && (
                <span className="text-amber-500 ml-1">(fallback to ES)</span>
              )}
            </span>
            <span className="font-bold text-white text-base">
              {currentSlide + 1} / {totalSlides}
            </span>
            <span>
              🇲🇽 {presentation?.totalSlidesEs ?? 0} slides
              {(presentation?.totalSlidesEs ?? 0) === 0 && (
                <span className="text-amber-500 ml-1">(fallback to EN)</span>
              )}
            </span>
          </div>

          {/* Preview (English deck, fall back to Spanish) */}
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
            {previewUrls[currentSlide] ? (
              <img
                src={previewUrls[currentSlide]}
                alt={`Slide ${currentSlide + 1}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                No preview
              </div>
            )}
          </div>

          {/* Prev / Next */}
          <div className="flex gap-3">
            <button
              onClick={() => handleSlideAction("prev")}
              disabled={advancing || currentSlide === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-700 text-white font-semibold hover:bg-neutral-600 transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            <button
              onClick={() => handleSlideAction("next")}
              disabled={advancing || currentSlide === totalSlides - 1}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-40"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Thumbnail strip — English deck */}
          {previewUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {previewUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSlideAction("goto", idx)}
                  className={`shrink-0 w-16 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentSlide
                      ? "border-primary"
                      : "border-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Slide ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
