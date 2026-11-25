"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import MergeDialog from "@/components/admin/merge/MergeDialog";
import { HOLD_REASONS, HOLD_REASON_LABEL } from "@/lib/review/rules";
import type { ReviewRow } from "@/lib/review/queue";

const btn = "px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50";
const WHY: Record<string, string> = { flagged: "flagged at registration", same_email: "same email", same_phone: "same phone", same_address: "same address" };

const FLAG_LABEL: Record<string, string> = {
  phoneOnly: "Phone only", noAffectedMember: "No affected member stated", adultsPending: "Adults still pending", possibleDuplicate: "Possible duplicate", unstructuredAddress: "Unstructured address",
};

export default function ReviewClient() {
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [holding, setHolding] = useState<{ id: string; reason: string } | null>(null);
  const [merging, setMerging] = useState<{ aId: string; bId: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/review");
    if (res.ok) { const d = await res.json(); setRows(d.rows); setCanManage(d.canManage === true); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // President/VP open the full patient record; reviewers open the reviewer view (contact details and members only).
  const home = (id: string) => (canManage ? `/admin/patients/${id}` : `/admin/review/${id}`);

  async function flag(aId: string, bId: string) {
    const res = await fetch("/api/admin/review/flag-merge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aId, bId }) });
    if (!res.ok) return toast.error("Could not flag the pair");
    toast.success("Flagged: the President or VP will see it on the Duplicates page");
    load();
  }

  async function change(id: string, status: string, reason?: string) {
    setBusy(id);
    const res = await fetch(`/api/admin/review/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reason }) });
    setBusy(null);
    if (!res.ok) return toast.error("Could not change the status");
    toast.success(status === "approved" ? "Approved" : status === "on_hold" ? "Put on hold" : "Moved back to pending");
    setHolding(null);
    load();
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-neutral-900">Registration review</h1>
        <p className="text-neutral-600 mt-1">New registrations wait here, oldest first. Only approved households are matched for invitations and can RSVP. Pending and on-hold households can still sign in and see their family page. Every change is logged with ids, status and reason code only.</p>
      </div>
      {rows === null ? <p className="text-sm text-neutral-500">Loading…</p> : rows.length === 0 ? <p className="text-sm text-neutral-500">Nothing waiting for review.</p> : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const active = Object.entries(r.flags).filter(([, v]) => v).map(([k]) => k);
            return (
              <li key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <Link className="font-semibold underline" href={home(r.id)}>{r.name}</Link>
                    <p className="text-sm text-neutral-600">{r.email ?? "no email"} · {r.phone ?? "no phone"}</p>
                    <p className="text-xs text-neutral-500">Registered {new Date(r.createdAt).toLocaleDateString("en-US")} · {r.source === "phone" ? "by phone" : "online"}</p>
                  </div>
                  <span className={`text-xs font-semibold rounded-full px-2 py-1 ${r.status === "on_hold" ? "bg-red-100 text-red-900" : "bg-neutral-100 text-neutral-800"}`}>
                    {r.status === "on_hold" ? `On hold: ${HOLD_REASON_LABEL[r.holdReason as keyof typeof HOLD_REASON_LABEL]?.en ?? r.holdReason}` : "Pending review"}
                  </span>
                </div>
                {active.length > 0 && <div className="flex flex-wrap gap-2">{active.map((k) => <span key={k} className="text-xs font-semibold bg-amber-100 text-amber-900 rounded-full px-2 py-1">{FLAG_LABEL[k]}</span>)}</div>}
                {r.unstructuredAddress && <p className="text-sm text-neutral-700">Address on file (one line, fix on a call): <span className="font-mono">{r.unstructuredAddress}</span></p>}
                {r.duplicates.length > 0 && (
                  <ul className="text-sm text-neutral-700 space-y-1">
                    {r.duplicates.map((d) => (
                      <li key={d.id}>May duplicate <Link className="underline" href={home(d.id)}>{d.name}</Link> ({d.reasons.map((x) => WHY[x] ?? x).join(", ")}){" "}
                        {canManage
                          ? <button className="underline font-semibold" onClick={() => setMerging({ aId: r.id, bId: d.id })}>Start merge</button>
                          : <button className="underline font-semibold" onClick={() => flag(r.id, d.id)}>Flag needs merge</button>}</li>
                    ))}
                  </ul>
                )}
                {holding?.id === r.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <select className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm" value={holding.reason} onChange={(e) => setHolding({ id: r.id, reason: e.target.value })}>
                      <option value="">Choose a reason…</option>
                      {HOLD_REASONS.map((c) => <option key={c} value={c}>{HOLD_REASON_LABEL[c].en}</option>)}
                    </select>
                    <button className={`${btn} bg-neutral-900 text-white`} disabled={!holding.reason || busy === r.id} onClick={() => change(r.id, "on_hold", holding.reason)}>Hold</button>
                    <button className={`${btn} border border-neutral-300`} onClick={() => setHolding(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button className={`${btn} bg-primary text-white`} disabled={busy === r.id} onClick={() => change(r.id, "approved")}>Approve</button>
                    <button className={`${btn} border border-neutral-300`} onClick={() => setHolding({ id: r.id, reason: r.holdReason ?? "" })}>{r.status === "on_hold" ? "Change hold reason" : "Hold…"}</button>
                    {r.status === "on_hold" && <button className={`${btn} border border-neutral-300`} disabled={busy === r.id} onClick={() => change(r.id, "pending_review")}>Back to pending</button>}
                    <Link className={`${btn} border border-neutral-300`} href={home(r.id)}>Open household</Link>
                    {r.flags.adultsPending && <Link className={`${btn} border border-neutral-300`} href={`${home(r.id)}#members`}>Confirm an adult by phone</Link>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {merging && <MergeDialog aId={merging.aId} bId={merging.bId} onClose={() => setMerging(null)} onDone={() => { setMerging(null); load(); }} />}
    </div>
  );
}
