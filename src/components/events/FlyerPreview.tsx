"use client";

import { useState } from "react";
import { FileText, Download, X, ExternalLink } from "lucide-react";

interface Props {
  flyerEnUrl?: string | null;
  flyerEsUrl?: string | null;
  lang: "en" | "es";
}

export default function FlyerPreview({ flyerEnUrl, flyerEsUrl, lang }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLang, setPreviewLang] = useState<"en" | "es">("en");

  const handlePreview = (url: string, language: "en" | "es") => {
    setPreviewUrl(url);
    setPreviewLang(language);
    setShowModal(true);
  };

  const handleDownload = () => {
    if (!previewUrl) return;

    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `flyer-${previewLang}.pdf`;
    link.click();
  };

  if (!flyerEnUrl && !flyerEsUrl) {
    return null;
  }

  const t = {
    en: {
      title: "Event Flyers",
      viewEnglish: "View English Flyer",
      viewSpanish: "View Spanish Flyer",
      download: "Download",
      openNewTab: "Open in New Tab",
      close: "Close",
    },
    es: {
      title: "Volantes del Evento",
      viewEnglish: "Ver Volante en Inglés",
      viewSpanish: "Ver Volante en Español",
      download: "Descargar",
      openNewTab: "Abrir en Nueva Pestaña",
      close: "Cerrar",
    },
  }[lang];

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
              onClick={() => handlePreview(flyerEnUrl, "en")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4" />
              {t.viewEnglish}
            </button>
          )}
          {flyerEsUrl && (
            <button
              onClick={() => handlePreview(flyerEsUrl, "es")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4" />
              {t.viewSpanish}
            </button>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showModal && previewUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h3 className="font-display font-bold text-neutral-900">
                {previewLang === "en" ? "English Flyer" : "Volante en Español"}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t.download}
                </button>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t.openNewTab}
                </a>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="Flyer Preview"
              />
            </div>

            {/* Mobile Close Button */}
            <div className="md:hidden p-4 border-t border-neutral-200">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 rounded-lg bg-neutral-200 text-neutral-900 font-semibold hover:bg-neutral-300 transition-colors"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
