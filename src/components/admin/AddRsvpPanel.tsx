"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, UserPlus } from "lucide-react";

interface Hit { id: string; name: string; email: string | null; phone: string | null }

/** Board "Add RSVP" for phone call-ins: pick an existing patient (or create one first). */
export default function AddRsvpPanel({ eventId, preselect }: { eventId: string; preselect?: Hit }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Hit[]>([]);
  const [picked, setPicked] = useState<Hit | null>(preselect ?? null);
  const [party, setParty] = useState(1);
  const [busy, setBusy] = useState(false);

  const search = async (v: string) => {
    setQ(v);
    if (v.trim().length < 2) return setResults([]);
    const res = await fetch(`/api/admin/patients/search?q=${encodeURIComponent(v)}`);
    setResults((await res.json()).patients ?? []);
  };

  const add = async () => {
    if (!picked) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/rsvps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: picked.id, partySize: party }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? "Could not add RSVP"); return; }
      toast.success(data.created ? "RSVP added" : "RSVP updated");
      setPicked(null); setQ(""); setParty(1);
      router.replace(`/admin/events/${eventId}/attendees`);
      router.refresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-8">
      <h2 className="font-display font-bold text-neutral-900 text-lg mb-3 flex items-center gap-2">
        <UserPlus className="w-5 h-5" /> Add RSVP (phone call-in)
      </h2>
      {picked ? (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-sm font-semibold">{picked.name}</p>
            <p className="text-xs text-neutral-500">{picked.email ?? picked.phone ?? ""}</p>
          </div>
          <div>
            <label className="block text-xs text-neutral-500">People</label>
            <input type="number" min={1} max={30} value={party} onChange={(e) => setParty(Number(e.target.value))}
              className="w-20 px-2 py-1.5 border border-neutral-300 rounded-lg text-sm" />
          </div>
          <button onClick={add} disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Add RSVP
          </button>
          <button onClick={() => setPicked(null)} className="text-sm text-neutral-500 hover:underline">Change</button>
        </div>
      ) : (
        <div className="relative max-w-md">
          <input className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm" value={q}
            onChange={(e) => search(e.target.value)} placeholder="Search patient by name, email or phone" />
          {results.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg">
              {results.map((p) => (
                <button key={p.id} className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-sm"
                  onClick={() => { setPicked(p); setResults([]); }}>
                  <span className="font-semibold">{p.name}</span>{" "}
                  <span className="text-neutral-500">{p.email ?? p.phone ?? ""}</span>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-neutral-500 mt-2">
            Not in the list?{" "}
            <Link className="text-primary underline" href={`/admin/patients/new?eventId=${eventId}`}>
              Create the patient first
            </Link>
            , then you'll return here.
          </p>
        </div>
      )}
    </div>
  );
}
