"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BOARD_REASONS, isFamilyAsked, type BoardReason } from "@/lib/consent/board-rules";

export interface ConsentHistoryRow { id: string; when: string; granted: boolean; method: string; version: string; reason: string | null }
export interface ConsentLine { type: string; current: boolean | null; history: ConsentHistoryRow[]; /** texting: a yes is on file, but not for the number on file now */ needsReconsent?: boolean }
export interface ConsentSubject { memberId: string | null; title: string; lines: ConsentLine[] }

const T = {
  en: {
    title: "Consents", on: "On", off: "Off", never: "Never recorded", withdraw: "Withdraw", turnOn: "Turn on", reason: "Reason", choose: "Choose a reason…",
    history: "History", when: "When", value: "Value", method: "Method", version: "Text", why: "Reason",
    note: "A change adds a new record; nothing is edited. Withdrawing is always allowed. Turning a consent on needs the family to have asked.",
    saved: "Recorded", failed: "Could not record that change.",
    reconsent: "A yes is on file, but not for the current phone number. Texting stays off until the family agrees again.", phoneChanged: "Phone number changed",
    types: { data_and_contact: "Store my information and contact me", media: "Photos, video and recordings", sms: "Text messages", newsletter: "Newsletter" } as Record<string, string>,
    reasons: { FAMILY_ASKED_PHONE: "Family asked by phone", FAMILY_ASKED_EMAIL: "Family asked by email", FAMILY_ASKED_IN_PERSON: "Family asked in person", OTHER: "Other (withdraw only)" } as Record<BoardReason, string>,
    errors: { family_ask_required: "Turning a consent on needs a “Family asked…” reason.", needs_phone: "Add a phone number first.", needs_email: "Add an email first.", no_change: "That is already the current value.", bad_reason: "Choose a reason." } as Record<string, string>,
  },
  es: {
    title: "Consentimientos", on: "Sí", off: "No", never: "Sin registro", withdraw: "Retirar", turnOn: "Activar", reason: "Motivo", choose: "Elija un motivo…",
    history: "Historial", when: "Cuándo", value: "Valor", method: "Método", version: "Texto", why: "Motivo",
    note: "Un cambio agrega un registro nuevo; nada se edita. Siempre se puede retirar un consentimiento. Activarlo requiere que la familia lo haya pedido.",
    saved: "Registrado", failed: "No se pudo registrar el cambio.",
    reconsent: "Hay un sí registrado, pero no para el número de teléfono actual. Los mensajes siguen desactivados hasta que la familia acepte de nuevo.", phoneChanged: "Cambió el número de teléfono",
    types: { data_and_contact: "Guardar mi información y contactarme", media: "Fotos, video y grabaciones", sms: "Mensajes de texto", newsletter: "Boletín" } as Record<string, string>,
    reasons: { FAMILY_ASKED_PHONE: "La familia lo pidió por teléfono", FAMILY_ASKED_EMAIL: "La familia lo pidió por correo", FAMILY_ASKED_IN_PERSON: "La familia lo pidió en persona", OTHER: "Otro (solo para retirar)" } as Record<BoardReason, string>,
    errors: { family_ask_required: "Activar un consentimiento requiere un motivo “La familia lo pidió…”.", needs_phone: "Agregue primero un teléfono.", needs_email: "Agregue primero un correo.", no_change: "Ese ya es el valor actual.", bad_reason: "Elija un motivo." } as Record<string, string>,
  },
};

function Line({ patientId, memberId, line, locale }: { patientId: string; memberId: string | null; line: ConsentLine; locale: "en" | "es" }) {
  const t = T[locale];
  const router = useRouter();
  const [reason, setReason] = useState<BoardReason | "">("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const target = line.current !== true; // the next action: withdraw if on, turn on otherwise
  const nextGranted = line.current !== true;
  // A consent that was never recorded can only be turned on; one that is on can only be withdrawn.
  const reasons = BOARD_REASONS.filter((r) => (nextGranted ? isFamilyAsked(r) : true));

  async function save() {
    if (!reason) return toast.error(t.errors.bad_reason);
    setBusy(true);
    const res = await fetch(`/api/admin/patients/${patientId}/consents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId, type: line.type, granted: nextGranted, reason }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error(t.errors[data?.error as string] ?? t.failed);
    toast.success(t.saved); setReason(""); router.refresh();
  }

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium text-neutral-900 flex-1 min-w-[12rem]">{t.types[line.type] ?? line.type}</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${line.current === true ? "bg-green-100 text-green-800" : line.current === false ? "bg-red-100 text-red-800" : "bg-neutral-100 text-neutral-600"}`}>
          {line.current === null ? t.never : line.current ? t.on : t.off}
        </span>
        <select aria-label={t.reason} className="border border-neutral-300 rounded-lg text-sm px-2 py-1.5" value={reason} onChange={(e) => setReason(e.target.value as BoardReason)}>
          <option value="">{t.choose}</option>
          {reasons.map((r) => <option key={r} value={r}>{t.reasons[r]}</option>)}
        </select>
        <button disabled={busy || !reason} onClick={save} className={`px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50 ${target ? "bg-neutral-900 text-white" : "border border-red-300 text-red-700"}`}>
          {nextGranted ? t.turnOn : t.withdraw}
        </button>
        <button onClick={() => setOpen((o) => !o)} className="text-xs underline text-neutral-500">{t.history} ({line.history.length})</button>
      </div>
      {line.needsReconsent && <p className="mt-1 text-xs text-amber-800">{t.reconsent}</p>}
      {open && (
        <table className="w-full text-xs mt-2">
          <thead className="text-left uppercase text-neutral-500"><tr><th className="py-1">{t.when}</th><th>{t.value}</th><th>{t.method}</th><th>{t.version}</th><th>{t.why}</th></tr></thead>
          <tbody className="divide-y divide-neutral-100">
            {line.history.map((h) => (
              <tr key={h.id}><td className="py-1">{h.when}</td><td>{h.granted ? t.on : t.off}</td><td>{h.method}</td><td>{h.version}</td><td>{h.reason === "PHONE_CHANGED" ? t.phoneChanged : h.reason ? (t.reasons[h.reason as BoardReason] ?? h.reason) : "—"}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </li>
  );
}

export default function ConsentPanel({ patientId, locale, subjects }: { patientId: string; locale: "en" | "es"; subjects: ConsentSubject[] }) {
  const t = T[locale];
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-neutral-900">{t.title}</h2>
        <p className="text-xs text-neutral-500 mt-1">{t.note}</p>
      </div>
      {subjects.map((s) => (
        <div key={s.memberId ?? "primary"}>
          <h3 className="text-sm font-semibold text-neutral-700">{s.title}</h3>
          <ul className="divide-y divide-neutral-100">
            {s.lines.map((l) => <Line key={l.type} patientId={patientId} memberId={s.memberId} line={l} locale={locale} />)}
          </ul>
        </div>
      ))}
    </div>
  );
}
