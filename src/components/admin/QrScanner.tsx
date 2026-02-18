"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Props {
  eventId: string;
  onScanSuccess: (result: any) => void;
}

export default function QrScanner({ eventId, onScanSuccess }: Props) {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleScan = async (decodedText: string) => {
    // Prevent duplicate scans within 3 seconds
    if (lastScannedRef.current === decodedText) {
      return;
    }
    lastScannedRef.current = decodedText;

    setTimeout(() => {
      lastScannedRef.current = null;
    }, 3000);

    setProcessing(true);

    try {
      const response = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCode: decodedText,
          eventId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `✓ Checked in: ${data.patientName}`,
        });
        onScanSuccess(data);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Check-in failed",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Network error",
      });
    } finally {
      setProcessing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 250,
        },
        handleScan,
        () => {},
      );

      setScanning(true);

      // Force video styling after scanner starts
      setTimeout(() => {
        const videoElement = document.querySelector(
          "#qr-reader video",
        ) as HTMLVideoElement;
        if (videoElement) {
          videoElement.style.width = "100%";
          videoElement.style.height = "auto";
        }
      }, 100);
    } catch (err) {
      console.error("Scanner error:", err);
      setMessage({ type: "error", text: "Failed to start camera" });
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error("Stop error:", err);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Scanner Container */}
      <div className="bg-white border-2 border-neutral-200 ">
        {/* Placeholder shown when not scanning */}
        {!scanning && (
          <div className="aspect-square flex flex-col items-center justify-center p-8 bg-neutral-50">
            <Camera className="w-16 h-16 text-neutral-300 mb-4" />
            <p className="text-neutral-500 text-sm mb-6 text-center">
              Click the button below to start scanning QR codes
            </p>
            <button
              onClick={startScanning}
              className="px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Start Camera
            </button>
          </div>
        )}

        {/* QR Reader - Always in DOM but visibility controlled */}
        <div
          id="qr-reader"
          style={{
            display: scanning ? "block" : "none",
          }}
        />
      </div>

      {/* Controls */}
      {scanning && (
        <button
          onClick={stopScanning}
          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 text-neutral-700 font-semibold hover:border-neutral-400 transition-colors"
        >
          Stop Scanning
        </button>
      )}

      {/* Processing Indicator */}
      {processing && (
        <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-primary-50 border border-primary-200">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-primary">
            Processing...
          </span>
        </div>
      )}

      {/* Message */}
      {message && !processing && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}
    </div>
  );
}
