"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import MergeDialog from "@/components/admin/merge/MergeDialog";

interface Person { id: string; name: string; email: string | null; phone: string | null; hasHousehold: boolean; boardRoles: string[]; createdAt: string }
interface Pair { aId: string; bId: string; reasons: string[]; a: Person; b: Person }

const WHY: Record<string, string> = { flagged: "Flagged at registration", same_email: "Same email", same_phone: "Same phone" };
const btn = "px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50";

function PersonCell({ p }: { p: Person }) {
  return (
    <div className="text-sm">
      <Link className="font-semibold underline" href={`/admin/patients/${p.id}`}>{p.name}</Link>
      {p.boardRoles.length > 0 && <span className="ml-2 text-xs text-neutral-500">{p.boardRoles.join(", ")}</span>}
      <p className="text-neutral-600">{p.email ?? "no email"} · {p.phone ?? "no phone"}</p>
      <p className="text-xs text-neutral-500">{p.hasHousehold ? "Household" : "Board record only"} · {new Date(p.createdAt).toLocaleDateString("en-US")}</p>
    </div>
  );
}

export default function DuplicatesClient() {
  const [pairs, setPairs] = useState<Pair[] | null>(null);
  const [merging, setMerging] = useState<Pair | null>(null);
  const load = useCallback(async () => {
    const res = await fetch("/api/admin/duplicates");
    if (res.ok) setPairs((await res.json()).pairs);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function dismiss(p: Pair) {
    const res = await fetch("/api/admin/duplicates/dismiss", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aId: p.aId, bId: p.bId }) });
    if (!res.ok) return toast.error("Could not dismiss");
    toast.success("Marked as not a duplicate"); load();
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-neutral-900">Possible duplicates</h1>
        <p className="text-neutral-600 mt-1">Records flagged at registration, or sharing an email or phone number. “Not a duplicate” keeps a pair off this list for good. Merging shows a preview first.</p>
      </div>
      {pairs === null ? <p className="text-sm text-neutral-500">Loading…</p> : pairs.length === 0 ? <p className="text-sm text-neutral-500">No possible duplicates.</p> : (
        <ul className="space-y-3">
          {pairs.map((p) => (
            <li key={`${p.aId}|${p.bId}`} className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap gap-2">{p.reasons.map((r) => <span key={r} className="text-xs font-semibold bg-amber-100 text-amber-900 rounded-full px-2 py-1">{WHY[r] ?? r}</span>)}</div>
              <div className="grid sm:grid-cols-2 gap-4"><PersonCell p={p.a} /><PersonCell p={p.b} /></div>
              <div className="flex gap-2">
                <button className={`${btn} bg-neutral-900 text-white`} onClick={() => setMerging(p)}>Review and merge</button>
                <button className={`${btn} border border-neutral-300`} onClick={() => dismiss(p)}>Not a duplicate</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {merging && <MergeDialog aId={merging.aId} bId={merging.bId} onClose={() => setMerging(null)} onDone={() => { setMerging(null); load(); }} />}
    </div>
  );
}
