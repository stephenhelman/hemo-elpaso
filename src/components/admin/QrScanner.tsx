"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CheckCircle, XCircle, Loader2, Check, Users } from "lucide-react";

interface FamilyMemberPreview {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  ageTier: string;
}

interface PreviewData {
  rsvpId: string;
  patientName: string;
  attendeeCount: number;
  familyMembers: FamilyMemberPreview[];
}

interface Props {
  eventId: string;
  onScanSuccess: (result: any) => void;
}

export default function QrScanner({ eventId, onScanSuccess }: Props) {
  const [scanning, setScanning] = useState(false);
  const [scanState, setScanState] = useState<"idle" | "loading" | "preview" | "confirming" | "success" | "error">("idle");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
    members?: string[];
  } | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [pendingQrCode, setPendingQrCode] = useState<string | null>(null);
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
    // Don't process if already in preview/confirming
    if (scanState === "preview" || scanState === "confirming") {
      return;
    }
    lastScannedRef.current = decodedText;

    setTimeout(() => {
      lastScannedRef.current = null;
    }, 3000);

    setScanState("loading");

    try {
      const response = await fetch(
        `/api/admin/checkin/preview?qrCode=${encodeURIComponent(decodedText)}&eventId=${encodeURIComponent(eventId)}`,
      );

      const data = await response.json();

      if (response.ok) {
        if (data.alreadyCheckedIn) {
          setScanState("error");
          setMessage({
            type: "error",
            text: `Already checked in: ${data.patientName}`,
          });
          setTimeout(() => {
            setMessage(null);
            setScanState("idle");
          }, 3000);
          return;
        }

        // Pre-check all family members
        setPreviewData(data);
        setConfirmedIds(new Set(data.familyMembers.map((m: FamilyMemberPreview) => m.id)));
        setPendingQrCode(decodedText);
        setScanState("preview");
      } else {
        setScanState("error");
        setMessage({
          type: "error",
          text: data.error || "Check-in preview failed",
        });
        setTimeout(() => {
          setMessage(null);
          setScanState("idle");
        }, 3000);
      }
    } catch {
      setScanState("error");
      setMessage({ type: "error", text: "Network error" });
      setTimeout(() => {
        setMessage(null);
        setScanState("idle");
      }, 3000);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!previewData || !pendingQrCode) return;
    setScanState("confirming");

    try {
      const response = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCode: pendingQrCode,
          eventId,
          confirmedMembershipIds: Array.from(confirmedIds),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const memberNames: string[] = (data.confirmedMembers ?? []).map(
          (m: { firstName: string; lastName: string }) => `${m.firstName} ${m.lastName}`,
        );
        setScanState("success");
        setMessage({
          type: "success",
          text: `Checked in: ${data.patientName}`,
          members: memberNames,
        });
        onScanSuccess(data);
        setTimeout(() => {
          setMessage(null);
          setPreviewData(null);
          setPendingQrCode(null);
          setConfirmedIds(new Set());
          setScanState("idle");
        }, 4000);
      } else {
        setScanState("error");
        setMessage({
          type: "error",
          text: data.error || "Check-in failed",
        });
        setTimeout(() => {
          setMessage(null);
          setPreviewData(null);
          setPendingQrCode(null);
          setConfirmedIds(new Set());
          setScanState("idle");
        }, 3000);
      }
    } catch {
      setScanState("error");
      setMessage({ type: "error", text: "Network error" });
      setTimeout(() => {
        setMessage(null);
        setPreviewData(null);
        setPendingQrCode(null);
        setConfirmedIds(new Set());
        setScanState("idle");
      }, 3000);
    }
  };

  const handleCancelPreview = () => {
    setPreviewData(null);
    setPendingQrCode(null);
    setConfirmedIds(new Set());
    setScanState("idle");
    lastScannedRef.current = null;
  };

  const toggleMember = (id: string) => {
    setConfirmedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  const isProcessing = scanState === "loading" || scanState === "confirming";

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
      {scanning && scanState !== "preview" && scanState !== "confirming" && (
        <button
          onClick={stopScanning}
          className="w-full px-4 py-3 rounded-lg border-2 border-neutral-300 text-neutral-700 font-semibold hover:border-neutral-400 transition-colors"
        >
          Stop Scanning
        </button>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-primary-50 border border-primary-200">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-primary">
            {scanState === "loading" ? "Loading preview..." : "Confirming check-in..."}
          </span>
        </div>
      )}

      {/* Preview Panel */}
      {scanState === "preview" && previewData && (
        <div className="bg-white border-2 border-primary-200 rounded-xl p-4 space-y-3">
          {/* Patient header */}
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="font-bold text-neutral-900">{previewData.patientName}</p>
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {confirmedIds.size + 1} attending
              </p>
            </div>
          </div>

          {/* Member list */}
          <div className="space-y-2">
            {/* Patient row — non-toggleable */}
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-primary-50 border border-primary-200">
              <div className="w-5 h-5 rounded border-2 bg-primary border-primary flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
              <p className="text-sm font-semibold text-neutral-900">You — always included</p>
            </div>

            {/* Family members — toggleable */}
            {previewData.familyMembers.map((member) => {
              const checked = confirmedIds.has(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border-2 transition-all text-left ${
                    checked
                      ? "border-primary bg-primary-50"
                      : "border-neutral-200 hover:border-primary-200 hover:bg-neutral-50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      checked ? "bg-primary border-primary" : "border-neutral-300"
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {member.relationship} · {member.ageTier}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleConfirmCheckIn}
              className="flex-1 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-600 transition-colors"
            >
              Confirm Check-In
            </button>
            <button
              onClick={handleCancelPreview}
              className="px-4 py-2.5 rounded-full border-2 border-neutral-300 text-neutral-700 font-semibold text-sm hover:border-neutral-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success / Error Message */}
      {(scanState === "success" || scanState === "error") && message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
          {message.members && message.members.length > 0 && (
            <ul className="mt-1 ml-7 space-y-0.5">
              {message.members.map((name) => (
                <li key={name} className="text-xs text-green-700">
                  + {name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Inline error during idle/loading (non-preview errors) */}
      {scanState === "error" && !message && (
        <div className="flex items-center gap-2 p-4 rounded-lg border bg-red-50 border-red-200 text-red-800">
          <XCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Check-in failed</span>
        </div>
      )}
    </div>
  );
}
