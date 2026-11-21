"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import PlacesAutocompleteInput from "@/components/form/PlacesAutocompleteInput";
import { adminPatientsTranslation } from "@/translation/adminPatients";
import { DIAGNOSIS_VALUES, diagnosisLabels } from "@/lib/patients/diagnoses";
import HouseholdSection, {
  householdComplete,
  membersPayload,
  type MemberDraft,
} from "@/components/household/HouseholdSection";
import { householdTranslation } from "@/translation/household";
import RichText from "@/components/legal/RichText";
import { consentText } from "@/content/consent";
import type { Lang } from "@/types";

export interface PatientFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  language: "en" | "es";
  familySize: number;
  diagnoses: string[]; // the PRIMARY's own
  members?: MemberDraft[]; // create mode only; edit mode manages members on the detail page
  consentData: boolean;
  consentMedia: boolean;
  attestation?: boolean;
}

const input =
  "w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";

export default function PatientForm({
  mode,
  patientId,
  initial,
  canViewPHI,
  locale,
  returnEventId,
}: {
  returnEventId?: string;
  mode: "create" | "edit";
  patientId?: string;
  initial: PatientFormValues;
  canViewPHI: boolean;
  locale: Lang;
}) {
  const t = adminPatientsTranslation[locale];
  const h = householdTranslation[locale];
  const router = useRouter();
  const [v, setV] = useState<Required<PatientFormValues>>({ members: [], attestation: false, ...initial });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Required<PatientFormValues>>(k: K, val: Required<PatientFormValues>[K]) =>
    setV((cur) => ({ ...cur, [k]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.email.trim() && !v.phone.trim()) return toast.error(t.contactError);
    if (mode === "create" && !householdComplete(v.members)) return toast.error(h.errMembers);
    if (mode === "create" && !v.attestation) return toast.error(h.errAttestation);
    setSaving(true);
    try {
      const res = await fetch(
        mode === "create" ? "/api/admin/patients" : `/api/admin/patients/${patientId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: v.firstName,
            lastName: v.lastName,
            email: v.email,
            phone: v.phone,
            address: v.address,
            language: v.language,
            ...(mode === "create"
              ? {
                  familySize: v.members.length + 1,
                  members: membersPayload(v.members, canViewPHI),
                  attestation: v.attestation,
                }
              : {}),
            diagnoses: v.diagnoses,
            consentDataAndContact: v.consentData,
            consentMedia: v.consentMedia,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          data.field === "contact"
            ? t.contactError
            : data.field === "members" || data.field === "familySize"
              ? h.errMembers
              : data.field === "attestation"
                ? h.errAttestation
                : `${t.genericError}${data.field ? ` (${data.field})` : ""}`,
        );
        return;
      }
      toast.success(mode === "create" ? t.created : t.saved);
      if (mode === "create")
        router.push(
          returnEventId
            ? `/admin/events/${returnEventId}/attendees?addPatient=${data.id}`
            : `/admin/patients/${data.id}`,
        );
      else router.refresh();
    } catch {
      toast.error(t.genericError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.firstName} *</label>
          <input className={input} required value={v.firstName} onChange={(e) => set("firstName", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.lastName} *</label>
          <input className={input} required value={v.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.email}</label>
          <input type="email" className={input} value={v.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.phone}</label>
          <input type="tel" className={input} value={v.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.address}</label>
        <PlacesAutocompleteInput value={v.address} onChange={(a) => set("address", a)} className={input} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.language}</label>
          <select className={input} value={v.language} onChange={(e) => set("language", e.target.value === "es" ? "es" : "en")}>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
      </div>
      {mode === "create" ? (
        <HouseholdSection
          locale={locale}
          members={v.members}
          onChange={(m) => set("members", m)}
          showDiagnoses={canViewPHI}
        />
      ) : (
        <p className="text-sm text-neutral-600">
          {t.familySize}: <strong>{v.familySize}</strong>
        </p>
      )}

      {canViewPHI && (
        <fieldset>
          <legend className="text-sm font-medium text-neutral-700">{h.primaryDxTitle}</legend>
          <p className="text-xs text-neutral-500 mb-2">{t.diagnosesNote}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DIAGNOSIS_VALUES.map((d) => (
              <label key={d} className="flex items-center gap-2 text-sm text-neutral-700 p-2 rounded-lg border border-neutral-200">
                <input type="checkbox" checked={v.diagnoses.includes(d)}
                  onChange={() => set("diagnoses", v.diagnoses.includes(d) ? v.diagnoses.filter((x) => x !== d) : [...v.diagnoses, d])} />
                {diagnosisLabels[d][locale]}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-2">
        {mode === "create" && (
          <label className="flex items-start gap-2 text-sm text-neutral-700">
            <input type="checkbox" className="mt-1" checked={v.attestation} onChange={(e) => set("attestation", e.target.checked)} />
            <span><RichText text={consentText.age_guardian_attestation[locale]} locale={locale} newTab /></span>
          </label>
        )}
        <label className="flex items-start gap-2 text-sm text-neutral-700">
          <input type="checkbox" className="mt-1" checked={v.consentData} onChange={(e) => set("consentData", e.target.checked)} />
          {t.consentData}
        </label>
        <label className="flex items-start gap-2 text-sm text-neutral-700">
          <input type="checkbox" className="mt-1" checked={v.consentMedia} onChange={(e) => set("consentMedia", e.target.checked)} />
          {t.consentMedia}
        </label>
      </fieldset>

      <div className="flex justify-end">
        <button type="submit" disabled={saving || (mode === "create" && !householdComplete(v.members))}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? t.saving : mode === "create" ? t.create : t.save}
        </button>
      </div>
    </form>
  );
}
