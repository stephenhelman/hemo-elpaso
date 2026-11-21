"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { CheckCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { registerInfoTranslation } from "@/translation/registerInfoPage";
import { withPhone } from "@/lib/site";
import { trackEvent } from "@/lib/analytics";
import LegalLinks from "@/components/legal/LegalLinks";
import RichText from "@/components/legal/RichText";
import { consentText, CONSENT_TEXT_VERSION } from "@/content/consent";
import { DIAGNOSIS_VALUES, diagnosisLabels } from "@/lib/patients/diagnoses";
import HouseholdSection, {
  householdComplete,
  membersPayload,
  type MemberDraft,
} from "@/components/household/HouseholdSection";
import AttendeeChecklist, { attendeesValid, type AttendeeOption, type AttendeeState } from "@/components/household/AttendeeChecklist";
import { householdTranslation } from "@/translation/household";

const input =
  "w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";

export default function RegisterInfoForm({
  turnstileSiteKey,
  eventId,
}: {
  turnstileSiteKey: string | null;
  /** When set, this is a public event RSVP: adds party size, posts to /api/rsvp/public. */
  eventId?: string;
}) {
  const { locale } = useLanguage();
  const t = registerInfoTranslation[locale];
  const h = householdTranslation[locale];

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [language, setLanguage] = useState<"en" | "es">(locale);
  const [members, setMembers] = useState<MemberDraft[]>([]);
  const householdSize = members.length + 1; // primary + members: always in sync
  // RSVP mode: who is coming. Everyone is checked by default, so we track who was UNchecked.
  const [excluded, setExcluded] = useState<string[]>([]);
  const [primaryComing, setPrimaryComing] = useState(true);
  const [guests, setGuests] = useState(0);
  const [attestation, setAttestation] = useState(false);
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [consentData, setConsentData] = useState(false);
  const [consentMedia, setConsentMedia] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const renderWidget = () => {
    const ts = (window as any).turnstile;
    if (!turnstileSiteKey || !ts || !widgetRef.current || widgetId.current) return;
    widgetId.current = ts.render(widgetRef.current, {
      sitekey: turnstileSiteKey,
      callback: (tk: string) => setToken(tk),
      "expired-callback": () => setToken(""),
    });
  };

  useEffect(() => {
    renderWidget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listed = members.filter((m) => m.firstName.trim());
  const options: AttendeeOption[] = listed.map((m) => ({
    id: m.uid, label: m.firstName.trim(), relationship: m.relationship, ageGroup: m.ageGroup,
    status: m.ageGroup === "18_plus" ? "pending" : "not_required",
  }));
  const attendeeState: AttendeeState = {
    primary: primaryComing, guests,
    memberIds: options.filter((o) => !excluded.includes(o.id)).map((o) => o.id),
  };
  const setAttendees = (v: AttendeeState) => {
    setPrimaryComing(v.primary);
    setGuests(v.guests);
    setExcluded(options.filter((o) => !v.memberIds.includes(o.id)).map((o) => o.id));
  };

  const toggleDiagnosis = (d: string) =>
    setDiagnoses((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d],
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // POST body only: diagnoses never go in a URL or query string.
      const res = await fetch(eventId ? "/api/rsvp/public" : "/api/register-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          address,
          language,
          familySize: householdSize,
          members: membersPayload(members),
          attestation,
          ...(eventId
            ? {
                eventId,
                // positions in `members` (the server maps them to the new member ids)
                attendees: {
                  primary: primaryComing,
                  memberIndexes: members.map((m, i) => (!excluded.includes(m.uid) && m.firstName.trim() ? i : -1)).filter((i) => i >= 0),
                  guests,
                },
              }
            : {}),
          diagnoses,
          consentDataAndContact: consentData,
          consentMedia,
          website,
          turnstileToken: token,
        }),
      });
      if (res.ok) {
        trackEvent(eventId ? { name: "rsvp_submitted", source: "public" } : { name: "register_info_submitted" });
        setDone(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.error === "captcha") setError(t.errors.captcha);
      else if (data.error === "full") setError(withPhone(t.full));
      else if (data.error === "closed" || data.error === "disabled") setError(withPhone(t.closed));
      else if (data.field === "members" || data.field === "familySize") setError(h.errMembers);
      else if (data.field === "attestation") setError(h.errAttestation);
      else if (data.field && data.field in t.errors)
        setError((t.errors as Record<string, string>)[data.field]);
      else setError(t.errors.generic);
      (window as any).turnstile?.reset(widgetId.current ?? undefined);
      setToken("");
    } catch {
      setError(t.errors.generic);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center">
        <CheckCircle className="w-12 h-12 text-secondary mx-auto mb-4" />
        <h2 className="font-display font-bold text-2xl text-neutral-900 mb-2">
          {eventId ? t.rsvpSuccessTitle : t.successTitle}
        </h2>
        <p className="text-neutral-600">{eventId ? t.rsvpSuccessBody : t.successBody}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 space-y-6"
    >
      {turnstileSiteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={renderWidget}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {t.firstName} *
          </label>
          <input className={input} value={firstName} required maxLength={100}
            onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {t.lastName} *
          </label>
          <input className={input} value={lastName} required maxLength={100}
            onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {t.email}
          </label>
          <input type="email" className={input} value={email} maxLength={254}
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {t.phone}
          </label>
          <input type="tel" className={input} value={phone} maxLength={40}
            onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </div>
      </div>
      <p className="text-xs text-neutral-500 -mt-3">{t.contactHint}</p>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {t.address} <span className="text-neutral-400">({t.optional})</span>
        </label>
        {/* Plain input on purpose: no Google Places script on a public page where health information is entered. */}
        <input
          type="text"
          className={input}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t.addressPlaceholder}
          maxLength={300}
          autoComplete="street-address"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            {t.language}
          </label>
          <select className={input} value={language}
            onChange={(e) => setLanguage(e.target.value === "es" ? "es" : "en")}>
            <option value="en">{t.english}</option>
            <option value="es">{t.spanish}</option>
          </select>
        </div>
      </div>

      <HouseholdSection locale={locale} members={members} onChange={setMembers} />

      {eventId && (
        <AttendeeChecklist locale={locale} primaryName={firstName.trim()} options={options} value={attendeeState} onChange={setAttendees} />
      )}

      <fieldset>
        <legend className="block text-sm font-medium text-neutral-700 mb-1">
          {h.primaryDxTitle}
        </legend>
        <p className="text-xs text-neutral-500 mb-3">{h.primaryDxHint}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DIAGNOSIS_VALUES.map((d) => (
            <label key={d} className="flex items-center gap-2 text-sm text-neutral-700 p-2 rounded-lg border border-neutral-200 cursor-pointer hover:border-primary-200">
              <input type="checkbox" checked={diagnoses.includes(d)}
                onChange={() => toggleDiagnosis(d)} />
              {diagnosisLabels[d][locale]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-neutral-700 mb-1">
          {t.consentHeading}
        </legend>
        <label className="flex items-start gap-3 text-sm text-neutral-700">
          <input type="checkbox" className="mt-1" checked={attestation}
            onChange={(e) => setAttestation(e.target.checked)} required />
          <span>
            <strong>{h.attestationLabel}.</strong> <RichText text={consentText.age_guardian_attestation[locale]} locale={locale} newTab />
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-neutral-700">
          <input type="checkbox" className="mt-1" checked={consentData}
            onChange={(e) => setConsentData(e.target.checked)} required />
          <span>
            <strong>{t.consentDataLabel}.</strong>{" "}
            <RichText text={consentText.data_and_contact[locale]} locale={locale} newTab />
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-neutral-700">
          <input type="checkbox" className="mt-1" checked={consentMedia}
            onChange={(e) => setConsentMedia(e.target.checked)} />
          <span>
            <strong>{t.consentMediaLabel}.</strong> <RichText text={consentText.media[locale]} locale={locale} newTab />
          </span>
        </label>
        <LegalLinks locale={locale} which={["privacy", "children", "terms"]} />
        <p className="text-[11px] text-neutral-400">v: {CONSENT_TEXT_VERSION}</p>
      </fieldset>

      {/* Honeypot: hidden from people and assistive tech */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", height: 0, overflow: "hidden" }}>
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website}
            onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      {turnstileSiteKey && <div ref={widgetRef} />}

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || !householdComplete(members) || !attestation || (!!eventId && !attendeesValid(attendeeState)) || (!!turnstileSiteKey && !token)}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? t.submitting : eventId ? t.rsvpSubmit : t.submit}
      </button>
    </form>
  );
}
