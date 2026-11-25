"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { HOLD_REASONS, HOLD_REASON_LABEL } from "@/lib/review/rules";

const STATUS_TEXT: Record<string, string> = { pending_review: "Pending review", approved: "Approved", on_hold: "On hold" };
const btn = "px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50";

/** Registration review status for one household (canManageUsers; the API checks it again). Changes are logged with ids, status and reason code only. */
export default function ReviewStatusPanel({ patientId, status, holdReason }: { patientId: string; status: string; holdReason: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [holding, setHolding] = useState(false);

  async function change(next: string, why?: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/review/${patientId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next, reason: why }) });
    setBusy(false);
    if (!res.ok) return toast.error("Could not change the status");
    toast.success("Review status updated");
    setHolding(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6" id="review">
      <h2 className="font-semibold text-neutral-900 mb-1">Registration review</h2>
      <p className="text-sm text-neutral-700 mb-3">
        {STATUS_TEXT[status] ?? status}
        {status === "on_hold" && holdReason ? `: ${HOLD_REASON_LABEL[holdReason as keyof typeof HOLD_REASON_LABEL]?.en ?? holdReason}` : ""}
      </p>
      {holding ? (
        <div className="flex flex-wrap items-center gap-2">
          <select className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Choose a reason…</option>
            {HOLD_REASONS.map((c) => <option key={c} value={c}>{HOLD_REASON_LABEL[c].en}</option>)}
          </select>
          <button className={`${btn} bg-neutral-900 text-white`} disabled={!reason || busy} onClick={() => change("on_hold", reason)}>Hold</button>
          <button className={`${btn} border border-neutral-300`} onClick={() => setHolding(false)}>Cancel</button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {status !== "approved" && <button className={`${btn} bg-primary text-white`} disabled={busy} onClick={() => change("approved")}>Approve</button>}
          {status !== "on_hold" && <button className={`${btn} border border-neutral-300`} onClick={() => setHolding(true)}>Hold…</button>}
          {status === "approved" && <button className={`${btn} border border-neutral-300`} disabled={busy} onClick={() => change("pending_review")}>Back to pending</button>}
        </div>
      )}
    </div>
  );
}
