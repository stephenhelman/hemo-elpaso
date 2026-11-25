"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { householdTranslation } from "@/translation/household";
import { diagnosisLabels } from "@/lib/patients/diagnoses";
import {
  ageGroupLabels,
  memberStatusLabels,
  relationshipLabels,
  type AgeGroup,
  type MemberStatus,
  type Relationship,
} from "@/lib/households/constants";

export interface MemberRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  relationship: string;
  ageGroup: string;
  status: string;
  confirmByPhone: boolean;
  hasEmail: boolean;
  /** empty unless the viewer has canViewPHI */
  diagnoses: string[];
}

const badge: Record<string, string> = {
  not_required: "bg-neutral-100 text-neutral-700",
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  expired: "bg-neutral-200 text-neutral-600",
};
const link = "text-xs font-semibold text-primary hover:underline disabled:opacity-50";

export default function HouseholdPanel({
  patientId,
  members,
  canViewPHI,
  locale,
}: {
  patientId: string;
  members: MemberRow[];
  canViewPHI: boolean;
  locale: "en" | "es";
}) {
  const t = householdTranslation[locale];
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [phoneFor, setPhoneFor] = useState<string | null>(null);
  const [data, setData] = useState(false);
  const [media, setMedia] = useState(false);
  const [adult, setAdult] = useState(false);

  const call = async (key: string, url: string, init: RequestInit, okMsg: string, failMsg: string) => {
    setBusy(key);
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(okMsg);
        setPhoneFor(null);
        setData(false); setMedia(false); setAdult(false);
      } else toast.error(`${failMsg}${d.error ? ` (${d.error})` : ""}`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };
  const base = (id: string) => `/api/admin/patients/${patientId}/members/${id}`;
  const name = (m: MemberRow) =>
    m.firstName
      ? `${m.firstName} ${m.lastName ?? ""}`.trim()
      : m.status === "declined" ? t.declinedPlaceholder : t.expiredPlaceholder;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6" id="members">
      <h2 className="font-semibold text-neutral-900 mb-3">{t.panelTitle}</h2>
      {members.length === 0 ? (
        <p className="text-sm text-neutral-500">{t.noMembers}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="py-2">{t.colName}</th><th>{t.colRelationship}</th><th>{t.colAge}</th><th>{t.colStatus}</th>
                {canViewPHI && <th>{t.colDx}</th>}<th />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {members.map((m) => (
                <tr key={m.id} className="align-top">
                  <td className="py-2 font-medium">
                    {name(m)}
                    {m.status === "pending" && m.confirmByPhone && (
                      <span className="ml-2 text-xs font-normal text-amber-700">{t.byPhone}</span>
                    )}
                  </td>
                  <td>{relationshipLabels[m.relationship as Relationship]?.[locale] ?? m.relationship}</td>
                  <td>{ageGroupLabels[m.ageGroup as AgeGroup]?.[locale] ?? m.ageGroup}</td>
                  <td>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${badge[m.status] ?? ""}`}>
                      {memberStatusLabels[m.status as MemberStatus]?.[locale] ?? m.status}
                    </span>
                  </td>
                  {canViewPHI && (
                    <td>{m.diagnoses.length ? m.diagnoses.map((d) => (diagnosisLabels as any)[d]?.[locale] ?? d).join(", ") : "—"}</td>
                  )}
                  <td className="py-2 text-right space-x-3 whitespace-nowrap">
                    {m.status === "pending" && m.hasEmail && (
                      <button className={link} disabled={busy === m.id}
                        onClick={() => call(m.id, base(m.id), { method: "POST", body: JSON.stringify({ action: "resend" }) }, t.resent, t.resendFailed)}>
                        {t.resend}
                      </button>
                    )}
                    {m.status === "pending" && (
                      <button className={link} onClick={() => setPhoneFor(phoneFor === m.id ? null : m.id)}>
                        {t.phoneConfirm}
                      </button>
                    )}
                    {m.status === "confirmed" && m.ageGroup === "18_plus" && (
                      <button className={link} disabled={busy === m.id}
                        onClick={() => {
                          if (window.confirm(t.withdrawMediaAsk))
                            call(m.id, base(m.id), { method: "POST", body: JSON.stringify({ action: "withdraw_media" }) }, t.withdrawMediaDone, t.resendFailed);
                        }}>
                        {t.withdrawMedia}
                      </button>
                    )}
                    <button className={`${link} !text-red-600`} disabled={busy === m.id}
                      onClick={() => {
                        if (window.confirm(t.removeAsk))
                          call(m.id, base(m.id), { method: "DELETE" }, t.removed, t.resendFailed);
                      }}>
                      {t.removeMember}
                    </button>
                    {phoneFor === m.id && (
                      <div className="mt-2 text-left rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-2 whitespace-normal">
                        <p className="text-xs font-semibold text-neutral-700">{t.phoneTitle}</p>
                        <p className="text-xs text-neutral-500">{t.phoneNoHealth}</p>
                        <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />{t.phoneAdultLabel}</label>
                        <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={data} onChange={(e) => setData(e.target.checked)} />{t.phoneDataLabel}</label>
                        <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={media} onChange={(e) => setMedia(e.target.checked)} />{t.phoneMediaLabel}</label>
                        <div className="flex gap-3">
                          <button className={link} disabled={!data || !adult || busy === m.id}
                            onClick={() => call(m.id, base(m.id), { method: "POST", body: JSON.stringify({ action: "phone_confirm", consentData: data, consentMedia: media, adult }) }, t.phoneConfirmed, t.resendFailed)}>
                            {t.save}
                          </button>
                          <button className="text-xs text-neutral-500" onClick={() => setPhoneFor(null)}>{t.cancel}</button>
                        </div>
                      </div>
                    )}
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
