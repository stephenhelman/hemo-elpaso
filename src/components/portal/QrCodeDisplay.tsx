"use client";

import { useEffect, useState } from "react";
import { Download, Printer, QrCode, Loader2 } from "lucide-react";

interface Props {
  rsvpId: string;
  eventTitle: string;
  compact?: boolean;
}

export default function QrCodeDisplay({ rsvpId, eventTitle, compact }: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/rsvp/${rsvpId}/qr`)
      .then((res) => res.json())
      .then((data) => {
        setQrCode(data.qrCode);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [rsvpId]);

  const handleDownload = () => {
    if (!qrCode) return;

    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `qr-code-${eventTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
  };

  const handlePrint = () => {
    if (!qrCode) return;

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
          <p>Show this QR code at check-in</p>
          <img src="${qrCode}" alt="QR Code" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="text-center p-6">
        <QrCode className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
        <p className="text-sm text-neutral-400">Failed to load QR code</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrCode}
          alt="Check-in QR Code"
          className="w-16 h-16 rounded-lg border border-neutral-200"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-900">
            Check-in QR Code
          </p>
          <p className="text-xs text-neutral-500">Show at entrance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="inline-block p-4 bg-white rounded-2xl border-2 border-neutral-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCode}
            alt="Check-in QR Code"
            className="w-48 h-48 mx-auto"
          />
        </div>
        <p className="text-sm text-neutral-500 mt-3">
          Show this QR code at check-in
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>
    </div>
  );
}
