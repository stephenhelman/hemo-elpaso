"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, RefreshCw, Send, Trash2, UserPlus } from "lucide-react";
import { diagnosisLabels } from "@/lib/patients/diagnoses";

export interface InvRow {
  id: string;
  name: string;
  language: "en" | "es";
  familySize: number;
  diagnoses: string[];
  status: string;
  sentAt: string | null;
}
export interface CallRow {
  id: string;
  name: string;
  phone: string;
  language: "en" | "es";
  familySize: number;
  diagnoses: string[];
  /** first names of adults still to confirm by phone */
  confirmFor: string[];
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
  eventId, rows, callList, canViewPHI,
}: { eventId: string; rows: InvRow[]; callList: CallRow[]; canViewPHI: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; email: string | null; phone: string | null }[]>([]);
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
    if (!window.confirm(`Send ${pending} invitation email${pending === 1 ? "" : "s"} now? Already-sent invitations are never re-sent.`)) return;
    await call("send", `/api/admin/events/${eventId}/invitations/send`,
      { method: "POST", body: JSON.stringify({ expectedCount: pending }) },
      (d) => `Sent ${d.sent}${d.failed ? `, ${d.failed} FAILED and still pending (${(d.errors ?? []).join(", ") || "unknown error"})` : ""}${d.skipped ? `, ${d.skipped} skipped` : ""}`);
  };

  return (
    <div className="space-y-8">
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
        <h2 className="font-semibold text-neutral-900 mb-2">Email list ({rows.length})</h2>
        <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Lang</th>
                <th className="px-4 py-3">Family</th>
                {canViewPHI && <th className="px-4 py-3">Diagnoses</th>}
                <th className="px-4 py-3">Status</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No matches yet.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 uppercase">{r.language}</td>
                  <td className="px-4 py-3">{r.familySize}</td>
                  {canViewPHI && <td className="px-4 py-3">{dx(r.diagnoses)}</td>}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle[r.status] ?? ""}`}>{statusLabel[r.status] ?? r.status}</span>
                    {r.sentAt && <span className="ml-2 text-xs text-neutral-400">{new Date(r.sentAt).toLocaleDateString()}</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "pending" && (
                      <button onClick={() => call(r.id, `/api/admin/events/${eventId}/invitations/${r.id}`, { method: "DELETE" })}
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
        <p className="text-xs text-neutral-500 mb-2">Matched people with a phone number but no email, plus households with an adult still to confirm by phone. Reach out by phone.</p>
        <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Lang</th><th className="px-4 py-3">Family</th>{canViewPHI && <th className="px-4 py-3">Diagnoses</th>}</tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {callList.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-400">Nobody to call.</td></tr>}
              {callList.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.name}{c.confirmFor.length > 0 && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-800">Confirm by phone: {c.confirmFor.join(", ")}</span>}</td>
                  <td className="px-4 py-3"><a className="text-primary hover:underline" href={`tel:${c.phone}`}>{c.phone}</a></td>
                  <td className="px-4 py-3 uppercase">{c.language}</td>
                  <td className="px-4 py-3">{c.familySize}</td>
                  {canViewPHI && <td className="px-4 py-3">{dx(c.diagnoses)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
