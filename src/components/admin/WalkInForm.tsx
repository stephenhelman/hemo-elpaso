"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const input = "w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm";

/** Walk-in at the door: patient + RSVP (manual) + check-in in one step. Consent is verbal (method "phone"). */
export default function WalkInForm({ eventId, onDone }: { eventId: string; onDone: () => void }) {
  const [v, setV] = useState({ firstName: "", lastName: "", phone: "", email: "", headcount: 1, language: "en", consentData: false, consentMedia: false });
  const [busy, setBusy] = useState(false);
  const set = (k: string, val: any) => setV((c) => ({ ...c, [k]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.phone.trim() && !v.email.trim()) return toast.error("Enter a phone number or an email.");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/checkin/walkin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, firstName: v.firstName, lastName: v.lastName, phone: v.phone, email: v.email,
          headcount: v.headcount, language: v.language, consentDataAndContact: v.consentData, consentMedia: v.consentMedia }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.field ? `Check the ${data.field} field` : data.error ?? "Failed"); return; }
      toast.success("Walk-in checked in");
      setV({ firstName: "", lastName: "", phone: "", email: "", headcount: 1, language: "en", consentData: false, consentMedia: false });
      onDone();
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <input className={input} placeholder="First name *" required value={v.firstName} onChange={(e) => set("firstName", e.target.value)} />
        <input className={input} placeholder="Last name *" required value={v.lastName} onChange={(e) => set("lastName", e.target.value)} />
        <input className={input} placeholder="Phone" type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} />
        <input className={input} placeholder="Email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} />
        <div>
          <label className="block text-xs text-neutral-500 mb-1">People here</label>
          <input className={input} type="number" min={1} max={60} value={v.headcount} onChange={(e) => set("headcount", Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Language</label>
          <select className={input} value={v.language} onChange={(e) => set("language", e.target.value)}>
            <option value="en">English</option><option value="es">Español</option>
          </select>
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm text-neutral-700">
        <input type="checkbox" className="mt-1" checked={v.consentData} onChange={(e) => set("consentData", e.target.checked)} />
        They agreed (verbally) to HOEP storing their information and contacting them. Required.
      </label>
      <label className="flex items-start gap-2 text-sm text-neutral-700">
        <input type="checkbox" className="mt-1" checked={v.consentMedia} onChange={(e) => set("consentMedia", e.target.checked)} />
        Optional: they agreed to photos/video.
      </label>
      <button type="submit" disabled={busy || !v.consentData}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Add &amp; check in
      </button>
    </form>
  );
}
