"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Summary {
  id: string; name: string; email: string | null; phone: string | null; role: string; boardRoles: string[]; hasHousehold: boolean; createdAt: string;
  counts: { members: number; rsvps: number; checkIns: number; invitations: number; consents: number; identities: number };
}
interface Conflict { kind: string; label: string; kept: string | null; dropped: string | null; rule: string }
interface Plan {
  keepId: string; dropId: string; keep: Summary; drop: Summary; moves: { label: string; count: number }[]; conflicts: Conflict[];
  fingerprint: string; needsHouseholdReview: boolean;
}

const RULES: Record<string, string> = {
  active_over_cancelled: "an active RSVP beats a cancelled one",
  checked_in: "the one with check-ins wins",
  more_attendees: "the larger party wins",
  more_recent: "the newer RSVP wins",
  tie_keeps_survivor: "identical: the surviving record's is kept",
  answered_or_sent: "answered beats sent beats not-sent",
  removal_kept: "an officer's removal is kept",
  earlier_check_in_larger_headcount: "the earlier check-in is kept with the larger headcount",
  same_name_and_age_group: "same name and age group: one entry kept, attendance and consents moved to it",
  most_restrictive_wins: "the most restrictive choice applies",
  most_restrictive_wins_refusal_recorded: "the most restrictive choice applies; a refusal is recorded so a later “yes” can't override it",
  primary_by_choice_other_kept_as_sign_in_alias: "you choose the primary; the other is kept only for sign-in matching",
  primary_by_choice_other_discarded: "you choose which is primary; the other is discarded",
  union: "both are kept",
  survivor_wins: "the surviving record's is kept",
  already_attending: "the household already has an RSVP for that event",
  one_open_request: "one open request per event: the one further along, then the older, is kept",
};
const btn = "px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50";
const short = (iso: string) => new Date(iso).toLocaleDateString("en-US");

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

function Card({ s, chosen }: { s: Summary; chosen?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 text-sm ${chosen ? "border-green-600 bg-green-50" : "border-neutral-200 bg-white"}`}>
      <p className="font-semibold">{s.name}{s.boardRoles.length ? <span className="ml-2 text-xs font-normal text-neutral-500">{s.boardRoles.join(", ")}</span> : null}</p>
      <p className="text-neutral-600">{s.email ?? "no email"} · {s.phone ?? "no phone"}</p>
      <p className="text-xs text-neutral-500">{s.hasHousehold ? "Has a household" : "No household (board record only)"} · created {short(s.createdAt)}</p>
      <p className="text-xs text-neutral-500">{s.counts.members} members · {s.counts.rsvps} RSVPs · {s.counts.invitations} invitations · {s.counts.consents} consent records · {s.counts.identities} sign-ins</p>
    </div>
  );
}

/**
 * Merge preview and confirm. Calls …/merge/preview (writes nothing), shows what moves and every conflict with its rule,
 * asks for the surviving household when both records have one, and confirms with the preview's fingerprint.
 */
export default function MergeDialog({ aId, bId, onClose, onDone }: { aId: string; bId: string; onClose: () => void; onDone: () => void }) {
  const [keepId, setKeepId] = useState<string | null>(null);
  const [email, setEmail] = useState<"survivor" | "other">("survivor");
  const [phone, setPhone] = useState<"survivor" | "other">("survivor");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [choose, setChoose] = useState<Summary[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const preview = useCallback(async () => {
    setErr(null);
    const r = await post(`/api/admin/patients/${aId}/merge/preview`, { otherId: bId, keepId, primaryEmail: email, primaryPhone: phone });
    if (r.data?.error === "needs_keep_choice") { setChoose(r.data.summaries); setPlan(null); return; }
    if (!r.ok) { setPlan(null); setChoose(null); setErr(r.data?.error === "admin_record" ? "The settings-only admin account can't be merged." : r.data?.error === "already_merged" ? "One of these records was already merged." : "Could not prepare the merge."); return; }
    setChoose(null); setPlan(r.data.plan);
  }, [aId, bId, keepId, email, phone]);
  useEffect(() => { preview(); }, [preview]);

  async function confirmMerge() {
    if (!plan) return;
    setBusy(true);
    const r = await post(`/api/admin/patients/${aId}/merge`, { otherId: bId, keepId: plan.keepId, primaryEmail: email, primaryPhone: phone, fingerprint: plan.fingerprint });
    setBusy(false);
    if (r.data?.error === "plan_changed") { toast("Something changed while you were reviewing. Review it again."); return preview(); }
    if (!r.ok) return toast.error("Could not merge");
    toast.success("Merged"); onDone();
  }

  const emailDiffers = plan && plan.keep.email && plan.drop.email && plan.keep.email.toLowerCase() !== plan.drop.email.toLowerCase();
  const phoneDiffers = plan && plan.keep.phone && plan.drop.phone && plan.keep.phone !== plan.drop.phone;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="Merge preview">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 my-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold">Review merge</h2>
          <button className="text-sm underline" onClick={onClose}>Close</button>
        </div>
        {err && <p className="text-sm text-red-700">{err}</p>}

        {choose && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Both records have a household. Choose the household that survives. The other becomes an empty placeholder and its people, RSVPs and history move to the one you pick.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {choose.map((s) => (
                <label key={s.id} className="cursor-pointer"><Card s={s} chosen={keepId === s.id} />
                  <span className="flex items-center gap-2 mt-2 text-sm"><input type="radio" name="keep" checked={keepId === s.id} onChange={() => setKeepId(s.id)} />Keep this household</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {plan && (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><p className="text-xs uppercase text-neutral-500 mb-1">Survives</p><Card s={plan.keep} chosen /></div>
              <div><p className="text-xs uppercase text-neutral-500 mb-1">Folded in, then emptied</p><Card s={plan.drop} /></div>
            </div>
            {plan.needsHouseholdReview && <button className="text-xs underline" onClick={() => { setKeepId(null); setPlan(null); preview(); }}>Choose the other household instead</button>}

            <section>
              <h3 className="font-semibold text-sm mb-1">What moves to the surviving record</h3>
              {plan.moves.length === 0 ? <p className="text-sm text-neutral-500">Nothing besides contact details.</p> : (
                <ul className="text-sm list-disc pl-5">{plan.moves.map((m) => <li key={m.label}>{m.count} × {m.label}</li>)}</ul>
              )}
            </section>

            <section>
              <h3 className="font-semibold text-sm mb-1">Conflicts and how each is resolved</h3>
              {plan.conflicts.length === 0 ? <p className="text-sm text-neutral-500">None.</p> : (
                <ul className="text-sm space-y-2">
                  {plan.conflicts.map((c, i) => (
                    <li key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                      <p className="font-medium">{c.label}</p>
                      <p className="text-xs text-neutral-700">{c.kept ? `Kept: ${c.kept}. ` : ""}{c.dropped ? `Set aside: ${c.dropped}. ` : ""}Rule: {RULES[c.rule] ?? c.rule}.</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {(emailDiffers || phoneDiffers) && (
              <section className="space-y-2 text-sm">
                <h3 className="font-semibold">Which contact details are primary?</h3>
                {emailDiffers && (
                  <div>
                    <p className="text-xs text-neutral-500">Email. The other address stays as a sign-in alias, never emailed.</p>
                    <label className="flex gap-2 items-center"><input type="radio" name="em" checked={email === "survivor"} onChange={() => setEmail("survivor")} />{plan.keep.email}</label>
                    <label className="flex gap-2 items-center"><input type="radio" name="em" checked={email === "other"} onChange={() => setEmail("other")} />{plan.drop.email}</label>
                  </div>
                )}
                {phoneDiffers && (
                  <div>
                    <p className="text-xs text-neutral-500">Phone. The other number is discarded.</p>
                    <label className="flex gap-2 items-center"><input type="radio" name="ph" checked={phone === "survivor"} onChange={() => setPhone("survivor")} />{plan.keep.phone}</label>
                    <label className="flex gap-2 items-center"><input type="radio" name="ph" checked={phone === "other"} onChange={() => setPhone("other")} />{plan.drop.phone}</label>
                  </div>
                )}
              </section>
            )}

            <p className="text-xs text-neutral-600">There is no undo. The audit log records the id of every row that moved or was set aside (no names, emails or diagnoses). The emptied record is deleted after 12 months. Consents are never switched on by a merge: if the two records disagree, the most restrictive choice applies.</p>
            <div className="flex justify-end gap-2">
              <button className={`${btn} border border-neutral-300`} onClick={onClose}>Cancel</button>
              <button className={`${btn} bg-red-600 text-white`} disabled={busy} onClick={confirmMerge}>Merge these records</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
