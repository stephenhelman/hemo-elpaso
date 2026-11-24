import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocaleCookie } from "@/lib/locale";
import { resolveSession } from "@/lib/identity/session";
import { isFeatureEnabled, getFeatureStates } from "@/lib/features";
import { portalGate } from "@/lib/portal/rules";
import { loadHousehold, type PortalRsvp } from "@/lib/portal/household";
import { auditPortalView } from "@/lib/portal/service";
import { portalText } from "@/lib/portal/text";
import { diagnosisLabels, type Diagnosis } from "@/lib/patients/diagnoses";
import { ageGroupLabels, type AgeGroup } from "@/lib/households/constants";
import { formatEventDateTime } from "@/lib/datetime";
import { CONSENT_TEXT_VERSION, consentTextVersions } from "@/content/consent";
import LegalLinks from "@/components/legal/LegalLinks";
import ConsentSwitches from "./ConsentSwitches";

export const metadata: Metadata = { title: "My household", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6";
const h2 = "font-display font-semibold text-neutral-900 text-lg mb-3";

export default async function PortalPage() {
  const lang: "en" | "es" = (await getLocaleCookie()) === "es" ? "es" : "en";
  const t = portalText[lang];

  // middleware.ts already requires a linked household; this is the second check (and the only one for server rendering).
  const s = await resolveSession();
  const gate = portalGate(s, await isFeatureEnabled("family_portal"));
  if (gate === "login") redirect("/api/auth/login?returnTo=/portal");
  if (gate === "no-household" || !s?.patient) redirect("/no-household");

  if (gate === "coming-soon") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md text-center">
          <h1 className="font-display font-bold text-neutral-900 text-2xl mb-3">{t.comingTitle}</h1>
          <p className="text-neutral-600 text-sm mb-6">{t.comingBody}</p>
          <Link href="/" className="text-sm text-primary font-semibold">{t.home}</Link>
        </div>
      </div>
    );
  }

  const h = await loadHousehold(s.patient.id);
  if (!h) redirect("/no-household");
  await auditPortalView(s.patient.id);

  const features = await getFeatureStates();
  const text = consentTextVersions[CONSENT_TEXT_VERSION as keyof typeof consentTextVersions] as unknown as Record<string, { en: string; es: string }>;
  const diag = (list: string[]) => list.map((d) => diagnosisLabels[d as Diagnosis]?.[lang] ?? d).join(", ");
  const when = (iso: string) => formatEventDateTime(iso, lang);
  const evTitle = (x: { title: { en: string; es: string } }) => x.title[lang];

  const RsvpRow = ({ r }: { r: PortalRsvp }) => (
    <li className="py-3 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-neutral-900">{evTitle(r)}</p>
        <p className="text-sm text-neutral-600">{when(r.eventDate)} · {r.location}</p>
        <p className="text-xs text-neutral-500">{r.cancelled ? t.cancelled : t.people_n(r.partySize)}</p>
      </div>
      {r.link && <Link href={r.link} className="text-sm font-semibold text-primary hover:underline">{r.past ? t.view : t.change}</Link>}
    </li>
  );

  return (
    <div className="bg-neutral-50 min-h-[70vh] px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-display font-bold text-neutral-900 text-3xl">{t.title}</h1>
          <p className="mt-1 text-neutral-700">{t.hello(h.firstName)}</p>
          <p className="mt-2 text-sm text-neutral-600">{t.intro} <Link href="/contact" className="text-primary font-semibold hover:underline">{t.contact}</Link></p>
        </div>

        <section className={card} aria-labelledby="people">
          <h2 id="people" className={h2}>{t.people}</h2>
          <ul className="divide-y divide-neutral-100">
            <li className="py-2.5 flex justify-between gap-3">
              <span className="font-medium text-neutral-900">{h.firstName} {h.lastName}</span>
              <span className="text-sm text-neutral-500">{t.you}</span>
            </li>
            {h.members.map((m) => (
              <li key={m.id} className="py-2.5 flex justify-between gap-3">
                <span className="font-medium text-neutral-900">{[m.firstName, m.lastName].filter(Boolean).join(" ") || "—"}</span>
                <span className="text-sm text-neutral-500">{t.relationship[m.relationship] ?? m.relationship} · {ageGroupLabels[m.ageGroup as AgeGroup]?.[lang] ?? m.ageGroup}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={card} aria-labelledby="diagnoses">
          <h2 id="diagnoses" className={h2}>{t.diagnoses}</h2>
          <p className="text-xs text-neutral-500 mb-3">{t.diagnosesNote}</p>
          <ul className="space-y-1.5 text-sm">
            <li><span className="font-medium text-neutral-900">{t.you}:</span> <span className="text-neutral-700">{h.primaryDiagnoses.length ? diag(h.primaryDiagnoses) : t.diagnosesNone}</span></li>
            {h.members.filter((m) => m.diagnoses.length > 0).map((m) => (
              <li key={m.id}><span className="font-medium text-neutral-900">{m.firstName || "—"}:</span> <span className="text-neutral-700">{diag(m.diagnoses)}</span></li>
            ))}
          </ul>
        </section>

        <section className={card} aria-labelledby="events">
          <h2 id="events" className={h2}>{t.events}</h2>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">{t.upcoming}</h3>
          {h.upcoming.length === 0 && h.invited.length === 0 ? <p className="py-2 text-sm text-neutral-600">{t.noUpcoming}</p> : (
            <ul className="divide-y divide-neutral-100">
              {h.upcoming.map((r) => <RsvpRow key={r.id} r={r} />)}
              {h.invited.map((i) => (
                <li key={i.id} className="py-3">
                  <p className="font-medium text-neutral-900">{evTitle(i)} <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">{t.invited}</span></p>
                  <p className="text-sm text-neutral-600">{when(i.eventDate)} · {i.location}</p>
                  <p className="text-xs text-neutral-500">{t.inviteHelp}</p>
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-5 text-sm font-semibold text-neutral-500 uppercase tracking-wide">{t.past}</h3>
          {h.past.length === 0 ? <p className="py-2 text-sm text-neutral-600">{t.noPast}</p> : <ul className="divide-y divide-neutral-100">{h.past.map((r) => <RsvpRow key={r.id} r={r} />)}</ul>}
        </section>

        <section aria-labelledby="consents">
          <h2 id="consents" className={h2}>{t.consents}</h2>
          <p className="mb-3 text-sm text-neutral-600">{t.consentsIntro}</p>
          <ConsentSwitches
            lang={lang}
            initial={{ media: h.consents.media, sms: h.consents.sms, newsletter: h.consents.newsletter }}
            texts={{ media: text.media[lang], sms: text.sms[lang], newsletter: text.newsletter[lang] }}
            available={{ media: true, sms: features.sms.enabled, newsletter: features.newsletter.enabled }}
          />
          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 text-sm">
            <p className="font-medium text-neutral-900">{t.dataConsent}: {h.consents.data_and_contact === true ? t.on : h.consents.data_and_contact === false ? t.off : t.notAsked}</p>
            <p className="mt-1 text-neutral-600">{t.dataConsentNote}</p>
          </div>
        </section>

        <LegalLinks locale={lang} which={["privacy"]} newTab={false} className="text-center text-xs text-neutral-500" />
      </div>
    </div>
  );
}
