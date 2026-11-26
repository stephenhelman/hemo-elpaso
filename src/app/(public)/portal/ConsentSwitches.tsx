"use client";

import { useState } from "react";
import { portalText } from "@/lib/portal/text";
import { PORTAL_CONSENT_TYPES, type PortalConsentType } from "@/lib/portal/rules";

type Values = Record<PortalConsentType, boolean | null>;

/** The three choices a family can change. Each switch appends a consent record on the server; nothing else changes. */
export default function ConsentSwitches({ lang, initial, texts, available }: { lang: "en" | "es"; initial: Values; texts: Record<PortalConsentType, string>; available: Record<PortalConsentType, boolean> }) {
  const t = portalText[lang];
  const [values, setValues] = useState<Values>(initial);
  const [busy, setBusy] = useState<PortalConsentType | null>(null);
  const [note, setNote] = useState<{ type: PortalConsentType; ok: boolean; needsPhone?: boolean } | null>(null);

  async function flip(type: PortalConsentType) {
    const next = values[type] !== true;
    setBusy(type);
    setNote(null);
    try {
      const res = await fetch("/api/portal/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, granted: next }) });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setNote({ type, ok: false, needsPhone: data?.error === "needs_phone" });
        return;
      }
      setValues((v) => ({ ...v, [type]: next }));
      setNote({ type, ok: true });
    } catch {
      setNote({ type, ok: false });
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
      {PORTAL_CONSENT_TYPES.map((type) => {
        const on = values[type] === true;
        const label = t.items[type];
        return (
          <li key={type} className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-neutral-900">{label}</p>
                <p className="mt-1 text-sm text-neutral-600">{texts[type]}</p>
                {!available[type] && <p className="mt-1 text-xs text-neutral-500">{t.notYet}</p>}
                <p className="mt-2 text-xs text-neutral-500" role="status" aria-live="polite">
                  {busy === type ? t.saving : note?.type === type ? (note.ok ? t.saved : <span className="text-red-600">{note.needsPhone ? t.needsPhone : t.failed}</span>) : values[type] === null ? t.notAsked : ""}
                </p>
              </div>
              <button
                role="switch"
                aria-checked={on}
                aria-label={label}
                disabled={busy !== null}
                onClick={() => flip(type)}
                className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${on ? "bg-primary" : "bg-neutral-300"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-5" : "left-0.5"}`} />
                <span className="sr-only">{on ? t.on : t.off}</span>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
