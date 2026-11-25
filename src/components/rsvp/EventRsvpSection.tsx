"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import AttendeeChecklist, { allChecked, attendeesValid, type AttendeeState } from "@/components/household/AttendeeChecklist";
import TurnstileWidget from "@/components/form/TurnstileWidget";
import { eventRsvpTranslation } from "@/translation/eventRsvp";
import { eventNotices } from "@/content/consent";
import { withPhone } from "@/lib/site";
import { trackEvent } from "@/lib/analytics";
import type { EventRsvpView } from "@/lib/review/event-view";
import type { Lang } from "@/types";

const card = "bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8";
const btn = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-600 transition-colors disabled:opacity-60";
const input = "w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";

/**
 * The RSVP area of the event page. Signed in + approved: RSVP right here. Signed in, not approved: the review note.
 * Not signed in: "enter the email you registered with" (always the same neutral answer), a call-HOEP line, "register first".
 */
export default function EventRsvpSection({
  view, locale, eventId, turnstileSiteKey, notices,
}: {
  view: EventRsvpView; locale: Lang; eventId: string; turnstileSiteKey: string | null;
  notices: { recorded: boolean; captions: boolean };
}) {
  const t = eventRsvpTranslation[locale];
  const [sel, setSel] = useState<AttendeeState>(view.kind === "member" ? allChecked(view.options) : { primary: true, memberIds: [], guests: 0 });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  // anonymous request
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [asked, setAsked] = useState(false);

  async function rsvp() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/rsvp/member", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, selection: sel }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { trackEvent({ name: "rsvp_submitted", source: "invite" }); setDone(true); return; }
      const e = data.error as string | undefined;
      setMsg(e === "full" ? withPhone(t.full) : e === "closed" ? withPhone(t.closed) : e === "ended" ? t.ended : e === "review" ? t.review : e === "invitation" ? withPhone(t.invitationOnly) : e === "signed_out" ? t.signedOut : t.error);
    } catch { setMsg(t.error); } finally { setBusy(false); }
  }

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/rsvp/request-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, email, website, turnstileToken: token }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setAsked(true); return; } // the same answer for every household
      setMsg(data.error === "email" ? t.badEmail : data.error === "captcha" ? t.captcha : data.error === "rate_limited" ? t.rateLimited : t.error);
      setResetKey((k) => k + 1);
    } catch { setMsg(t.error); } finally { setBusy(false); }
  }

  const heading = <h2 className="font-display font-bold text-neutral-900 text-xl mb-4">{t.title}</h2>;

  if (view.kind === "review") return <div className={card}>{heading}<p className="text-neutral-700 text-sm" role="status">{t.review}</p></div>;
  if (view.kind === "invitation_only") return <div className={card}>{heading}<p className="text-neutral-700 text-sm">{withPhone(t.invitationOnly)}</p></div>;
  if (view.kind === "already")
    return (
      <div className={card}>{heading}
        <p className="flex items-center gap-2 font-semibold text-secondary"><CheckCircle className="w-5 h-5" />{t.already}</p>
        <p className="text-sm text-neutral-600 mt-2">{t.alreadyManage} <Link href="/portal" className="text-primary font-semibold hover:underline">{t.familyPage}</Link></p>
      </div>
    );

  if (view.kind === "member") {
    if (done)
      return (
        <div className={card}>{heading}
          <p className="flex items-center gap-2 font-semibold text-secondary"><CheckCircle className="w-5 h-5" />{t.done}</p>
          <p className="text-sm text-neutral-600 mt-2">{t.doneManage} <Link href="/portal" className="text-primary font-semibold hover:underline">{t.familyPage}</Link></p>
        </div>
      );
    return (
      <div className={card}>{heading}
        <div className="mb-4"><AttendeeChecklist locale={locale} primaryName={view.firstName} options={view.options} value={sel} onChange={setSel} /></div>
        <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600 space-y-1 mb-4" data-testid="event-notices">
          {notices.recorded && <p>{(notices.captions ? eventNotices.recordedWithCaptions : eventNotices.recorded)[locale]}</p>}
          <p>{eventNotices.quotes[locale]}</p>
        </div>
        <button className={btn} disabled={busy || !attendeesValid(sel)} onClick={rsvp}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}{busy ? t.saving : t.yes}</button>
        {msg && <p className="mt-3 text-sm text-red-600" role="alert">{msg}</p>}
      </div>
    );
  }

  // anonymous
  return (
    <div className={card}>
      {heading}
      {asked ? (
        <p className="text-neutral-800 text-sm" role="status">{t.neutral}</p>
      ) : (
        <form onSubmit={requestLink} className="space-y-3">
          <label className="block text-sm font-medium text-neutral-700">{t.emailLabel}
            <input type="email" className={`${input} mt-1.5`} value={email} required maxLength={254} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
          </label>
          <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", height: 0, overflow: "hidden" }}>
            <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
          </div>
          <TurnstileWidget siteKey={turnstileSiteKey} onToken={setToken} resetKey={resetKey} />
          <button type="submit" className={btn} disabled={busy || !email || (!!turnstileSiteKey && !token)}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}{busy ? t.sending : t.emailButton}</button>
          {msg && <p className="text-sm text-red-600" role="alert">{msg}</p>}
        </form>
      )}
      <div className="mt-5 pt-4 border-t border-neutral-100 space-y-1 text-sm text-neutral-600">
        <p>{withPhone(t.noEmail)}</p>
        <p>{t.notRegistered} <Link href="/register-info" className="text-primary font-semibold hover:underline">{t.registerFirst}</Link></p>
        <p>{t.signedInHint} <Link href="/portal" className="text-primary font-semibold hover:underline">{t.signIn}</Link></p>
      </div>
    </div>
  );
}
