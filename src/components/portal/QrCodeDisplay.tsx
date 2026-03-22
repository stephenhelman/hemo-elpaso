"use client";

import { Download, Printer, QrCode } from "lucide-react";
import { qrCodeDisplayTranslation } from "@/translation/rsvp";
import { Lang } from "@/types";

interface Props {
  rsvpId: string;
  eventTitle: string;
  compact?: boolean;
  locale: Lang;
}

export default function QrCodeDisplay({
  rsvpId,
  eventTitle,
  compact,
  locale,
}: Props) {
  const t = qrCodeDisplayTranslation[locale];

  // QR code is generated on the fly by /api/qr/[data]
  // No fetch needed — just use it as an img src directly
  const qrUrl = `/api/qr/RSVP-${rsvpId}`;

  const handleDownload = async () => {
    const res = await fetch(qrUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qr-code-${eventTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${eventTitle}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
            h1 { font-size: 24px; margin-bottom: 8px; }
            p { color: #666; margin-bottom: 24px; }
            img { width: 300px; height: 300px; }
          </style>
        </head>
        <body>
          <h1>${eventTitle}</h1>
          <p>${t.showAtCheckIn}</p>
          <img src="${window.location.origin}${qrUrl}" alt="QR Code" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt={t.checkInQr}
          className="w-16 h-16 rounded-lg border border-neutral-200"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-900">{t.checkInQr}</p>
          <p className="text-xs text-neutral-500">{t.showAtEntrance}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="inline-block p-4 bg-white rounded-2xl border-2 border-neutral-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={t.checkInQr} className="w-48 h-48 mx-auto" />
        </div>
        <p className="text-sm text-neutral-500 mt-3">{t.showAtCheckIn}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          {t.download}
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          {t.print}
        </button>
      </div>
    </div>
  );
}
