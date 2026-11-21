"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { SITE_TIMEZONE } from "@/lib/site";

type Row = { id: string; name: string; lastActivity: string; contactedAt: string | null };

const T = {
  en: {
    title: "Inactive households",
    intro: (y: number) => `Households with no RSVP, check-in or update in ${y} years. The Privacy Policy says we reach out first and delete only if we don't hear back. Nothing here is deleted automatically.`,
    empty: "No inactive households.",
    name: "Household", last: "Last activity", status: "Status", actions: "Actions",
    notContacted: "Not contacted", contacted: (d: string) => `Contacted ${d}`,
    mark: "Mark contacted", del: "Delete", view: "Open",
    delAsk: (n: string) => `Permanently delete the household "${n}" and everything attached to it (members, consents, RSVPs, check-ins)? This cannot be undone.`,
    done: "Done", err: "Something went wrong",
  },
  es: {
    title: "Hogares inactivos",
    intro: (y: number) => `Hogares sin confirmación de asistencia, registro de entrada ni cambios en ${y} años. La Política de Privacidad dice que primero nos comunicamos y solo borramos si no hay respuesta. Aquí no se borra nada automáticamente.`,
    empty: "No hay hogares inactivos.",
    name: "Hogar", last: "Última actividad", status: "Estado", actions: "Acciones",
    notContacted: "Sin contactar", contacted: (d: string) => `Contactado el ${d}`,
    mark: "Marcar como contactado", del: "Borrar", view: "Abrir",
    delAsk: (n: string) => `¿Borrar de forma permanente el hogar "${n}" y todo lo relacionado (miembros, consentimientos, confirmaciones, registros de entrada)? No se puede deshacer.`,
    done: "Listo", err: "Algo salió mal",
  },
} as const;

export default function InactiveHouseholdsClient({ rows: initial, locale, years }: { rows: Row[]; locale: "en" | "es"; years: number }) {
  const t = T[locale];
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(locale === "es" ? "es-US" : "en-US", { timeZone: SITE_TIMEZONE, year: "numeric", month: "short", day: "numeric" });

  const mark = async (r: Row) => {
    setBusy(r.id);
    try {
      const res = await fetch(`/api/admin/patients/${r.id}/inactive`, { method: "POST" });
      if (!res.ok) throw new Error();
      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, contactedAt: new Date().toISOString() } : x)));
      toast.success(t.done);
    } catch { toast.error(t.err); } finally { setBusy(null); }
  };

  const del = async (r: Row) => {
    if (!window.confirm(t.delAsk(r.name))) return;
    setBusy(r.id);
    try {
      const res = await fetch(`/api/admin/patients/${r.id}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: "DELETE" }),
      });
      if (!res.ok) throw new Error();
      setRows((rs) => rs.filter((x) => x.id !== r.id));
      toast.success(t.done);
      router.refresh();
    } catch { toast.error(t.err); } finally { setBusy(null); }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">{t.title}</h1>
      <p className="text-neutral-600 mb-6 max-w-3xl">{t.intro(years)}</p>
      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-neutral-500">{t.empty}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr><th className="px-4 py-3">{t.name}</th><th className="px-4 py-3">{t.last}</th><th className="px-4 py-3">{t.status}</th><th className="px-4 py-3">{t.actions}</th></tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-neutral-900">{r.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{fmt(r.lastActivity)}</td>
                  <td className="px-4 py-3 text-neutral-600">{r.contactedAt ? t.contacted(fmt(r.contactedAt)) : t.notContacted}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/patients/${r.id}`} className="px-3 py-1.5 rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-50">{t.view}</Link>
                      <button disabled={busy === r.id} onClick={() => mark(r)} className="px-3 py-1.5 rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">{t.mark}</button>
                      <button disabled={busy === r.id} onClick={() => del(r)} className="px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">{t.del}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
