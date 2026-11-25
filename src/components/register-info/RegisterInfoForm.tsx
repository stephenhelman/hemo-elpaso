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
import { defaultFlyerDelivery, type FlyerDelivery } from "@/lib/flyers";
import { flyerText } from "@/lib/flyers/text";
import AddressFields from "@/components/form/AddressFields";
import { emptyAddress, type AddressDraft } from "@/lib/address/draft";
import { householdTranslation } from "@/translation/household";

const input =
  "w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";

export default function RegisterInfoForm({
  turnstileSiteKey,
  addressAutocomplete = false,
  eventId = null,
  phoneOnly = false,
}: {
  /** The event the visitor came from (validated on the server). Finishing registration also sends a request to attend it. */
  eventId?: string | null;
  /** "Register for a phone call": the phone is required and the email optional. */
  phoneOnly?: boolean;
  turnstileSiteKey: string | null;
  /** The address_autocomplete toggle, decided on the server. Off = the Google script is never loaded. */
  addressAutocomplete?: boolean;
}) {
  const { locale } = useLanguage();
  const t = registerInfoTranslation[locale];
  const h = householdTranslation[locale];

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [canText, setCanText] = useState<"yes" | "no" | "">("");
  const [address, setAddress] = useState<AddressDraft>(emptyAddress());
  const [badField, setBadField] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "es">(locale);
  const [flyerChoice, setFlyerChoice] = useState<FlyerDelivery | null>(null); // null = automatic
  const [members, setMembers] = useState<MemberDraft[]>([]);
  const householdSize = members.length + 1; // primary + members: always in sync
  const [attestation, setAttestation] = useState(false);
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [consentData, setConsentData] = useState(false);
  const [consentMedia, setConsentMedia] = useState(false);
  const [consentSms, setConsentSms] = useState(false);
  const [consentNewsletter, setConsentNewsletter] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Flyer delivery: the default follows what was typed (email, else a complete address, else none) until the person chooses.
  const autoFlyer = defaultFlyerDelivery({ email, address: { addressLine1: address.line1, city: address.city, state: address.state, zipCode: address.zip } });
  const flyerDelivery: FlyerDelivery = flyerChoice && !(flyerChoice === "email" && !email.trim()) ? flyerChoice : autoFlyer;
  const ft = flyerText[locale];
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

  const toggleDiagnosis = (d: string) =>
    setDiagnoses((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d],
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setBadField(null);
    setSubmitting(true);
    try {
      // POST body only: diagnoses never go in a URL or query string.
      const res = await fetch("/api/register-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          phoneCanText: phone.trim() ? (canText === "yes" ? true : canText === "no" ? false : null) : null,
          eventId: eventId ?? undefined,
          mode: phoneOnly ? "phone" : undefined,
          address,
          language,
          flyerDelivery,
          familySize: householdSize,
          members: membersPayload(members),
          attestation,
          diagnoses,
          consentDataAndContact: consentData,
          consentMedia,
          consentSms,
          consentNewsletter,
          website,
          turnstileToken: token,
        }),
      });
      if (res.ok) {
        trackEvent({ name: "register_info_submitted" });
        setDone(true);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data.error === "captcha") setError(t.errors.captcha);
      else if (data.field === "addressLine1" || data.field === "city" || data.field === "state" || data.field === "zip") { setBadField(data.field); setError(null); }
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
          {t.successTitle}
        </h2>
        <p className="text-neutral-600">{t.successBody}</p>
        <p className="text-neutral-700 mt-3 font-medium">{t.reviewNote}</p>
        {phoneOnly && <p className="text-neutral-700 mt-3 font-medium">{t.successCall}</p>}
        {eventId && <p className="text-neutral-600 mt-3 text-sm">{t.successEvent}</p>}
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

      {(phoneOnly || eventId) && (
        <div className="rounded-lg bg-primary-50 border border-primary-200 p-3 text-sm text-neutral-800 space-y-1" role="note">
          {phoneOnly && <p><strong>{t.phoneMode}.</strong> {t.phoneModeNote}</p>}
          {eventId && <p>{t.eventNote}</p>}
        </div>
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
            {t.phone}{phoneOnly ? " *" : ""}
          </label>
          <input type="tel" className={input} value={phone} maxLength={40} required={phoneOnly}
            onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </div>
      </div>
      <p className="text-xs text-neutral-500 -mt-3">{t.contactHint}</p>
      {phone.trim() && (
        <fieldset className="-mt-2">
          <legend className="block text-sm font-medium text-neutral-700 mb-1.5">{t.canText}</legend>
          <div className="flex flex-wrap gap-4 text-sm text-neutral-700">
            {([["yes", t.canTextYes], ["no", t.canTextNo], ["", t.canTextUnsure]] as const).map(([v, label]) => (
              <label key={v || "unsure"} className="inline-flex items-center gap-2">
                <input type="radio" name="canText" checked={canText === v} onChange={() => setCanText(v)} />{label}
              </label>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-1">{t.canTextHint}</p>
        </fieldset>
      )}

      <div>
        <p className="block text-sm font-medium text-neutral-700 mb-1.5">
          {t.address} <span className="text-neutral-400">({t.optional})</span>
        </p>
        {/* Google suggestions only when the address_autocomplete toggle is on; the script loads after the street field is focused. */}
        <AddressFields value={address} onChange={setAddress} locale={locale} autocomplete={addressAutocomplete} invalidField={badField} />
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

      <fieldset>
        <legend className="block text-sm font-medium text-neutral-700 mb-1">{ft.question}</legend>
        <p className="text-xs text-neutral-500 mb-2">{ft.help}</p>
        <div className="space-y-2">
          {([["email", ft.email], ["mail", ft.mail], ["none", ft.none]] as const).map(([v, label]) => {
            const disabled = v === "email" && !email.trim();
            return (
              <label key={v} className={`flex items-start gap-2 text-sm ${disabled ? "text-neutral-400" : "text-neutral-800"}`}>
                <input type="radio" name="flyerDelivery" className="mt-1" checked={flyerDelivery === v} disabled={disabled} onChange={() => setFlyerChoice(v)} />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <HouseholdSection locale={locale} members={members} onChange={setMembers} />

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
        <label className="flex items-start gap-3 text-sm text-neutral-700">
          <input type="checkbox" className="mt-1" checked={consentSms}
            onChange={(e) => setConsentSms(e.target.checked)} />
          <span>
            <strong>{t.consentMediaLabel}.</strong> <RichText text={consentText.sms[locale]} locale={locale} newTab />
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-neutral-700">
          <input type="checkbox" className="mt-1" checked={consentNewsletter}
            onChange={(e) => setConsentNewsletter(e.target.checked)} />
          <span>
            <strong>{t.consentMediaLabel}.</strong> <RichText text={consentText.newsletter[locale]} locale={locale} newTab />
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
        disabled={submitting || !householdComplete(members) || !attestation || (!!turnstileSiteKey && !token)}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-60"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? t.submitting : t.submit}
      </button>
    </form>
  );
}
