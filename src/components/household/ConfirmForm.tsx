"use client";

import { useState } from "react";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { confirmPageTranslation } from "@/translation/confirmPage";
import { consentText } from "@/content/consent";
import { DIAGNOSIS_VALUES, diagnosisLabels } from "@/lib/patients/diagnoses";
import { ageGroupLabels, relationshipLabels, type AgeGroup, type Relationship } from "@/lib/households/constants";
import { withPhone } from "@/lib/site";

const input =
  "w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const btn =
  "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-colors disabled:opacity-60";

export interface ConfirmMember {
  firstName: string;
  lastName: string;
  email: string;
  relationship: string;
  ageGroup: string;
  primaryFirstName: string;
}

export default function ConfirmForm({ token, member }: { token: string; member: ConfirmMember | null }) {
  const { locale } = useLanguage();
  const t = confirmPageTranslation[locale];
  const [firstName, setFirstName] = useState(member?.firstName ?? "");
  const [lastName, setLastName] = useState(member?.lastName ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [consentData, setConsentData] = useState(false);
  const [consentMedia, setConsentMedia] = useState(false);
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [state, setState] = useState<"form" | "confirmed" | "declined" | "invalid">(member ? "form" : "invalid");
  const [error, setError] = useState<string | null>(null);

  const send = async (action: "confirm" | "decline") => {
    setBusy(true);
    setError(null);
    try {
      // POST body only: diagnoses never go in a URL.
      const res = await fetch(`/api/confirm/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "decline"
            ? { action }
            : { action, firstName, lastName, email, diagnoses, consentData, consentMedia, adult },
        ),
      });
      if (res.ok) return setState(action === "confirm" ? "confirmed" : "declined");
      const data = await res.json().catch(() => ({}));
      if (data.error === "invalid_token") return setState("invalid");
      setError(
        data.field && data.field in t.errors
          ? (t.errors as Record<string, string>)[data.field]
          : t.errors.generic,
      );
    } catch {
      setError(t.errors.generic);
    } finally {
      setBusy(false);
    }
  };

  const panel = "bg-white rounded-2xl border border-neutral-200 p-10 text-center";
  if (state === "invalid")
    return (
      <div className={panel}>
        <XCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <h1 className="font-display font-bold text-2xl text-neutral-900 mb-2">{t.invalidTitle}</h1>
        <p className="text-neutral-600">{withPhone(t.invalidBody)}</p>
      </div>
    );
  if (state === "confirmed" || state === "declined")
    return (
      <div className={panel}>
        <CheckCircle className="w-12 h-12 text-secondary mx-auto mb-4" />
        <h1 className="font-display font-bold text-2xl text-neutral-900 mb-2">
          {state === "confirmed" ? t.doneTitle : t.declinedTitle}
        </h1>
        <p className="text-neutral-600">{state === "confirmed" ? t.doneBody : t.declinedBody}</p>
      </div>
    );

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); send("confirm"); }}
      className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 space-y-6"
    >
      <div>
        <h1 className="font-display font-bold text-2xl text-neutral-900 mb-2">{t.title}</h1>
        <p className="text-neutral-600 text-sm">{t.intro(member!.primaryFirstName)}</p>
        <p className="text-sm text-neutral-500 mt-2">
          {t.youAre}:{" "}
          <strong>
            {relationshipLabels[member!.relationship as Relationship]?.[locale] ?? member!.relationship},{" "}
            {ageGroupLabels[member!.ageGroup as AgeGroup]?.[locale] ?? member!.ageGroup}
          </strong>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.firstName} *</label>
          <input className={input} value={firstName} required maxLength={100} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.lastName}</label>
          <input className={input} value={lastName} maxLength={100} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.email}</label>
          <input type="email" className={input} value={email} maxLength={254} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-neutral-700 mb-1">{t.dxTitle}</legend>
        <p className="text-xs text-neutral-500 mb-3">{t.dxHint}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DIAGNOSIS_VALUES.map((d) => (
            <label key={d} className="flex items-center gap-2 text-sm text-neutral-700 p-2 rounded-lg border border-neutral-200 cursor-pointer">
              <input type="checkbox" checked={diagnoses.includes(d)}
                onChange={() => setDiagnoses((c) => (c.includes(d) ? c.filter((x) => x !== d) : [...c, d]))} />
              {diagnosisLabels[d][locale]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-neutral-700 mb-1">{t.consentHeading}</legend>
        <label className="flex items-start gap-3 text-sm text-neutral-700">
          <input type="checkbox" className="mt-1" checked={adult} onChange={(e) => setAdult(e.target.checked)} required />
          <span><strong>{t.adultLabel}.</strong> {consentText.member_adult_attestation[locale]}</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-neutral-700">
          <input type="checkbox" className="mt-1" checked={consentData} onChange={(e) => setConsentData(e.target.checked)} required />
          <span><strong>{t.consentRequired}.</strong> {consentText.member_data_and_contact[locale]}</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-neutral-700">
          <input type="checkbox" className="mt-1" checked={consentMedia} onChange={(e) => setConsentMedia(e.target.checked)} />
          <span><strong>{t.consentOptional}.</strong> {consentText.member_media[locale]}</span>
        </label>
      </fieldset>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <button type="submit" disabled={busy || !consentData || !adult || !firstName.trim()}
          className={`${btn} bg-primary text-white hover:bg-primary-600`}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {busy ? t.working : t.confirm}
        </button>
        {!asking ? (
          <button type="button" disabled={busy} onClick={() => setAsking(true)}
            className={`${btn} border border-neutral-300 text-neutral-700 hover:bg-neutral-50`}>
            {t.decline}
          </button>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900 space-y-2">
            <p>{t.declineAsk}</p>
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={() => send("decline")}
                className={`${btn} bg-red-600 text-white hover:bg-red-700 !py-2`}>{t.declineYes}</button>
              <button type="button" disabled={busy} onClick={() => setAsking(false)}
                className={`${btn} border border-neutral-300 bg-white !py-2`}>{t.cancel}</button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
