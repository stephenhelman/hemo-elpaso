"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import MergeDialog from "@/components/admin/merge/MergeDialog";

interface Unmatched { id: string; provider: string; email: string; lastLoginAt: string; unlinkedByHand: boolean; matches: number }
interface Person { id: string; name: string; email: string | null; hasHousehold: boolean; boardRoles: string[]; adults: { id: string; name: string }[]; identities: { id: string; provider: string; email: string; linkedVia: string | null; householdMemberId: string | null }[] }

const PROVIDER: Record<string, string> = { "google-oauth2": "Google", apple: "Apple", facebook: "Facebook" };
const btn = "px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50";

async function api(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export default function IdentitiesClient() {
  const [unmatched, setUnmatched] = useState<Unmatched[]>([]);
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [linkTarget, setLinkTarget] = useState<string | null>(null); // unmatched identity being linked
  const [picked, setPicked] = useState<Person[]>([]); // up to two for merge
  const [reviewing, setReviewing] = useState(false); // merge preview open

  const load = useCallback(async () => {
    const r = await api("/api/admin/identities");
    if (r.ok) setUnmatched(r.data.identities);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function search() {
    const r = await api(`/api/admin/identities/people?q=${encodeURIComponent(q)}`);
    if (r.ok) setPeople(r.data.people);
  }

  async function link(identityId: string, patientId: string, memberId?: string) {
    const r = await api(`/api/admin/identities/${identityId}/link`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId, memberId }) });
    if (!r.ok) return toast.error("Could not link");
    toast.success("Linked"); setLinkTarget(null); load(); search();
  }
  async function unlink(identityId: string) {
    if (!confirm("Unlink this sign-in? That person will no longer reach their page with it until you link it again.")) return;
    const r = await api(`/api/admin/identities/${identityId}`, { method: "DELETE" });
    if (!r.ok) return toast.error("Could not unlink");
    toast.success("Unlinked"); load(); search();
  }
  const toggle = (p: Person) => { setPicked((cur) => (cur.some((x) => x.id === p.id) ? cur.filter((x) => x.id !== p.id) : [...cur, p].slice(-2))); };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-neutral-900">Sign-ins</h1>
        <p className="text-neutral-600 mt-1">People sign in with Google, Apple or Facebook. A sign-in links itself when its verified email matches exactly one household. Link the others here, or merge two records of the same person.</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-2">Sign-ins not linked to anyone ({unmatched.length})</h2>
        <p className="text-sm text-neutral-500 mb-3">Kept for 30 days after their last use, then deleted. “Matches” counts households with that email.</p>
        <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
          {unmatched.length === 0 && <li className="p-4 text-sm text-neutral-500">None.</li>}
          {unmatched.map((u) => (
            <li key={u.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-medium">{PROVIDER[u.provider] ?? u.provider} · {u.email}</p>
                <p className="text-neutral-500">Last seen {new Date(u.lastLoginAt).toLocaleDateString("en-US", { timeZone: "America/Denver" })} · {u.matches} matching {u.matches === 1 ? "household" : "households"}{u.unlinkedByHand ? " · unlinked by hand" : ""}</p>
              </div>
              <button className={`${btn} bg-primary text-white`} onClick={() => setLinkTarget(linkTarget === u.id ? null : u.id)}>{linkTarget === u.id ? "Cancel" : "Link to a person"}</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Find a person</h2>
        <div className="flex gap-2 mb-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Name or email" className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm" />
          <button className={`${btn} bg-primary text-white`} onClick={search}>Search</button>
        </div>
        <ul className="space-y-2">
          {people.map((p) => (
            <li key={p.id} className="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{p.name} <span className="text-neutral-500 font-normal">{p.email}</span></p>
                <div className="flex gap-2">
                  {p.hasHousehold && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">Household</span>}
                  {p.boardRoles.length > 0 && <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary text-xs font-semibold">Board</span>}
                  {linkTarget && <button className={`${btn} bg-primary text-white`} onClick={() => link(linkTarget, p.id)}>Link here</button>}
                  <button className={`${btn} border border-neutral-300`} onClick={() => toggle(p)}>{picked.some((x) => x.id === p.id) ? "Selected for merge" : "Select for merge"}</button>
                </div>
              </div>
              {linkTarget && p.adults.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-neutral-600">
                  <span>Or link as a confirmed adult of this household:</span>
                  {p.adults.map((a) => <button key={a.id} className={`${btn} border border-primary text-primary`} onClick={() => link(linkTarget, p.id, a.id)}>Link as {a.name}</button>)}
                </div>
              )}
              <ul className="mt-2 text-neutral-600">
                {p.identities.length === 0 && <li>No sign-ins linked.</li>}
                {p.identities.map((i) => (
                  <li key={i.id} className="flex items-center justify-between">
                    <span>{PROVIDER[i.provider] ?? i.provider} · {i.email} · {i.linkedVia ?? "unmatched"}{i.householdMemberId ? ` · as ${p.adults.find((a) => a.id === i.householdMemberId)?.name ?? "an adult member"}` : ""}</span>
                    {i.linkedVia !== "unlinked" && <button className="text-red-600 font-semibold hover:underline" onClick={() => unlink(i.id)}>Unlink</button>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {picked.length === 2 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm space-y-3">
          <p className="font-semibold">Merge these two records into one?</p>
          <p>You will see what moves and what conflicts before anything changes. There is no undo.</p>
          <button className={`${btn} bg-neutral-900 text-white`} onClick={() => setReviewing(true)}>Review merge</button>
        </section>
      )}
      {reviewing && picked.length === 2 && (
        <MergeDialog aId={picked[0].id} bId={picked[1].id} onClose={() => setReviewing(false)} onDone={() => { setReviewing(false); setPicked([]); search(); load(); }} />
      )}
    </div>
  );
}
