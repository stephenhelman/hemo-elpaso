"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, X } from "lucide-react";
import type { Lang } from "@/types";

interface Officer { patientId: string; role: string; name: string; hasOrgIdentity: boolean }

const ROLE: Record<string, { en: string; es: string }> = {
  PRESIDENT: { en: "President", es: "Presidente/a" }, VICE_PRESIDENT: { en: "Vice President", es: "Vicepresidente/a" },
  SECRETARY: { en: "Secretary", es: "Secretario/a" }, TREASURER: { en: "Treasurer", es: "Tesorero/a" },
};

const T = {
  en: {
    title: "Board sign-in", label: (d: string) => `Board sign-in requires an @${d} account`, on: "On", off: "Off",
    intro: (d: string) => `Off: officers who already had a sign-in linked keep board access with it, as before. On: only a Google account on @${d} gives board access. A personal Gmail then opens the family page only. Turn it on once every officer below has a HOEP sign-in. Every change is logged and emailed to the four officers.`,
    officers: "Officers", linked: "HOEP sign-in linked", notYet: "Not linked yet", none: "Nobody holds this role",
    saved: "Saved. Officers were notified.", savedNoNotice: "Saved, but the officer notice could not be sent.", failed: "Could not save.",
    missing: "Every officer needs a linked HOEP sign-in first.",
  },
  es: {
    title: "Acceso de la junta", label: (d: string) => `El acceso de la junta requiere una cuenta @${d}`, on: "Activo", off: "Inactivo",
    intro: (d: string) => `Inactivo: los oficiales que ya tenían un inicio de sesión vinculado conservan el acceso de la junta con él, como antes. Activo: solo una cuenta de Google @${d} da acceso a la junta; un Gmail personal solo abre la página familiar. Actívelo cuando cada oficial de abajo tenga su inicio de sesión de HOEP. Cada cambio se registra y se avisa por correo a los cuatro oficiales.`,
    officers: "Oficiales", linked: "Inicio de sesión de HOEP vinculado", notYet: "Aún sin vincular", none: "Nadie tiene este cargo",
    saved: "Guardado. Se avisó a los oficiales.", savedNoNotice: "Guardado, pero no se pudo enviar el aviso a los oficiales.", failed: "No se pudo guardar.",
    missing: "Primero cada oficial necesita un inicio de sesión de HOEP vinculado.",
  },
} as const;

export default function SignInClient({ enabled: initial, officers, locale, domain }: { enabled: boolean; officers: Officer[]; locale: Lang; domain: string }) {
  const t = T[locale];
  const [enabled, setEnabled] = useState(initial);
  const [busy, setBusy] = useState(false);
  const roles = ["PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER"];
  const allReady = roles.every((r) => { const h = officers.filter((o) => o.role === r); return h.length > 0 && h.every((o) => o.hasOrgIdentity); });

  async function flip() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings/signin", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !enabled }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data.error === "officers_missing" ? t.missing : t.failed);
      setEnabled(!enabled);
      toast.success(data.noticeSent === false && data.changed ? t.savedNoNotice : t.saved);
    } catch { toast.error(t.failed); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">{t.title}</h2>
        <p className="text-neutral-600 max-w-3xl">{t.intro(domain)}</p>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
        <div>
          <p className="font-medium text-neutral-900">{t.label(domain)}</p>
          <p className="text-sm text-neutral-500">{enabled ? t.on : t.off}</p>
        </div>
        <button role="switch" aria-checked={enabled} aria-label={t.label(domain)} disabled={busy || (!enabled && !allReady)} onClick={flip}
          className={`relative h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${enabled ? "bg-primary" : "bg-neutral-300"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${enabled ? "left-5" : "left-0.5"}`} />
        </button>
      </div>
      <div>
        <h3 className="font-semibold text-neutral-900 mb-2">{t.officers}</h3>
        <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
          {roles.map((r) => {
            const holders = officers.filter((o) => o.role === r);
            return (
              <li key={r} className="p-4 flex items-center justify-between gap-3">
                <p className="font-medium text-neutral-900">{ROLE[r][locale]}</p>
                <div className="text-sm text-right">
                  {holders.length === 0 && <span className="text-neutral-500">{t.none}</span>}
                  {holders.map((h) => (
                    <p key={h.patientId} className="flex items-center justify-end gap-1.5">
                      {h.name || "—"} {h.hasOrgIdentity ? <><Check className="w-4 h-4 text-green-600" />{t.linked}</> : <><X className="w-4 h-4 text-amber-600" />{t.notYet}</>}
                    </p>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
