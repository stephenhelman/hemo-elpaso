"use client";

import { useEffect, useState } from "react";
import { QrCode, Loader2, Monitor, Download } from "lucide-react";

interface Props {
  eventSlug: string;
  eventTitle: string;
}

export default function EventAccessQr({ eventSlug, eventTitle }: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [liveUrl, setLiveUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${eventSlug}/access-qr`)
      .then((res) => res.json())
      .then((data) => {
        setQrCode(data.qrCode);
        setLiveUrl(data.liveUrl);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventSlug]);

  const handleDownload = () => {
    if (!qrCode) return;

    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `event-access-qr-${eventSlug}.png`;
    link.click();
  };

  const handleFullscreen = () => {
    if (!qrCode) return;

    const fullscreenWindow = window.open("", "_blank");
    if (!fullscreenWindow) return;

    fullscreenWindow.document.write(`
      <html>
        <head>
          <title>${eventTitle} - Scan to Join</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
              font-family: system-ui, -apple-system, sans-serif;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: white;
              border-radius: 24px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 {
              color: #8B1538;
              font-size: 48px;
              margin-bottom: 16px;
              font-weight: bold;
            }
            p {
              color: #666;
              font-size: 32px;
              margin-bottom: 40px;
            }
            img {
              width: 600px;
              height: 600px;
            }
            .url {
              color: #999;
              font-size: 20px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${eventTitle}</h1>
            <p>📱 Scan to access live event features</p>
            <img src="${qrCode}" alt="Event Access QR Code" />
            <p class="url">${liveUrl}</p>
          </div>
        </body>
      </html>
    `);
    fullscreenWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="text-center p-8">
        <QrCode className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <p className="text-sm text-neutral-400">Failed to load QR code</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="inline-block p-6 bg-white rounded-2xl border-2 border-neutral-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCode}
            alt="Event Access QR Code"
            className="w-64 h-64 mx-auto"
          />
        </div>
        <p className="text-sm text-neutral-500 mt-4">
          Project this QR code during the event
        </p>
        <p className="text-xs text-neutral-400 mt-1 font-mono">{liveUrl}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleFullscreen}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-600 transition-colors"
        >
          <Monitor className="w-4 h-4" />
          Fullscreen View
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-neutral-300 text-neutral-700 font-semibold hover:border-neutral-400 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
    </div>
  );
}
