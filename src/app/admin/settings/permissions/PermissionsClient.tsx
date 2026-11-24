"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Lock } from "lucide-react";
import type { Lang } from "@/types";

type Matrix = Record<string, string[]>;
interface Perm { key: string; label: string; category: "data" | "settings"; phi: boolean }

const T = {
  en: {
    title: "Permissions", intro: "Which roles can do what. Locked cells can't be changed here. Every save is logged and emailed to the four officers.",
    save: "Save changes", saving: "Saving…", saved: "Saved. Officers were notified.", savedNoNotice: "Saved, but the officer notice could not be sent.", nochange: "No changes to save.",
    failed: "Could not save.", locked: "That cell is locked.", noManager: "At least one of President or Vice President must keep “Manage patients and households”.",
    loadError: "The saved permissions could not be read; showing the built-in defaults.", warn: "No one currently holds the President or Vice President role, so no one can see family records. Assign one under Board Management.",
    role: "Role", data: "Data permissions", settings: "Settings permissions", phi: "Health or family contact information",
  },
  es: {
    title: "Permisos", intro: "Qué puede hacer cada cargo. Las celdas bloqueadas no se pueden cambiar aquí. Cada cambio se registra y se avisa por correo a los cuatro oficiales.",
    save: "Guardar cambios", saving: "Guardando…", saved: "Guardado. Se avisó a los oficiales.", savedNoNotice: "Guardado, pero no se pudo enviar el aviso a los oficiales.", nochange: "No hay cambios que guardar.",
    failed: "No se pudo guardar.", locked: "Esa celda está bloqueada.", noManager: "Al menos uno entre Presidente o Vicepresidente debe conservar “Administrar pacientes y hogares”.",
    loadError: "No se pudieron leer los permisos guardados; se muestran los valores predeterminados.", warn: "Nadie tiene actualmente el cargo de Presidente o Vicepresidente, así que nadie puede ver los registros de las familias. Asigne uno en Administración de la junta.",
    role: "Cargo", data: "Permisos de datos", settings: "Permisos de configuración", phi: "Información de salud o de contacto de familias",
  },
} as const;

const ROLE_LABEL: Record<string, { en: string; es: string }> = {
  PRESIDENT: { en: "President", es: "Presidente/a" }, VICE_PRESIDENT: { en: "Vice President", es: "Vicepresidente/a" },
  SECRETARY: { en: "Secretary", es: "Secretario/a" }, TREASURER: { en: "Treasurer", es: "Tesorero/a" },
  EVENTS_COORDINATOR: { en: "Events Coord.", es: "Coord. de Eventos" }, SPONSOR_LIAISON: { en: "Sponsor Liaison", es: "Enlace de Patrocinadores" },
  COMMUNICATIONS_LEAD: { en: "Comms Lead", es: "Líder de Comunic." }, YOUTH_COORDINATOR: { en: "Youth Coord.", es: "Coord. de Jóvenes" },
  VOLUNTEER_COORDINATOR: { en: "Volunteer Coord.", es: "Coord. de Voluntarios" }, FUNDRAISING_COORDINATOR: { en: "Fundraising Coord.", es: "Coord. de Recaudación" },
  BOARD_MEMBER_AT_LARGE: { en: "At Large", es: "En General" }, ADMIN: { en: "Admin (settings only)", es: "Admin (solo configuración)" },
};

export default function PermissionsClient({ roles, perms, initial, locks, locale, loadError, noPresidentOrVp }: {
  roles: string[]; perms: Perm[]; initial: Matrix; locks: Record<string, { value: boolean; text: string }>; locale: Lang; loadError: boolean; noPresidentOrVp: boolean;
}) {
  const t = T[locale];
  const [saved, setSaved] = useState<Matrix>(initial);
  const [m, setM] = useState<Matrix>(initial);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(sort(m)) !== JSON.stringify(sort(saved));

  const toggle = (role: string, key: string) => {
    if (locks[`${role}:${key}`]) return;
    setM((cur) => ({ ...cur, [role]: cur[role].includes(key) ? cur[role].filter((k) => k !== key) : [...cur[role], key] }));
  };

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings/permissions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matrix: m }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error === "no_user_manager" ? t.noManager : data.error === "locked_cell" ? t.locked : t.failed);
        return;
      }
      if (!data.changed) toast(t.nochange);
      else toast.success(data.noticeSent ? t.saved : t.savedNoNotice);
      setSaved(data.matrix);
      setM(data.matrix);
    } catch {
      toast.error(t.failed);
    } finally {
      setBusy(false);
    }
  }

  const groups: { title: string; list: Perm[] }[] = [
    { title: t.data, list: perms.filter((p) => p.category === "data") },
    { title: t.settings, list: perms.filter((p) => p.category === "settings") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">{t.title}</h2>
        <p className="text-neutral-600 max-w-3xl">{t.intro}</p>
        {loadError && <p className="mt-3 text-sm text-amber-700">{t.loadError}</p>}
        {noPresidentOrVp && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {t.warn}
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="sticky left-0 bg-white p-3 text-left font-semibold">{t.role} →</th>
              {roles.map((r) => (
                <th key={r} className="p-3 text-center font-medium text-neutral-700 min-w-[88px]">{ROLE_LABEL[r]?.[locale] ?? r}</th>
              ))}
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g.title}>
              <tr><td colSpan={roles.length + 1} className="bg-neutral-50 p-2 pl-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">{g.title}</td></tr>
              {g.list.map((p) => (
                <tr key={p.key} className="border-t border-neutral-100">
                  <td className="sticky left-0 bg-white p-3">
                    <span className="text-neutral-900">{p.label}</span>
                    {p.phi && <span title={t.phi} className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">PHI</span>}
                  </td>
                  {roles.map((r) => {
                    const lock = locks[`${r}:${p.key}`];
                    const on = lock ? lock.value : m[r]?.includes(p.key);
                    return (
                      <td key={r} className="p-3 text-center" title={lock?.text}>
                        {lock ? (
                          <span className="inline-flex items-center gap-1 text-neutral-400" aria-label={lock.text}>
                            <Lock className="w-3.5 h-3.5" />{on ? "✓" : "–"}
                          </span>
                        ) : (
                          <input type="checkbox" checked={!!on} onChange={() => toggle(r, p.key)} className="h-4 w-4 accent-primary" aria-label={`${p.label} — ${ROLE_LABEL[r]?.[locale] ?? r}`} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      <button onClick={save} disabled={busy || !dirty} className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-50">
        {busy ? t.saving : t.save}
      </button>
    </div>
  );
}

const sort = (m: Matrix) => Object.fromEntries(Object.keys(m).sort().map((k) => [k, [...m[k]].sort()]));
