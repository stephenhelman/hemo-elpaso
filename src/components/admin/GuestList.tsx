"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle, Loader2, Search, Undo2 } from "lucide-react";
import CheckInPeople, { checkInHeadcount, defaultCheckInSelection, type CheckInPerson, type CheckInSelection } from "@/components/admin/CheckInPeople";

interface Guest {
  rsvpId: string; name: string; phone: string | null; partySize: number;
  people: CheckInPerson[]; guestCount: number; guestsCheckedIn: number;
  noPhotos: boolean; checkInId: string | null; headcount: number | null;
}

/**
 * Guest-list mode: search this event's RSVPs by name or phone. Each household shows its people with a
 * checkbox (checked by default) and a per-person NO PHOTOS badge; one tap checks in the selected people.
 */
export default function GuestList({ eventId, onChange, initialNoPhotosOnly = false }: { eventId: string; onChange: () => void; initialNoPhotosOnly?: boolean }) {
  const [q, setQ] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [sels, setSels] = useState<Record<string, CheckInSelection>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [noPhotosOnly, setNoPhotosOnly] = useState(initialNoPhotosOnly);

  const load = useCallback(async (query: string) => {
    const res = await fetch(`/api/admin/checkin/guests?eventId=${eventId}&q=${encodeURIComponent(query)}${noPhotosOnly ? "&noPhotos=1" : ""}`);
    if (!res.ok) return;
    const list: Guest[] = (await res.json()).guests ?? [];
    setGuests(list);
    setSels(Object.fromEntries(list.map((g) => [g.rsvpId, defaultCheckInSelection(g.people, g.guestCount, g.guestsCheckedIn)])));
  }, [eventId, noPhotosOnly]);

  useEffect(() => { const t = setTimeout(() => load(q), 250); return () => clearTimeout(t); }, [q, load]);

  const run = async (key: string, req: () => Promise<Response>, ok: string) => {
    setBusy(key);
    try {
      const res = await req();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) toast.error(data.error ?? "Failed"); else toast.success(ok);
      await load(q); onChange();
    } finally { setBusy(null); }
  };

  const checkIn = (g: Guest) =>
    run(g.rsvpId, () => fetch("/api/admin/checkin/confirm", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, rsvpId: g.rsvpId, attendeeIds: sels[g.rsvpId]?.attendeeIds, guests: sels[g.rsvpId]?.guests, manual: true }),
    }), `Checked in ${g.name}`);
  const undoAll = (g: Guest) => run(g.rsvpId, () => fetch(`/api/admin/checkin/confirm?checkInId=${g.checkInId}`, { method: "DELETE" }), "Check-in undone");
  const undoOne = (g: Guest, attendeeId: string) => run(g.rsvpId, () => fetch(`/api/admin/checkin/confirm?attendeeId=${attendeeId}`, { method: "DELETE" }), "Undone");

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or phone"
          className="w-full pl-9 pr-3 py-3 border border-neutral-300 rounded-xl text-base" />
      </div>
      <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer w-fit">
        <input type="checkbox" checked={noPhotosOnly} onChange={(e) => setNoPhotosOnly(e.target.checked)} className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary" />
        Only households with someone marked NO PHOTOS
      </label>
      <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100 max-h-[560px] overflow-y-auto">
        {guests.length === 0 && <p className="p-6 text-center text-neutral-400 text-sm">No RSVPs match.</p>}
        {guests.map((g) => {
          const sel = sels[g.rsvpId] ?? { attendeeIds: [], guests: 0 };
          const pending = g.people.some((p) => !p.checkedIn) || g.guestCount > g.guestsCheckedIn;
          return (
            <div key={g.rsvpId} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900">{g.name}</p>
                  <p className="text-sm text-neutral-500">
                    Party of {g.partySize}{g.phone ? ` · ${g.phone}` : ""}
                    {g.checkInId ? ` · ✔ ${g.headcount} here` : ""}
                  </p>
                </div>
                {g.checkInId && (
                  <button onClick={() => undoAll(g)} disabled={busy === g.rsvpId}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-600 text-sm font-semibold disabled:opacity-60">
                    <Undo2 className="w-4 h-4" /> Undo all
                  </button>
                )}
              </div>
              <CheckInPeople people={g.people} guestCount={g.guestCount} value={sel} busy={busy === g.rsvpId}
                onChange={(v) => setSels((s) => ({ ...s, [g.rsvpId]: v }))} onUndo={(id) => undoOne(g, id)} />
              {pending && (
                <button onClick={() => checkIn(g)} disabled={busy === g.rsvpId || checkInHeadcount(g.people, sel) < 1}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60">
                  {busy === g.rsvpId ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Check in ({checkInHeadcount(g.people, sel)})
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
