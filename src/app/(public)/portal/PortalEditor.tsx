"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { editText } from "@/lib/portal/edit-text";
import { DIAGNOSIS_VALUES, diagnosisLabels } from "@/lib/patients/diagnoses";
import { AGE_GROUPS, RELATIONSHIPS, ageGroupLabels } from "@/lib/households/constants";
import type { ViewMember } from "@/lib/portal/view";
import AddressFields, { emptyAddress, type AddressDraft } from "@/components/form/AddressFields";

type Lang = "en" | "es";
type Body = Record<string, unknown>;
export interface EditorProps {
  lang: Lang;
  isPrimary: boolean;
  me: { firstName: string; lastName: string; phone: string | null; email: string | null; language: Lang; diagnoses: string[] };
  address: { line1: string; line2: string; city: string; state: string; zip: string; unstructured: boolean } | null;
  /** The address_autocomplete toggle (decided on the server). */
  addressAutocomplete: boolean;
  members: ViewMember[];
  otherAdults: { id: string; name: string }[];
  pendingAttestations: { childMemberId: string; childName: string }[];
  primaryName: string;
}

const input = "w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm";
const btn = "px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50";
const primaryBtn = `${btn} bg-primary text-white`;
const ghostBtn = `${btn} border border-neutral-300 text-neutral-700`;
const card = "rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6";
const h2 = "font-display font-semibold text-neutral-900 text-lg mb-3";
const nameOf = (m: { firstName: string | null; lastName: string | null }) => [m.firstName, m.lastName].filter(Boolean).join(" ") || "—";

/** One call to the one write endpoint. The server takes the household and the actor from the session, never from this body. */
function useAct(lang: Lang) {
  const t = editText[lang];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [field, setField] = useState<string | null>(null);
  async function act(body: Body, okText?: string): Promise<boolean> {
    setBusy(true);
    setNote(null); setField(null);
    try {
      const res = await fetch("/api/portal/edit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setField(typeof data.field === "string" ? data.field : null);
        setNote({ ok: false, text: t.errors[(data.field as string) ?? (data.error as string)] ?? t.failed });
        return false;
      }
      setNote({ ok: true, text: okText ?? t.saved });
      router.refresh();
      return true;
    } catch {
      setNote({ ok: false, text: t.failed });
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { act, busy, note, field };
}
const Note = ({ note }: { note: { ok: boolean; text: string } | null }) => (
  <p className={`text-sm min-h-[1.25rem] ${note?.ok ? "text-green-700" : "text-red-700"}`} role="status" aria-live="polite">{note?.text ?? ""}</p>
);

function DiagnosisChecks({ lang, value, onChange }: { lang: Lang; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {DIAGNOSIS_VALUES.map((d) => (
        <label key={d} className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" checked={value.includes(d)} onChange={(e) => onChange(e.target.checked ? [...value, d] : value.filter((x) => x !== d))} />
          {diagnosisLabels[d][lang]}
        </label>
      ))}
    </div>
  );
}

// ── about you ───────────────────────────────────────────────────────────────────────────────────────────────
function AboutYou({ lang, me, address, autocomplete }: { lang: Lang; me: EditorProps["me"]; address: EditorProps["address"]; autocomplete: boolean }) {
  const t = editText[lang];
  const p = useAct(lang), a = useAct(lang), e = useAct(lang), d = useAct(lang);
  const [f, setF] = useState({ firstName: me.firstName, lastName: me.lastName, phone: me.phone ?? "", language: me.language });
  // A legacy one-line address is not split up for the person: the boxes start empty and the note says why.
  const [addr, setAddr] = useState<AddressDraft>(address && !address.unstructured ? { line1: address.line1, line2: address.line2, city: address.city, state: address.state, zip: address.zip } : emptyAddress());
  const [email, setEmail] = useState("");
  const [dx, setDx] = useState<string[]>(me.diagnoses);
  const [sent, setSent] = useState(false);

  async function requestEmail() {
    setSent(false);
    if (await e.act({ action: "email", email }, t.emailNeutral)) { setSent(true); setEmail(""); }
  }
  return (
    <section className={`${card} space-y-6`} aria-labelledby="about">
      <h2 id="about" className={h2}>{t.aboutYou}</h2>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm">{t.firstName}<input className={input} value={f.firstName} onChange={(x) => setF({ ...f, firstName: x.target.value })} autoComplete="given-name" /></label>
        <label className="text-sm">{t.lastName}<input className={input} value={f.lastName} onChange={(x) => setF({ ...f, lastName: x.target.value })} autoComplete="family-name" /></label>
        <label className="text-sm">{t.phone}<input className={input} value={f.phone} onChange={(x) => setF({ ...f, phone: x.target.value })} inputMode="tel" autoComplete="tel" /></label>
        <label className="text-sm">{t.language}
          <select className={input} value={f.language} onChange={(x) => setF({ ...f, language: x.target.value as Lang })}><option value="en">{t.english}</option><option value="es">{t.spanish}</option></select>
        </label>
      </div>
      <div className="flex items-center gap-3"><button className={primaryBtn} disabled={p.busy} onClick={() => p.act({ action: "profile", ...f })}>{p.busy ? t.saving : t.save}</button><Note note={p.note} /></div>

      <div>
        <p className="text-sm font-medium text-neutral-900">{t.email}: <span className="font-normal text-neutral-700">{me.email ?? "—"}</span></p>
        <p className="text-xs text-neutral-500 mb-2">{t.emailHelp}</p>
        <div className="flex flex-wrap gap-2">
          <input className={`${input} max-w-sm`} type="email" value={email} onChange={(x) => setEmail(x.target.value)} placeholder={t.emailNew} aria-label={t.emailNew} autoComplete="email" />
          <button className={ghostBtn} disabled={e.busy || !email} onClick={requestEmail}>{t.emailChange}</button>
        </div>
        <Note note={sent ? { ok: true, text: t.emailNeutral } : e.note} />
      </div>

      <div>
        <p className="text-sm font-medium text-neutral-900">{t.address}</p>
        <p className="text-xs text-neutral-500 mb-2">{t.addressHelp}</p>
        <AddressFields value={addr} onChange={setAddr} locale={lang} autocomplete={autocomplete} unstructuredNote={!!address?.unstructured} invalidField={a.field} />
        <div className="flex items-center gap-3"><button className={ghostBtn} disabled={a.busy} onClick={() => a.act({ action: "address", address: addr })}>{a.busy ? t.saving : t.save}</button><Note note={a.note} /></div>
      </div>

      <div>
        <p className="text-sm font-medium text-neutral-900">{t.yourDiagnoses}</p>
        <p className="text-xs text-neutral-500 mb-2">{t.yourDiagnosesNote}</p>
        <DiagnosisChecks lang={lang} value={dx} onChange={setDx} />
        <p className="text-xs text-neutral-500 mt-2">{t.futureOnly}</p>
        <div className="mt-2 flex items-center gap-3"><button className={ghostBtn} disabled={d.busy} onClick={() => d.act({ action: "own_diagnoses", diagnoses: dx })}>{d.busy ? t.saving : t.save}</button><Note note={d.note} /></div>
      </div>
    </section>
  );
}

// ── one member row ──────────────────────────────────────────────────────────────────────────────────────────
function MemberRow({ lang, m, isPrimary, otherAdults }: { lang: Lang; m: ViewMember; isPrimary: boolean; otherAdults: EditorProps["otherAdults"] }) {
  const t = editText[lang];
  const x = useAct(lang);
  const [mode, setMode] = useState<null | "edit" | "dx" | "convert" | "remove">(null);
  const [f, setF] = useState({ firstName: m.firstName ?? "", lastName: m.lastName ?? "", relationship: m.relationship, ageGroup: m.ageGroup });
  const [dx, setDx] = useState<string[]>(m.diagnoses ?? []);
  const [conv, setConv] = useState({ email: "", phone: false });
  const [guardian, setGuardian] = useState("");
  const label = nameOf(m);
  const done = async (p: Promise<boolean>) => { if (await p) setMode(null); };

  return (
    <li className="py-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-medium text-neutral-900">{label}</span>
          {m.isMe && <span className="ml-2 text-xs rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600">{t.you}</span>}
          {m.status === "pending" && <span className="ml-2 text-xs rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">{t.pending}</span>}
          <span className="ml-2 text-sm text-neutral-500">{t.relationships[m.relationship] ?? m.relationship} · {ageGroupLabels[m.ageGroup as keyof typeof ageGroupLabels]?.[lang] ?? m.ageGroup}</span>
        </div>
        <div className="flex gap-2 text-sm">
          {m.canEdit && <button className="font-semibold text-primary" onClick={() => setMode(mode === "edit" ? null : "edit")}>{t.edit}</button>}
          {m.canRemove && !m.isMe && <button className="font-semibold text-red-700" onClick={() => setMode(mode === "remove" ? null : "remove")}>{t.remove}</button>}
        </div>
      </div>

      {m.minor && m.ageCheck && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <p>{t.ageCheckQ(label)}</p>
          <div className="mt-2 flex gap-2">
            <button className={ghostBtn} disabled={x.busy} onClick={() => x.act({ action: "edit_minor", memberId: m.id, ...f })}>{t.stillRight}</button>
            {m.canConvert && <button className={ghostBtn} onClick={() => setMode("convert")}>{t.turned18}</button>}
          </div>
        </div>
      )}

      {mode === "edit" && (
        <div className="rounded-lg bg-neutral-50 p-3 grid sm:grid-cols-2 gap-3">
          <label className="text-sm">{t.firstName}<input className={input} value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></label>
          <label className="text-sm">{t.lastName}<input className={input} value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></label>
          <label className="text-sm">{t.relationship}<select className={input} value={f.relationship} onChange={(e) => setF({ ...f, relationship: e.target.value })}>{RELATIONSHIPS.map((r) => <option key={r} value={r}>{t.relationships[r]}</option>)}</select></label>
          <label className="text-sm">{t.ageGroup}<select className={input} value={f.ageGroup} onChange={(e) => setF({ ...f, ageGroup: e.target.value })}>{AGE_GROUPS.filter((a) => a !== "18_plus").map((a) => <option key={a} value={a}>{ageGroupLabels[a][lang]}</option>)}</select></label>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button className={primaryBtn} disabled={x.busy} onClick={() => done(x.act({ action: "edit_minor", memberId: m.id, ...f }))}>{x.busy ? t.saving : t.save}</button>
            <button className={ghostBtn} onClick={() => setMode(null)}>{t.cancel}</button>
            {m.canConvert && <button className={ghostBtn} onClick={() => setMode("convert")}>{t.turned18}</button>}
          </div>
          <p className="sm:col-span-2 text-xs text-neutral-500">{t.futureOnly}</p>
        </div>
      )}

      {m.minor && (
        <div className="text-sm">
          {m.diagnoses === null ? <p className="text-xs text-neutral-500">{t.notGuardian}</p> : mode === "dx" ? (
            <div className="rounded-lg bg-neutral-50 p-3 space-y-2">
              <DiagnosisChecks lang={lang} value={dx} onChange={setDx} />
              <p className="text-xs text-neutral-500">{t.futureOnly}</p>
              <div className="flex gap-2">
                <button className={primaryBtn} disabled={x.busy} onClick={() => done(x.act({ action: "minor_diagnoses", memberId: m.id, diagnoses: dx }))}>{x.busy ? t.saving : t.save}</button>
                <button className={ghostBtn} onClick={() => setMode(null)}>{t.cancel}</button>
              </div>
            </div>
          ) : (
            <p className="text-neutral-700">
              <span className="font-medium text-neutral-900">{t.diagnoses}:</span>{" "}
              {m.diagnoses.length ? m.diagnoses.map((d) => diagnosisLabels[d as keyof typeof diagnosisLabels]?.[lang] ?? d).join(", ") : t.noDiagnoses}{" "}
              {m.canSetDiagnoses && <button className="font-semibold text-primary" onClick={() => setMode("dx")}>{t.editDiagnoses}</button>}
            </p>
          )}
        </div>
      )}

      {mode === "convert" && m.canConvert && (
        <div className="rounded-lg border border-neutral-200 p-3 space-y-2">
          <p className="font-medium text-neutral-900 text-sm">{t.convertTitle(label)}</p>
          <p className="text-xs text-neutral-600">{t.convertBody}</p>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={conv.phone} onChange={(e) => setConv({ ...conv, phone: e.target.checked })} />{t.adultByPhone}</label>
          {!conv.phone && <input className={input} type="email" value={conv.email} onChange={(e) => setConv({ ...conv, email: e.target.value })} placeholder={t.adultEmail} aria-label={t.adultEmail} />}
          <div className="flex gap-2">
            <button className={primaryBtn} disabled={x.busy} onClick={() => done(x.act({ action: "convert_minor", memberId: m.id, email: conv.email, confirmByPhone: conv.phone }))}>{x.busy ? t.saving : t.convert}</button>
            <button className={ghostBtn} onClick={() => setMode(null)}>{t.cancel}</button>
          </div>
        </div>
      )}

      {isPrimary && m.minor && m.guardians && (
        <div className="text-sm text-neutral-700">
          <p className="font-medium text-neutral-900">{t.guardians}</p>
          <p className="text-xs text-neutral-500">{t.guardiansNote}</p>
          <ul className="mt-1 space-y-1">
            {m.guardians.map((g) => (
              <li key={g.memberId} className="flex items-center gap-2">
                {g.name} <span className="text-xs text-neutral-500">({g.attested ? t.guardianOk : t.guardianWaiting})</span>
                <button className="text-xs font-semibold text-red-700" disabled={x.busy} onClick={() => x.act({ action: "revoke_guardian", childId: m.id, guardianId: g.memberId })}>{t.remove}</button>
              </li>
            ))}
          </ul>
          {otherAdults.filter((a) => !m.guardians!.some((g) => g.memberId === a.id)).length > 0 && (
            <div className="mt-2 flex gap-2">
              <select className={`${input} max-w-xs`} value={guardian} onChange={(e) => setGuardian(e.target.value)} aria-label={t.designate}>
                <option value="">{t.designate}…</option>
                {otherAdults.filter((a) => !m.guardians!.some((g) => g.memberId === a.id)).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button className={ghostBtn} disabled={x.busy || !guardian} onClick={async () => { if (await x.act({ action: "designate_guardian", childId: m.id, guardianId: guardian })) setGuardian(""); }}>{t.add}</button>
            </div>
          )}
        </div>
      )}

      {mode === "remove" && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-900 space-y-2">
          <p>{t.removeConfirm(label === "—" ? t.removeThis : label)}</p>
          <div className="flex gap-2">
            <button className={`${btn} bg-red-700 text-white`} disabled={x.busy} onClick={() => x.act({ action: "remove_member", memberId: m.id, confirm: true })}>{t.yes}</button>
            <button className={ghostBtn} onClick={() => setMode(null)}>{t.cancel}</button>
          </div>
        </div>
      )}
      <Note note={x.note} />
    </li>
  );
}

// ── add a person ────────────────────────────────────────────────────────────────────────────────────────────
function AddPerson({ lang }: { lang: Lang }) {
  const t = editText[lang];
  const x = useAct(lang);
  const [open, setOpen] = useState<null | "minor" | "adult">(null);
  const blank = { firstName: "", lastName: "", relationship: "child", ageGroup: "6_12", email: "", confirmByPhone: false };
  const [f, setF] = useState(blank);
  async function add() {
    const adult = open === "adult";
    const ok = await x.act({ action: "add_member", member: { ...f, ageGroup: adult ? "18_plus" : f.ageGroup, email: adult && !f.confirmByPhone ? f.email : "", confirmByPhone: adult && f.confirmByPhone } });
    if (ok) { setF(blank); setOpen(null); }
  }
  return (
    <div className="mt-4">
      {!open ? (
        <div className="flex flex-wrap gap-2"><button className={ghostBtn} onClick={() => { setF({ ...blank, relationship: "child", ageGroup: "6_12" }); setOpen("minor"); }}>{t.addMinor}</button><button className={ghostBtn} onClick={() => { setF({ ...blank, relationship: "spouse_partner", ageGroup: "18_plus" }); setOpen("adult"); }}>{t.addAdult}</button></div>
      ) : (
        <div className="rounded-lg bg-neutral-50 p-3 grid sm:grid-cols-2 gap-3">
          <label className="text-sm">{t.firstName}<input className={input} value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></label>
          <label className="text-sm">{t.lastName}<input className={input} value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></label>
          <label className="text-sm">{t.relationship}<select className={input} value={f.relationship} onChange={(e) => setF({ ...f, relationship: e.target.value })}>{RELATIONSHIPS.map((r) => <option key={r} value={r}>{t.relationships[r]}</option>)}</select></label>
          {open === "minor" ? (
            <label className="text-sm">{t.ageGroup}<select className={input} value={f.ageGroup} onChange={(e) => setF({ ...f, ageGroup: e.target.value })}>{AGE_GROUPS.filter((a) => a !== "18_plus").map((a) => <option key={a} value={a}>{ageGroupLabels[a][lang]}</option>)}</select></label>
          ) : (
            <div className="text-sm">
              {!f.confirmByPhone && <label>{t.adultEmail}<input className={input} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>}
              <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={f.confirmByPhone} onChange={(e) => setF({ ...f, confirmByPhone: e.target.checked })} />{t.adultByPhone}</label>
            </div>
          )}
          {open === "adult" && <p className="sm:col-span-2 text-xs text-neutral-500">{t.adultNote}</p>}
          <div className="sm:col-span-2 flex gap-2">
            <button className={primaryBtn} disabled={x.busy} onClick={add}>{x.busy ? t.saving : t.add}</button>
            <button className={ghostBtn} onClick={() => setOpen(null)}>{t.cancel}</button>
          </div>
        </div>
      )}
      <Note note={x.note} />
    </div>
  );
}

// ── guardian statement (blocks until answered) ──────────────────────────────────────────────────────────────
function GuardianGate({ lang, pending }: { lang: Lang; pending: EditorProps["pendingAttestations"] }) {
  const t = editText[lang];
  const x = useAct(lang);
  if (pending.length === 0) return null;
  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 sm:p-6" aria-labelledby="attest" role="alert">
      <h2 id="attest" className={h2}>{t.attestTitle}</h2>
      <p className="text-sm text-neutral-800">{t.attestBody(pending.map((p) => p.childName).join(", "))}</p>
      <p className="mt-2 font-medium text-neutral-900">“{t.attestStatement}”</p>
      <div className="mt-3 flex gap-2">
        <button className={primaryBtn} disabled={x.busy} onClick={() => x.act({ action: "accept_guardianship" })}>{x.busy ? t.saving : t.attest}</button>
      </div>
      <Note note={x.note} />
    </section>
  );
}

// ── leave / delete ──────────────────────────────────────────────────────────────────────────────────────────
function DangerZone({ lang, isPrimary }: { lang: Lang; isPrimary: boolean }) {
  const t = editText[lang];
  const del = useAct(lang), leave = useAct(lang);
  const [sure, setSure] = useState<null | "leave" | "delete">(null);
  return (
    <section className={`${card} space-y-6`} aria-labelledby="danger">
      <h2 id="danger" className={h2}>{t.deleteTitle}</h2>
      <div className="text-sm space-y-2">
        <p className="text-neutral-700">{isPrimary ? t.deleteHouseholdBody : t.deleteSelfBody}</p>
        {sure === "delete" ? (
          <div className="flex gap-2"><button className={`${btn} bg-red-700 text-white`} disabled={del.busy} onClick={async () => { if (await del.act({ action: "request_deletion", confirm: true }, t.deleteSent)) setSure(null); }}>{t.yes}</button><button className={ghostBtn} onClick={() => setSure(null)}>{t.cancel}</button></div>
        ) : <button className={ghostBtn} onClick={() => setSure("delete")}>{isPrimary ? t.deleteHousehold : t.deleteSelf}</button>}
        <Note note={del.note} />
      </div>
      {!isPrimary && (
        <div className="text-sm space-y-2 border-t border-neutral-100 pt-4">
          <p className="font-medium text-neutral-900">{t.leaveTitle}</p>
          <p className="text-neutral-700">{t.leaveBody}</p>
          {sure === "leave" ? (
            <div className="flex gap-2"><button className={`${btn} bg-red-700 text-white`} disabled={leave.busy} onClick={async () => { if (await leave.act({ action: "leave", confirm: true })) window.location.href = "/"; }}>{t.yes}</button><button className={ghostBtn} onClick={() => setSure(null)}>{t.cancel}</button></div>
          ) : <button className={ghostBtn} onClick={() => setSure("leave")}>{t.leave}</button>}
          <Note note={leave.note} />
        </div>
      )}
    </section>
  );
}

export default function PortalEditor(p: EditorProps) {
  const t = editText[p.lang];
  return (
    <>
      <GuardianGate lang={p.lang} pending={p.pendingAttestations} />
      <AboutYou lang={p.lang} me={p.me} address={p.address} autocomplete={p.addressAutocomplete} />
      <section className={card} aria-labelledby="members">
        <h2 id="members" className={h2}>{t.members}</h2>
        <ul className="divide-y divide-neutral-100">
          <li className="py-2.5 flex justify-between gap-3"><span className="font-medium text-neutral-900">{p.me.firstName} {p.me.lastName}</span><span className="text-sm text-neutral-500">{t.you}</span></li>
          {!p.isPrimary && p.primaryName && <li className="py-2.5 flex justify-between gap-3"><span className="font-medium text-neutral-900">{p.primaryName}</span><span className="text-sm text-neutral-500">{t.householdContact}</span></li>}
          {p.members.filter((m) => !m.isMe).map((m) => <MemberRow key={m.id} lang={p.lang} m={m} isPrimary={p.isPrimary} otherAdults={p.otherAdults} />)}
        </ul>
        <AddPerson lang={p.lang} />
      </section>
      <DangerZone lang={p.lang} isPrimary={p.isPrimary} />
    </>
  );
}
