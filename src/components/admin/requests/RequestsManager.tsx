"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { SITE_TIMEZONE } from "@/lib/site";
import { DECLINE_LABELS, SELECTABLE_DECLINE_REASONS, type DeclineReason } from "@/lib/rsvp/request-rules";

export interface RequestRow {
  id: string; name: string; status: string; source: string; createdAt: string; language: "en" | "es"; partySize: number;
  matchesTargeting: boolean; phoneOnly: boolean; inPersonBlock: string | null; virtualBlock: string | null; canWaitlist: boolean;
}
export interface DecidedRow { id: string; name: string; status: string; reason: string | null; at: string; partySize: number }

const statusLabel: Record<string, string> = {
  waiting_household_review: "Waiting on household review", pending: "Pending", waitlisted: "Waitlisted",
  confirmed_in_person: "Confirmed in person", confirmed_virtual: "Confirmed virtual", declined: "Declined", withdrawn: "Withdrawn",
};
const statusStyle: Record<string, string> = {
  waiting_household_review: "bg-amber-100 text-amber-800", pending: "bg-blue-100 text-blue-800", waitlisted: "bg-purple-100 text-purple-800",
  confirmed_in_person: "bg-green-100 text-green-800", confirmed_virtual: "bg-green-100 text-green-800", declined: "bg-red-100 text-red-800", withdrawn: "bg-neutral-100 text-neutral-700",
};
const sourceLabel: Record<string, string> = { modal: "Event page", emailed_link: "Emailed link", portal: "Family page", registration: "Registration", board: "Board" };
const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { timeZone: SITE_TIMEZONE });
const act = "rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed";

export default function RequestsManager({ eventId, rows, history, capacity, virtual }: {
  eventId: string; rows: RequestRow[]; history: DecidedRow[];
  capacity: { max: number | null; taken: number; remaining: number | null };
  virtual: { enabled: boolean; recordingsOn: boolean };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [declining, setDeclining] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState<DeclineReason | "">("");

  const run = async (key: string, requestId: string, body: object, done: string) => {
    setBusy(key);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/requests/${requestId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? "Something went wrong"); return; }
      toast.success(done);
      router.refresh();
    } finally { setBusy(null); }
  };

  return (
    <div className="space-y-8">
      {declining && (
        <div role="dialog" aria-modal="true" aria-labelledby="decline-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h2 id="decline-title" className="font-semibold text-neutral-900">Decline {declining.name}?</h2>
            <p className="mt-1 text-sm text-neutral-600">The family gets a kind, general email. It never says the reason. The reason is kept in the log.</p>
            <label className="mt-3 block text-sm font-medium text-neutral-700" htmlFor="decline-reason">Reason</label>
            <select id="decline-reason" value={reason} onChange={(e) => setReason(e.target.value as DeclineReason | "")} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
              <option value="">Choose a reason…</option>
              {SELECTABLE_DECLINE_REASONS.map((c) => <option key={c} value={c}>{DECLINE_LABELS[c]}</option>)}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeclining(null)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700">Cancel</button>
              <button disabled={!reason} onClick={async () => { const d = declining; setDeclining(null); await run(d.id, d.id, { action: "decline", reason }, `${d.name} declined`); }}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Decline</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-neutral-700">
        <span className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2"><strong>In-person spots:</strong> {capacity.max ? `${capacity.remaining} left of ${capacity.max} (${capacity.taken} confirmed)` : `no limit (${capacity.taken} confirmed)`}</span>
        <span className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2"><strong>Virtual:</strong> {!virtual.enabled ? "off for this event" : !virtual.recordingsOn ? "locked until the \"recordings\" feature is on" : "available"}</span>
      </div>

      <section>
        <h2 className="font-semibold text-neutral-900 mb-1">To decide ({rows.length})</h2>
        <p className="text-xs text-neutral-500 mb-2">Oldest first. Confirming creates the invitation and the RSVP. Pending requests never use up in-person spots until you confirm them.</p>
        <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr><th className="px-4 py-3">Household</th><th className="px-4 py-3">Asked</th><th className="px-4 py-3">People</th><th className="px-4 py-3">Flags</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Decide</th></tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No requests waiting.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3 font-medium">{r.name}<span className="ml-2 text-xs uppercase text-neutral-400">{r.language}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap">{day(r.createdAt)}<div className="text-xs text-neutral-400">{sourceLabel[r.source] ?? r.source}</div></td>
                  <td className="px-4 py-3">{r.partySize}</td>
                  <td className="px-4 py-3 space-x-1 space-y-1">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${r.matchesTargeting ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{r.matchesTargeting ? "Matches event" : "Doesn't match event"}</span>
                    {r.phoneOnly && <span className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">Phone only</span>}
                    <span className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">{capacity.remaining === null ? "No capacity limit" : `${capacity.remaining} in-person left`}</span>
                  </td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle[r.status] ?? ""}`}>{statusLabel[r.status] ?? r.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className={`${act} bg-primary text-white`} disabled={busy !== null || !!r.inPersonBlock} title={r.inPersonBlock ?? ""}
                        onClick={() => run(r.id + "ip", r.id, { action: "confirm_in_person" }, `${r.name} confirmed in person`)}>
                        {busy === r.id + "ip" && <Loader2 className="inline w-3 h-3 animate-spin mr-1" />}Confirm in person
                      </button>
                      <button className={`${act} border border-primary text-primary`} disabled={busy !== null || !!r.virtualBlock} title={r.virtualBlock ?? ""}
                        onClick={() => run(r.id + "v", r.id, { action: "confirm_virtual" }, `${r.name} confirmed virtual`)}>
                        {busy === r.id + "v" && <Loader2 className="inline w-3 h-3 animate-spin mr-1" />}Confirm virtual
                      </button>
                      {r.canWaitlist && (
                        <button className={`${act} border border-neutral-300 text-neutral-700`} disabled={busy !== null}
                          onClick={() => run(r.id + "w", r.id, { action: "waitlist" }, `${r.name} waitlisted`)}>Waitlist</button>
                      )}
                      <button className={`${act} border border-red-300 text-red-700`} disabled={busy !== null} onClick={() => { setReason(""); setDeclining({ id: r.id, name: r.name }); }}>Decline</button>
                    </div>
                    {(r.inPersonBlock || r.virtualBlock) && (
                      <p className="mt-1 text-xs text-neutral-500">{r.inPersonBlock && <>In person: {r.inPersonBlock} </>}{r.virtualBlock && <>Virtual: {r.virtualBlock}</>}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-neutral-900 mb-2">Recently decided</h2>
        <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500"><tr><th className="px-4 py-3">Household</th><th className="px-4 py-3">People</th><th className="px-4 py-3">Outcome</th><th className="px-4 py-3">When</th></tr></thead>
            <tbody className="divide-y divide-neutral-100">
              {history.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">Nothing decided yet.</td></tr>}
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-3 font-medium">{h.name}</td><td className="px-4 py-3">{h.partySize}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle[h.status] ?? ""}`}>{statusLabel[h.status] ?? h.status}</span>{h.reason && <span className="ml-2 text-xs text-neutral-500">{DECLINE_LABELS[h.reason as DeclineReason] ?? h.reason}</span>}</td>
                  <td className="px-4 py-3">{day(h.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
