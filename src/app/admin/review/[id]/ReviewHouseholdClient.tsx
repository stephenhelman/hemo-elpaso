"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { HOLD_REASONS, HOLD_REASON_LABEL } from "@/lib/review/rules";
import type { ReviewerHousehold } from "@/lib/review/reviewer";

const btn = "px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50";
const card = "rounded-2xl border border-neutral-200 bg-white p-5 space-y-2";
const STATUS: Record<string, string> = { pending_review: "Pending review", approved: "Approved", on_hold: "On hold" };
const AGE: Record<string, string> = { "0_5": "0 to 5", "6_12": "6 to 12", "13_17": "13 to 17", "18_plus": "18 or older" };

export default function ReviewHouseholdClient({ id }: { id: string }) {
  const [h, setH] = useState<ReviewerHousehold | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [holding, setHolding] = useState(false);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [consent, setConsent] = useState({ data: false, adult: false, media: false });

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/review/${id}`);
    setH(res.ok ? (await res.json()).household : null);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function change(status: string, why?: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/review/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reason: why }) });
    setBusy(false);
    if (!res.ok) return toast.error("Could not change the status");
    toast.success("Review status updated"); setHolding(false); load();
  }
  async function confirmAdult(memberId: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/review/${id}/members/${memberId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "phone_confirm", consentData: consent.data, adult: consent.adult, consentMedia: consent.media }) });
    setBusy(false);
    if (!res.ok) return toast.error("Could not confirm. Both required boxes must be checked.");
    toast.success("Adult confirmed by phone"); setConfirming(null); setConsent({ data: false, adult: false, media: false }); load();
  }

  if (h === undefined) return <div className="p-8 text-sm text-neutral-500">Loading…</div>;
  if (h === null) return <div className="p-8 text-sm text-neutral-600">Household not found. <Link className="underline" href="/admin/review">Back to review</Link></div>;
  return (
    <div className="p-4 md:p-8 space-y-5 max-w-3xl">
      <Link className="text-sm underline text-neutral-600" href="/admin/review">Back to registration review</Link>
      <h1 className="text-3xl font-display font-bold text-neutral-900">{h.name}</h1>

      <div className={card}>
        <h2 className="font-semibold text-neutral-900">Contact</h2>
        <p className="text-sm text-neutral-700">{h.email ?? "no email"} · {h.phone ?? "no phone"} · prefers {h.language === "es" ? "Spanish" : "English"}</p>
        <p className="text-sm text-neutral-700">
          {h.address ? (h.address.unstructured ? <>Address (one line, fix on a call): <span className="font-mono">{h.address.line1}</span></> : [h.address.line1, h.address.line2, `${h.address.city ?? ""}, ${h.address.state ?? ""} ${h.address.zip ?? ""}`].filter(Boolean).join(", ")) : "No address"}
        </p>
        <p className="text-xs text-neutral-500">Registered {new Date(h.createdAt).toLocaleDateString("en-US")} · {h.source === "phone" ? "by phone" : "online"}</p>
        <p className="text-sm text-neutral-700">Affected member listed: <strong>{h.affectedMemberListed ? "yes" : "no"}</strong></p>
      </div>

      <div className={card} id="members">
        <h2 className="font-semibold text-neutral-900">People in the household</h2>
        {h.members.length === 0 ? <p className="text-sm text-neutral-600">No one else listed.</p> : (
          <ul className="divide-y divide-neutral-100">
            {h.members.map((m) => (
              <li key={m.id} className="py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>{[m.firstName, m.lastName].filter(Boolean).join(" ") || "—"} · {m.relationship.replace("_", "/")} · {AGE[m.ageGroup] ?? m.ageGroup}{m.status === "pending" ? " · waiting to confirm" : m.status === "confirmed" ? " · confirmed" : ""}</span>
                  {m.status === "pending" && m.ageGroup === "18_plus" && <button className={`${btn} border border-neutral-300`} onClick={() => setConfirming(confirming === m.id ? null : m.id)}>Confirm by phone</button>}
                </div>
                {confirming === m.id && (
                  <div className="mt-2 rounded-lg bg-neutral-50 p-3 space-y-2">
                    <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={consent.adult} onChange={(e) => setConsent({ ...consent, adult: e.target.checked })} />They confirmed on the phone that they are 18 or older. *</label>
                    <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={consent.data} onChange={(e) => setConsent({ ...consent, data: e.target.checked })} />They agree that HOEP may keep their information and contact them. *</label>
                    <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={consent.media} onChange={(e) => setConsent({ ...consent, media: e.target.checked })} />They agree to photos and video (optional).</label>
                    <button className={`${btn} bg-neutral-900 text-white`} disabled={busy || !consent.adult || !consent.data} onClick={() => confirmAdult(m.id)}>Record confirmation</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={card}>
        <h2 className="font-semibold text-neutral-900">Review</h2>
        <p className="text-sm text-neutral-700">{STATUS[h.status] ?? h.status}{h.status === "on_hold" && h.holdReason ? `: ${HOLD_REASON_LABEL[h.holdReason as keyof typeof HOLD_REASON_LABEL]?.en ?? h.holdReason}` : ""}</p>
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
            {h.status !== "approved" && <button className={`${btn} bg-primary text-white`} disabled={busy} onClick={() => change("approved")}>Approve</button>}
            <button className={`${btn} border border-neutral-300`} onClick={() => setHolding(true)}>{h.status === "on_hold" ? "Change hold reason" : "Hold…"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
