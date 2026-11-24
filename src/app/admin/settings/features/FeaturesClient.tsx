"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Lock } from "lucide-react";
import type { Lang } from "@/types";

export interface FeatureView { key: string; label: string; locked: string | null; enabled: boolean; enabledAt: string | null }

const T = {
  en: { title: "Feature toggles", intro: "Turns planned features on. A feature can be switched on only once it is built and the published privacy policy covers it. The policy page shows “Not yet available” or “Available since …” from these switches. Every change is logged and emailed to the four officers.", policy: "Live privacy policy version", on: "On", off: "Off", since: "since", saved: "Saved. Officers were notified.", savedNoNotice: "Saved, but the officer notice could not be sent.", failed: "Could not save.", locked: "That feature can't be turned on yet.", placeholders: "A value in the privacy policy is still to be set for this feature (see src/content/legal/meta.ts).", loadError: "The saved toggles could not be read; everything shows as off." },
  es: { title: "Funciones activables", intro: "Activa las funciones planeadas. Una función solo se puede activar cuando ya está construida y la política de privacidad publicada la cubre. La página de la política muestra “Aún no disponible” o “Disponible desde …” según estos interruptores. Cada cambio se registra y se avisa por correo a los cuatro oficiales.", policy: "Versión vigente de la política de privacidad", on: "Activa", off: "Inactiva", since: "desde", saved: "Guardado. Se avisó a los oficiales.", savedNoNotice: "Guardado, pero no se pudo enviar el aviso a los oficiales.", failed: "No se pudo guardar.", locked: "Esa función todavía no se puede activar.", placeholders: "Falta definir un dato de la política de privacidad para esta función (vea src/content/legal/meta.ts).", loadError: "No se pudieron leer los interruptores guardados; todo aparece inactivo." },
} as const;

export default function FeaturesClient({ features, locale, loadError, policyVersion }: { features: FeatureView[]; locale: Lang; loadError: boolean; policyVersion: number }) {
  const t = T[locale];
  const [list, setList] = useState(features);
  const [busy, setBusy] = useState<string | null>(null);

  async function flip(f: FeatureView) {
    setBusy(f.key);
    try {
      const res = await fetch("/api/admin/settings/features", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: f.key, enabled: !f.enabled }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error === "locked" ? t.locked : data.error === "placeholders" ? t.placeholders : t.failed); return; }
      setList((cur) => cur.map((x) => (x.key === f.key ? { ...x, enabled: !f.enabled, enabledAt: !f.enabled ? new Date().toISOString() : null } : x)));
      toast.success(data.changed === false || data.noticeSent ? t.saved : t.savedNoNotice);
    } catch { toast.error(t.failed); } finally { setBusy(null); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">{t.title}</h2>
        <p className="text-neutral-600 max-w-3xl">{t.intro}</p>
        <p className="mt-2 text-sm text-neutral-500">{t.policy}: v{policyVersion}</p>
        {loadError && <p className="mt-3 text-sm text-amber-700">{t.loadError}</p>}
      </div>
      <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
        {list.map((f) => (
          <li key={f.key} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium text-neutral-900">{f.label} <code className="ml-1 text-xs text-neutral-400">{f.key}</code></p>
              <p className="text-sm text-neutral-500">
                {f.locked ? <span className="inline-flex items-center gap-1"><Lock className="w-3.5 h-3.5" />{f.locked}</span>
                  : f.enabled ? `${t.on} ${t.since} ${f.enabledAt ? new Date(f.enabledAt).toLocaleDateString(locale === "es" ? "es-US" : "en-US", { timeZone: "America/Denver" }) : ""}` : t.off}
              </p>
            </div>
            <button role="switch" aria-checked={f.enabled} aria-label={f.label} disabled={(!!f.locked && !f.enabled) || busy === f.key} onClick={() => flip(f)}
              className={`relative h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${f.enabled ? "bg-primary" : "bg-neutral-300"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${f.enabled ? "left-5" : "left-0.5"}`} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
