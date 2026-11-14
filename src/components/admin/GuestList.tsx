"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle, Loader2, Search, Undo2 } from "lucide-react";

interface Guest {
  rsvpId: string; name: string; phone: string | null; partySize: number;
  noPhotos: boolean; checkInId: string | null; headcount: number | null;
}

/** Guest-list mode: search this event's RSVPs by name or phone, one tap to check in (party size as headcount). */
export default function GuestList({ eventId, onChange }: { eventId: string; onChange: () => void }) {
  const [q, setQ] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (query: string) => {
    const res = await fetch(`/api/admin/checkin/guests?eventId=${eventId}&q=${encodeURIComponent(query)}`);
    if (res.ok) setGuests((await res.json()).guests ?? []);
  }, [eventId]);

  useEffect(() => { const t = setTimeout(() => load(q), 250); return () => clearTimeout(t); }, [q, load]);

  const act = async (g: Guest) => {
    setBusy(g.rsvpId);
    try {
      const res = g.checkInId
        ? await fetch(`/api/admin/checkin/confirm?checkInId=${g.checkInId}`, { method: "DELETE" })
        : await fetch("/api/admin/checkin/confirm", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId, rsvpId: g.rsvpId, headcount: g.partySize, manual: true }),
          });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) toast.error(data.error ?? "Failed");
      else toast.success(g.checkInId ? "Check-in undone" : `Checked in ${g.name}`);
      await load(q); onChange();
    } finally { setBusy(null); }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone"
          className="w-full pl-9 pr-3 py-3 border border-neutral-300 rounded-xl text-base" />
      </div>
      <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100 max-h-[560px] overflow-y-auto">
        {guests.length === 0 && <p className="p-6 text-center text-neutral-400 text-sm">No RSVPs match.</p>}
        {guests.map((g) => (
          <div key={g.rsvpId} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-neutral-900 flex items-center gap-2 flex-wrap">
                {g.name}
                {g.noPhotos && <span className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white">NO PHOTOS</span>}
              </p>
              <p className="text-sm text-neutral-500">
                Party of {g.partySize}{g.phone ? ` · ${g.phone}` : ""}
                {g.checkInId ? ` · ✔ ${g.headcount} here` : ""}
              </p>
            </div>
            <button onClick={() => act(g)} disabled={busy === g.rsvpId}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 ${g.checkInId ? "border border-neutral-300 text-neutral-600" : "bg-green-600 text-white hover:bg-green-700"}`}>
              {busy === g.rsvpId ? <Loader2 className="w-4 h-4 animate-spin" /> : g.checkInId ? <Undo2 className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              {g.checkInId ? "Undo" : "Check in"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
