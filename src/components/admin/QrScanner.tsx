"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CheckCircle, Loader2, Minus, Plus, XCircle } from "lucide-react";
import { MAX_HEADCOUNT } from "@/lib/checkin-constants";

interface Resolved {
  rsvpId: string;
  name: string;
  partySize: number;
  noPhotos: boolean;
  alreadyCheckedIn: boolean;
}

/**
 * Scan the attendee's QR (payload = raw check-in token), show who it is, a
 * NO PHOTOS badge when media consent isn't granted, and confirm check-in with
 * an editable headcount.
 */
export default function QrScanner({ eventId, onScanSuccess }: { eventId: string; onScanSuccess: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [headcount, setHeadcount] = useState(1);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const pausedRef = useRef(false);
  const lastRef = useRef<string | null>(null);

  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}); }, []);

  const showFlash = (ok: boolean, text: string) => {
    setFlash({ ok, text });
    setTimeout(() => setFlash(null), 3000);
  };

  const onDecode = async (decoded: string) => {
    if (pausedRef.current || lastRef.current === decoded) return;
    pausedRef.current = true; // one scan at a time until confirmed/cancelled
    lastRef.current = decoded;
    setTimeout(() => (lastRef.current = null), 3000);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/checkin/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, token: decoded }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showFlash(false, data.error ?? "Scan failed"); pausedRef.current = false; return; }
      if (data.alreadyCheckedIn) { showFlash(false, `Already checked in: ${data.name}`); pausedRef.current = false; return; }
      setResolved(data);
      setHeadcount(data.partySize);
    } catch {
      showFlash(false, "Network error");
      pausedRef.current = false;
    } finally { setBusy(false); }
  };

  const confirm = async () => {
    if (!resolved) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/checkin/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, rsvpId: resolved.rsvpId, headcount }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showFlash(true, `Checked in: ${resolved.name} (${headcount})`); onScanSuccess(); }
      else showFlash(false, data.error ?? "Check-in failed");
    } finally {
      setBusy(false); setResolved(null); pausedRef.current = false;
    }
  };

  const cancel = () => { setResolved(null); pausedRef.current = false; };

  const start = async () => {
    try {
      const q = new Html5Qrcode("qr-reader");
      scannerRef.current = q;
      await q.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, onDecode, () => {});
      setScanning(true);
    } catch {
      showFlash(false, "Could not start the camera");
    }
  };
  const stop = async () => {
    await scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null; setScanning(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div id="qr-reader" className="w-full overflow-hidden rounded-lg" />
        {!scanning ? (
          <div className="text-center py-6">
            <Camera className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <button onClick={start} className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-600">
              Start scanning
            </button>
          </div>
        ) : (
          <button onClick={stop} className="mt-3 text-sm text-neutral-500 hover:underline">Stop camera</button>
        )}
      </div>

      {flash && (
        <div className={`flex items-center gap-2 rounded-xl p-4 text-sm font-semibold ${flash.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {flash.ok ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {flash.text}
        </div>
      )}

      {resolved && (
        <div className="bg-white rounded-xl border-2 border-primary p-5 space-y-4">
          <div>
            <p className="text-xl font-display font-bold text-neutral-900">{resolved.name}</p>
            <p className="text-sm text-neutral-500">RSVP party of {resolved.partySize}</p>
          </div>
          {resolved.noPhotos && (
            <div className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-white font-extrabold tracking-wider">
              NO PHOTOS
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">How many are here?</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setHeadcount((h) => Math.max(1, h - 1))} className="p-2 rounded-lg border border-neutral-300"><Minus className="w-4 h-4" /></button>
              <input type="number" min={1} max={MAX_HEADCOUNT} value={headcount} onChange={(e) => setHeadcount(Number(e.target.value))}
                className="w-20 text-center px-2 py-2 border border-neutral-300 rounded-lg text-lg font-semibold" />
              <button type="button" onClick={() => setHeadcount((h) => Math.min(MAX_HEADCOUNT, h + 1))} className="p-2 rounded-lg border border-neutral-300"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={confirm} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 disabled:opacity-60">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Confirm check-in
            </button>
            <button onClick={cancel} className="px-5 py-2.5 rounded-lg border border-neutral-300 text-sm font-semibold text-neutral-700">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
