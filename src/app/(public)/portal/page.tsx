import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocaleCookie } from "@/lib/locale";
import { resolveSession } from "@/lib/identity/session";
import { isFeatureEnabled, getFeatureStates } from "@/lib/features";
import { portalGate } from "@/lib/portal/rules";
import { type PortalRsvp } from "@/lib/portal/household";
import { flyerText } from "@/lib/flyers/text";
import type { PickedFlyer } from "@/lib/flyers";
import { loadPortalView } from "@/lib/portal/view";
import { actorMemberId } from "@/lib/portal/permissions";
import { auditPortalView } from "@/lib/portal/service";
import { portalText } from "@/lib/portal/text";
import { formatEventDateTime } from "@/lib/datetime";
import { CONSENT_TEXT_VERSION, consentTextVersions } from "@/content/consent";
import LegalLinks from "@/components/legal/LegalLinks";
import { addressAutocompleteEnabled } from "@/lib/address/server";
import { openEventsFor } from "@/lib/review/events";
import ConsentSwitches from "./ConsentSwitches";
import PortalEditor from "./PortalEditor";

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

  if (!s.actor) redirect("/no-household");
  const v = await loadPortalView(s.patient.id, s.actor);
  if (!v) redirect("/no-household");
  await auditPortalView(s.patient.id, actorMemberId(s.actor));
  const h = { firstName: v.me.firstName, upcoming: v.household.upcoming, past: v.household.past, invited: v.household.invited, consents: v.consents };

  const features = await getFeatureStates();
  const openEvents = await openEventsFor(s.patient.id);
  const text = consentTextVersions[CONSENT_TEXT_VERSION as keyof typeof consentTextVersions] as unknown as Record<string, { en: string; es: string }>;
  const when = (iso: string) => formatEventDateTime(iso, lang);
  const evTitle = (x: { title: { en: string; es: string } }) => x.title[lang];

  const ft = flyerText[lang];
  // The household's-language flyer next to an upcoming event: a small image (PDFs: just the link) and a download link.
  const FlyerBlock = ({ f }: { f: PickedFlyer | null }) => f && (
    <div className="mt-2 flex items-center gap-3">
      {!f.isPdf && (
        <a href={f.url} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.url} alt={f.alt || ft.flyer} loading="lazy" className="h-24 w-auto rounded border border-neutral-200" />
        </a>
      )}
      <div className="text-sm">
        <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">{ft.download}</a>
        {f.lang !== lang && <p className="text-xs text-neutral-500">{f.lang === "es" ? ft.otherLanguageEs : ft.otherLanguage}</p>}
      </div>
    </div>
  );

  const RsvpRow = ({ r }: { r: PortalRsvp }) => (
    <li className="py-3 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-neutral-900">{evTitle(r)}</p>
        <p className="text-sm text-neutral-600">{when(r.eventDate)} · {r.location}</p>
        <p className="text-xs text-neutral-500">{r.cancelled ? t.cancelled : t.people_n(r.partySize)}</p>
        {!r.past && !r.cancelled && <FlyerBlock f={r.flyer} />}
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

        {v.reviewStatus !== "approved" && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">{t.reviewNote}</p>
        )}

        <PortalEditor
          lang={lang}
          isPrimary={v.actor.kind === "primary"}
          me={v.me}
          address={v.address}
          addressAutocomplete={await addressAutocompleteEnabled()}
          members={v.members}
          otherAdults={v.otherAdults}
          pendingAttestations={v.pendingAttestations}
          primaryName={v.primaryName}
          flyerDelivery={v.flyerDelivery}
        />

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
                  <FlyerBlock f={i.flyer} />
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-5 text-sm font-semibold text-neutral-500 uppercase tracking-wide">{t.past}</h3>
          {h.past.length === 0 ? <p className="py-2 text-sm text-neutral-600">{t.noPast}</p> : <ul className="divide-y divide-neutral-100">{h.past.map((r) => <RsvpRow key={r.id} r={r} />)}</ul>}
        </section>

        <section className={card} aria-labelledby="open-events">
          <h2 id="open-events" className={h2}>{t.openEvents}</h2>
          {openEvents.length === 0 ? <p className="py-2 text-sm text-neutral-600">{t.openEventsNone}</p> : (
            <ul className="divide-y divide-neutral-100">
              {openEvents.map((e) => (
                <li key={e.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div><p className="font-medium text-neutral-900">{evTitle(e)}</p><p className="text-sm text-neutral-600">{when(e.eventDate)}</p></div>
                  <Link href={`/events/${e.slug}`} className="text-sm font-semibold text-primary hover:underline">{t.rsvpOpen}</Link>
                </li>
              ))}
            </ul>
          )}
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
