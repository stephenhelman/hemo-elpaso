"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Adult { id: string; name: string; hasEmail: boolean; hasPhone: boolean; phoneCanText: boolean | null }
const tri = (v: boolean | null) => (v === true ? "yes" : v === false ? "no" : "");

/** Board view of "Also send invitations to" and "Can this number get texts?" (stored only; no texting yet). Names only: no emails or numbers are shown. */
export default function ContactPrefsPanel({ patientId, primary, adults, selected }: {
  patientId: string; primary: { hasPhone: boolean; phoneCanText: boolean | null }; adults: Adult[]; selected: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [ids, setIds] = useState<string[]>(selected);
  const send = async (key: string, body: object) => {
    setBusy(key);
    const res = await fetch(`/api/admin/patients/${patientId}/contact-prefs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok) { toast.success("Saved"); router.refresh(); } else toast.error(data.error ?? "Could not save");
  };
  const eligible = adults.filter((a) => a.hasEmail);
  const textSelect = (key: string, target: string, value: boolean | null) => (
    <select className="rounded-lg border border-neutral-300 px-2 py-1 text-sm" defaultValue={tri(value)} disabled={busy !== null} aria-label="Can this number get texts?"
      onChange={(e) => send(key, { kind: "phone_text", target, canText: e.target.value === "yes" ? true : e.target.value === "no" ? false : null })}>
      <option value="">Not stated</option><option value="yes">Yes</option><option value="no">No</option>
    </select>
  );
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5">
      <h2 className="font-semibold text-neutral-900">Contact preferences</h2>
      <div>
        <p className="text-sm font-medium text-neutral-800">Also send invitations to</p>
        <p className="text-xs text-neutral-500 mb-2">The primary always gets them. Only confirmed adults with an email can be added.</p>
        {eligible.length === 0 ? <p className="text-sm text-neutral-500">No confirmed adult with an email.</p> : (
          <>
            {eligible.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ids.includes(a.id)} onChange={(e) => setIds(e.target.checked ? [...ids, a.id] : ids.filter((x) => x !== a.id))} />{a.name}</label>
            ))}
            <button className="mt-2 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-50" disabled={busy !== null || [...ids].sort().join() === [...selected].sort().join()} onClick={() => send("also", { kind: "also_send", memberIds: ids })}>Save</button>
          </>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-800">Can this number get texts?</p>
        <p className="text-xs text-neutral-500 mb-2">Stored for future texting. We don&apos;t send texts yet.</p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-3"><span className="w-40">Primary contact</span>{primary.hasPhone ? textSelect("p", "primary", primary.phoneCanText) : <span className="text-neutral-500">no phone</span>}</li>
          {adults.map((a) => (
            <li key={a.id} className="flex items-center gap-3"><span className="w-40">{a.name}</span>{a.hasPhone ? textSelect(a.id, a.id, a.phoneCanText) : <span className="text-neutral-500">no phone</span>}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
