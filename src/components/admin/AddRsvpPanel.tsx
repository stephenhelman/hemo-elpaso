"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, UserPlus } from "lucide-react";
import AttendeeChecklist, { attendeesValid, type AttendeeOption, type AttendeeState } from "@/components/household/AttendeeChecklist";

interface Hit { id: string; name: string; email: string | null; phone: string | null }

/** Board "Add RSVP" for phone call-ins: pick an existing patient (or create one first). */
export default function AddRsvpPanel({ eventId, preselect }: { eventId: string; preselect?: Hit }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Hit[]>([]);
  const [picked, setPicked] = useState<Hit | null>(preselect ?? null);
  const [options, setOptions] = useState<AttendeeOption[]>([]);
  const [primaryName, setPrimaryName] = useState("");
  const [reviewStatus, setReviewStatus] = useState<string>("approved");
  const [sel, setSel] = useState<AttendeeState>({ primary: true, memberIds: [], guests: 0 });

  // Load the household's people for whoever is picked (everyone checked by default).
  useEffect(() => {
    if (!picked) return;
    let live = true;
    fetch(`/api/admin/patients/${picked.id}/rsvp-options?eventId=${eventId}`)
      .then((r) => r.json())
      .then((d) => { if (live && d.options) { setOptions(d.options); setPrimaryName(d.primaryName); setReviewStatus(d.reviewStatus ?? "approved"); setSel(d.selected); } });
    return () => { live = false; };
  }, [picked, eventId]);
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
        body: JSON.stringify({ patientId: picked.id, selection: sel }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? "Could not add RSVP"); return; }
      toast.success(data.created ? "RSVP added" : "RSVP updated");
      setPicked(null); setQ("");
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
        <div className="space-y-4 max-w-lg">
          <div>
            <p className="text-sm font-semibold">{picked.name}</p>
            <p className="text-xs text-neutral-500">{picked.email ?? picked.phone ?? ""}</p>
          </div>
          {reviewStatus !== "approved" && (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" role="alert">
              This household is not approved yet ({reviewStatus === "on_hold" ? "on hold" : "pending review"}). You can still add the RSVP; it will be logged as a board override.
            </p>
          )}
          <AttendeeChecklist locale="en" primaryName={primaryName} options={options} value={sel} onChange={setSel} />
          <div className="flex gap-3 items-center">
            <button onClick={add} disabled={busy || !attendeesValid(sel)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Add RSVP
            </button>
            <button onClick={() => setPicked(null)} className="text-sm text-neutral-500 hover:underline">Change</button>
          </div>
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
