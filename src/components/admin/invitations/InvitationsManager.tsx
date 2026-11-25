"use client";

import { SITE_TIMEZONE } from "@/lib/site";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, RefreshCw, Send, Trash2, UserPlus } from "lucide-react";
import { diagnosisLabels } from "@/lib/patients/diagnoses";
import type { CallListRow } from "@/lib/rsvp/call-list";
import { CALL_OUTCOMES, CALL_OUTCOME_LABELS, CONFIRM_BLOCK_TEXT, type CallOutcome, type ConfirmBlock } from "@/lib/rsvp/request-rules";
import { REMOVAL_REASONS, REMOVAL_REASON_LABELS, type RemovalReason } from "@/lib/invitations/removal";

export interface InvRow {
  id: string;
  name: string;
  language: "en" | "es";
  familySize: number;
  diagnoses: string[];
  status: string;
  sentAt: string | null;
  origin: "matched" | "request" | "manual";
  attendanceType: "in_person" | "virtual";
}

const statusStyle: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-700",
  sent: "bg-blue-100 text-blue-800",
  rsvp_yes: "bg-green-100 text-green-800",
  rsvp_no: "bg-red-100 text-red-800",
};
const statusLabel: Record<string, string> = {
  pending: "Pending", sent: "Sent", rsvp_yes: "RSVP yes", rsvp_no: "RSVP no",
};

export default function InvitationsManager({
  eventId, rows, callList, canViewPHI, warning = null, virtualLock = null,
}: { eventId: string; rows: InvRow[]; callList: CallListRow[]; canViewPHI: boolean; warning?: string | null; virtualLock?: ConfirmBlock | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState<RemovalReason | "">("");
  const [results, setResults] = useState<{ id: string; name: string; email: string | null; phone: string | null }[]>([]);
  const [fAttend, setFAttend] = useState<"" | "in_person" | "virtual">("");
  const [fOrigin, setFOrigin] = useState<"" | "matched" | "request" | "manual">("");
  const [calling, setCalling] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<CallOutcome | "">("");
  const shown = rows.filter((r) => (!fAttend || r.attendanceType === fAttend) && (!fOrigin || r.origin === fOrigin));
  const pending = rows.filter((r) => r.status === "pending").length;
  const dx = (d: string[]) =>
    d.length ? d.map((x) => (diagnosisLabels as any)[x]?.en ?? x).join(", ") : "—";

  const call = async (key: string, url: string, init?: RequestInit, ok?: (d: any) => string) => {
    setBusy(key);
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? "Something went wrong"); return; }
      if (ok) toast.success(ok(data));
      router.refresh();
    } finally { setBusy(null); }
  };

  const search = async (v: string) => {
    setQ(v);
    if (v.trim().length < 2) return setResults([]);
    const res = await fetch(`/api/admin/patients/search?q=${encodeURIComponent(v)}`);
    setResults((await res.json()).patients ?? []);
  };

  const send = async () => {
    if (!window.confirm(`${warning ? `⚠ ${warning}\n\n` : ""}Send ${pending} invitation email${pending === 1 ? "" : "s"} now? Already-sent invitations are never re-sent.`)) return;
    await call("send", `/api/admin/events/${eventId}/invitations/send`,
      { method: "POST", body: JSON.stringify({ expectedCount: pending }) },
      (d) => `Sent ${d.sent}${d.failed ? `, ${d.failed} FAILED and still pending (${(d.errors ?? []).join(", ") || "unknown error"})` : ""}${d.skipped ? `, ${d.skipped} skipped` : ""}`);
  };

  const switchTo = async (r: InvRow, to: "in_person" | "virtual") =>
    call(r.id + "a", `/api/admin/events/${eventId}/invitations/${r.id}/attendance`, { method: "POST", body: JSON.stringify({ attendanceType: to }) }, () => `${r.name} switched to ${to === "virtual" ? "virtual" : "in person"}`);

  const logCall = async (c: CallListRow) => {
    if (!outcome) return;
    await call(c.patientId + "c", `/api/admin/events/${eventId}/call-log`, { method: "POST", body: JSON.stringify({ patientId: c.patientId, purpose: c.purpose, outcome }) }, () => "Call logged");
    setCalling(null); setOutcome("");
  };

  const confirmRemove = async () => {
    if (!removing || !reason) return;
    const target = removing;
    setRemoving(null);
    await call(target.id, `/api/admin/events/${eventId}/invitations/${target.id}`,
      { method: "POST", body: JSON.stringify({ reason }) }, () => `${target.name} removed`);
  };

  return (
    <div className="space-y-8">
      {removing && (
        <div role="dialog" aria-modal="true" aria-labelledby="remove-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h2 id="remove-title" className="font-semibold text-neutral-900">Remove {removing.name}?</h2>
            <p className="mt-1 text-sm text-neutral-600">
              They won&apos;t be invited to this event, and re-running matching won&apos;t add them back. A reason is required and is recorded with your name.
            </p>
            <label className="mt-3 block text-sm font-medium text-neutral-700" htmlFor="remove-reason">Reason</label>
            <select id="remove-reason" value={reason} onChange={(e) => setReason(e.target.value as RemovalReason | "")}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm">
              <option value="">Choose a reason…</option>
              {REMOVAL_REASONS.map((c) => <option key={c} value={c}>{REMOVAL_REASON_LABELS[c]}</option>)}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setRemoving(null)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700">Cancel</button>
              <button onClick={confirmRemove} disabled={!reason}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Remove</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => call("gen", `/api/admin/events/${eventId}/invitations/generate`, { method: "POST" }, (d) => `${d.added} new match${d.added === 1 ? "" : "es"} added`)}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">
          {busy === "gen" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Re-run matching
        </button>
        <button onClick={send} disabled={busy !== null || pending === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50">
          {busy === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send invitations ({pending})
        </button>
      </div>

      <div className="relative max-w-md">
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          <UserPlus className="inline w-4 h-4 mr-1" /> Add a patient
        </label>
        <input className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm" value={q}
          onChange={(e) => search(e.target.value)} placeholder="Search name, email or phone" />
        {results.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg">
            {results.map((p) => (
              <button key={p.id} className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-sm"
                onClick={async () => {
                  setResults([]); setQ("");
                  await call("add", `/api/admin/events/${eventId}/invitations`,
                    { method: "POST", body: JSON.stringify({ patientId: p.id }) }, () => `${p.name} added`);
                }}>
                <span className="font-semibold">{p.name}</span>{" "}
                <span className="text-neutral-500">{p.email ?? p.phone ?? ""}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
          <h2 className="font-semibold text-neutral-900">Invitations ({shown.length}{shown.length !== rows.length ? ` of ${rows.length}` : ""})</h2>
          <div className="flex gap-3 text-sm">
            <label className="text-neutral-600">Attendance{" "}
              <select value={fAttend} onChange={(e) => setFAttend(e.target.value as typeof fAttend)} className="ml-1 rounded-lg border border-neutral-300 px-2 py-1">
                <option value="">All</option><option value="in_person">In person</option><option value="virtual">Virtual</option>
              </select>
            </label>
            <label className="text-neutral-600">Origin{" "}
              <select value={fOrigin} onChange={(e) => setFOrigin(e.target.value as typeof fOrigin)} className="ml-1 rounded-lg border border-neutral-300 px-2 py-1">
                <option value="">All</option><option value="matched">Matched</option><option value="request">Request</option><option value="manual">Manual</option>
              </select>
            </label>
          </div>
        </div>
        {virtualLock && <p className="text-xs text-neutral-500 mb-2">Switching to virtual is off: {CONFIRM_BLOCK_TEXT[virtualLock]}</p>}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Lang</th>
                <th className="px-4 py-3">Family</th>
                {canViewPHI && <th className="px-4 py-3">Diagnoses</th>}
                <th className="px-4 py-3">Origin</th><th className="px-4 py-3">Attendance</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-400">{rows.length === 0 ? "No matches yet." : "No invitations match these filters."}</td></tr>}
              {shown.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 uppercase">{r.language}</td>
                  <td className="px-4 py-3">{r.familySize}</td>
                  {canViewPHI && <td className="px-4 py-3">{dx(r.diagnoses)}</td>}
                  <td className="px-4 py-3 capitalize">{r.origin}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.attendanceType === "virtual" ? "bg-indigo-100 text-indigo-800" : "bg-neutral-100 text-neutral-700"}`}>{r.attendanceType === "virtual" ? "Virtual" : "In person"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle[r.status] ?? ""}`}>{statusLabel[r.status] ?? r.status}</span>
                    {r.sentAt && <span className="ml-2 text-xs text-neutral-400">{new Date(r.sentAt).toLocaleDateString("en-US", { timeZone: SITE_TIMEZONE })}</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {r.origin !== "request" && r.attendanceType === "in_person" && (
                      <button onClick={() => switchTo(r, "virtual")} disabled={busy !== null || !!virtualLock} title={virtualLock ? CONFIRM_BLOCK_TEXT[virtualLock] : "Switch to virtual"}
                        className="mr-3 text-xs font-semibold text-primary hover:underline disabled:text-neutral-300 disabled:no-underline">Make virtual</button>
                    )}
                    {r.attendanceType === "virtual" && (
                      <button onClick={() => switchTo(r, "in_person")} disabled={busy !== null}
                        className="mr-3 text-xs font-semibold text-primary hover:underline disabled:text-neutral-300">Make in person</button>
                    )}
                    {r.status === "pending" && (
                      <button onClick={() => { setReason(""); setRemoving({ id: r.id, name: r.name }); }}
                        disabled={busy !== null} className="text-neutral-400 hover:text-red-600" title="Remove">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-neutral-900 mb-1">Call list ({callList.length})</h2>
        <p className="text-xs text-neutral-500 mb-2">Households with no email who need their invitation or confirmation by phone. Tell them what is in the grey box, in their language, then log the call. Households with an email are never on this list.</p>
        <div className="space-y-3">
          {callList.length === 0 && <div className="bg-white rounded-xl border border-neutral-200 px-4 py-6 text-center text-neutral-400 text-sm">Nobody to call.</div>}
          {callList.map((c) => (
            <div key={c.patientId} className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-semibold">{c.name}</span>
                <a className="text-primary hover:underline" href={`tel:${c.phone}`}>{c.phone}</a>
                <span className="text-xs uppercase text-neutral-500">Speaks: {c.language === "es" ? "Spanish" : "English"}</span>
                <span className="text-xs text-neutral-500">{c.familySize} {c.familySize === 1 ? "person" : "people"}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.purpose === "confirmation" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>{c.purpose === "confirmation" ? "Confirm their RSVP" : "Invite them"}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.attendanceType === "virtual" ? "bg-indigo-100 text-indigo-800" : "bg-neutral-100 text-neutral-700"}`}>{c.attendanceType === "virtual" ? "Virtual" : "In person"}</span>
                {c.confirmFor.length > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Also confirm by phone: {c.confirmFor.join(", ")}</span>}
              </div>
              <div className="mt-2 rounded-lg bg-neutral-50 border border-neutral-200 p-3 text-sm text-neutral-800">
                {c.script.kind === "in_person" ? (
                  <><div><strong>{c.script.title}</strong></div><div>When: {c.script.when}</div><div>Where: {c.script.where}</div>{c.purpose === "confirmation" && <div className="text-xs text-neutral-500 mt-1">Their check-in is by name at the door (no email, so no QR).</div>}</>
                ) : (
                  <><div><strong>{c.script.title}</strong> (online)</div><div>When: {c.script.when}</div><div>Google Meet: {c.script.meetUrl}</div><div>YouTube: {c.script.youtubeUrl}</div><div className="text-xs text-neutral-500 mt-1">Read the links out slowly. They are for this household only.</div></>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                {calling === c.patientId ? (
                  <>
                    <label className="sr-only" htmlFor={`o-${c.patientId}`}>Outcome</label>
                    <select id={`o-${c.patientId}`} value={outcome} onChange={(e) => setOutcome(e.target.value as CallOutcome | "")} className="rounded-lg border border-neutral-300 px-2 py-1">
                      <option value="">How did it go…</option>
                      {CALL_OUTCOMES.map((o) => <option key={o} value={o}>{CALL_OUTCOME_LABELS[o]}</option>)}
                    </select>
                    <button onClick={() => logCall(c)} disabled={!outcome || busy !== null} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Save</button>
                    <button onClick={() => { setCalling(null); setOutcome(""); }} className="text-xs text-neutral-500 hover:underline">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => { setCalling(c.patientId); setOutcome(""); }} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">Called</button>
                )}
                {c.lastCall && <span className="text-xs text-neutral-500">Last call: {CALL_OUTCOME_LABELS[c.lastCall.outcome]}, {new Date(c.lastCall.calledAt).toLocaleDateString("en-US", { timeZone: SITE_TIMEZONE })}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
