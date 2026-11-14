"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Download, Loader2 } from "lucide-react";
import { adminPatientsTranslation } from "@/translation/adminPatients";
import { DIAGNOSIS_VALUES, diagnosisLabels } from "@/lib/patients/diagnoses";
import type { Lang } from "@/types";

export interface PatientRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  language: "en" | "es";
  familySize: number;
  diagnoses: string[];
  consentData: boolean | null;
  consentMedia: boolean | null;
  source: string;
  createdAt: string;
  duplicateOfId: string | null;
  duplicateOfName: string | null;
}

const field =
  "px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white";

export default function PatientsTable({
  rows,
  canViewPHI,
  locale,
}: {
  rows: PatientRow[];
  canViewPHI: boolean;
  locale: Lang;
}) {
  const t = adminPatientsTranslation[locale];
  const router = useRouter();
  const [q, setQ] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [language, setLanguage] = useState("");
  const [consent, setConsent] = useState("");
  const [duplicates, setDuplicates] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const digits = needle.replace(/\D/g, "");
    return rows.filter((r) => {
      if (needle) {
        const hit =
          r.name.toLowerCase().includes(needle) ||
          (r.email ?? "").toLowerCase().includes(needle) ||
          (digits.length >= 3 && (r.phone ?? "").replace(/\D/g, "").includes(digits));
        if (!hit) return false;
      }
      if (diagnosis && !r.diagnoses.includes(diagnosis)) return false;
      if (language && r.language !== language) return false;
      if (duplicates && !r.duplicateOfId) return false;
      if (consent) {
        const [type, val] = consent.split("_");
        const cur = type === "data" ? r.consentData : r.consentMedia;
        if (val === "yes" ? cur !== true : cur === true) return false;
      }
      return true;
    });
  }, [rows, q, diagnosis, language, consent, duplicates]);

  const merge = async (id: string) => {
    if (!window.confirm(t.mergeConfirm)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/patients/${id}/merge`, { method: "POST" });
      if (res.ok) {
        toast.success(t.merged);
        router.refresh();
      } else toast.error((await res.json()).error ?? t.genericError);
    } catch {
      toast.error(t.genericError);
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      // Filters go in the POST body, never the URL.
      const res = await fetch("/api/admin/patients/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q, diagnosis, language, consent, duplicates }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `patients-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error(t.genericError);
    } finally {
      setExporting(false);
    }
  };

  const cs = t.consentShort;
  const tri = (v: boolean | null) => (v === null ? cs.none : v ? cs.yes : cs.no);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input className={`${field} w-64`} placeholder={t.search} value={q}
          onChange={(e) => setQ(e.target.value)} />
        {canViewPHI && (
          <select className={field} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}>
            <option value="">{t.allDiagnoses}</option>
            {DIAGNOSIS_VALUES.map((d) => (
              <option key={d} value={d}>{diagnosisLabels[d][locale]}</option>
            ))}
          </select>
        )}
        <select className={field} value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">{t.allLanguages}</option>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <select className={field} value={consent} onChange={(e) => setConsent(e.target.value)}>
          <option value="">{t.anyConsent}</option>
          {Object.entries(t.consentFilters).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" checked={duplicates} onChange={(e) => setDuplicates(e.target.checked)} />
          {t.duplicatesOnly}
        </label>
        <button onClick={exportCsv} disabled={exporting}
          className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {t.exportCsv}
        </button>
      </div>
      <p className="text-xs text-neutral-500 mb-2">{t.count(filtered.length, rows.length)}</p>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              {[t.cols.name, t.cols.phone, t.cols.email, t.cols.language, t.cols.family, t.cols.diagnoses, t.cols.consents, t.cols.source, t.cols.created].map((c) => (
                <th key={c} className="px-4 py-3 font-semibold whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-neutral-400">{t.none}</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50 align-top">
                <td className="px-4 py-3">
                  <Link href={`/admin/patients/${r.id}`} className="font-semibold text-primary hover:underline">
                    {r.name}
                  </Link>
                  {r.duplicateOfId && (
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                        {t.possibleDuplicate}
                      </span>
                      <button onClick={() => merge(r.id)} disabled={busy === r.id}
                        className="text-xs font-semibold text-primary hover:underline disabled:opacity-50">
                        {busy === r.id ? t.merging : t.merge}
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{r.phone ?? "—"}</td>
                <td className="px-4 py-3">{r.email ?? "—"}</td>
                <td className="px-4 py-3 uppercase">{r.language}</td>
                <td className="px-4 py-3">{r.familySize}</td>
                <td className="px-4 py-3">
                  {canViewPHI
                    ? r.diagnoses.length
                      ? r.diagnoses.map((d) => (diagnosisLabels as any)[d]?.[locale] ?? d).join(", ")
                      : "—"
                    : <span className="text-neutral-400">{t.hiddenDx}</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {cs.data}: {tri(r.consentData)}<br />{cs.media}: {tri(r.consentMedia)}
                </td>
                <td className="px-4 py-3">{r.source}</td>
                <td className="px-4 py-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
