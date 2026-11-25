"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle, ChevronRight, Loader2, X } from "lucide-react";
import AttendeeChecklist, { allChecked, attendeesValid, type AttendeeState } from "@/components/household/AttendeeChecklist";
import TurnstileWidget from "@/components/form/TurnstileWidget";
import { rsvpModalTranslation } from "@/translation/rsvpModal";
import { eventNotices } from "@/content/consent";
import { withPhone } from "@/lib/site";
import { trackEvent } from "@/lib/analytics";
import type { EventRsvpView } from "@/lib/review/event-view";
import type { Lang } from "@/types";

const btn = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-600 transition-colors disabled:opacity-60";
const ghost = "inline-flex items-center gap-1 text-sm font-semibold text-neutral-600 hover:text-neutral-900";
const input = "w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const choice = "w-full text-left rounded-xl border border-neutral-200 p-4 hover:border-primary hover:bg-primary-50/40 transition-colors flex items-start gap-3";
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select, textarea, [tabindex]:not([tabindex="-1"])';

type Step = "choices" | "email" | "sent" | "form" | "result";

/**
 * "RSVP now" on the event page: a button plus an accessible modal (focus trap, Escape closes, focus returns to the button,
 * full-screen on phones). What it shows depends on who is looking (EventRsvpView, decided on the server):
 *  signed in  -> straight to the party picker; invited + approved RSVP right away, everyone else sends a request
 *  signed out -> three choices: register (event remembered), enter the registered email (emailed link), register for a phone call
 */
export default function RsvpModal({
  view, locale, eventId, turnstileSiteKey, notices, full, variant = "card", defaultOpen = false,
}: {
  view: EventRsvpView; locale: Lang; eventId: string; turnstileSiteKey: string | null;
  notices: { recorded: boolean; captions: boolean }; full: boolean; variant?: "card" | "inline"; /** Renders the dialog already open (tests, deep links). */ defaultOpen?: boolean;
}) {
  const t = rsvpModalTranslation[locale];
  const [open, setOpen] = useState(defaultOpen);
  const [step, setStep] = useState<Step>(view.kind === "member" ? "form" : "choices");
  const [sel, setSel] = useState<AttendeeState>(view.kind === "member" ? allChecked(view.options) : { primary: true, memberIds: [], guests: 0 });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const titleId = "rsvp-modal-title";

  const close = useCallback(() => { setOpen(false); opener.current?.focus(); }, []);

  // Escape closes, Tab stays inside, the page behind doesn't scroll.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); close(); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const a = items[0], z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [open, close, step]);

  async function submitMember() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/rsvp/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, selection: sel, source: "modal" }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        trackEvent({ name: "rsvp_submitted", source: "invite" });
        setResult(data.outcome === "rsvp" ? t.doneRsvp : view.kind === "member" && view.reviewing ? t.doneRequestReview : t.doneRequest);
        setStep("result");
        return;
      }
      const e = data.error as string | undefined;
      setMsg(e === "full" ? withPhone(rsvpModalTranslation[locale].full) : e === "closed" ? withPhone(t.closed) : e === "invitation" ? withPhone(t.invitationOnly) : e === "blocked" ? withPhone(t.blocked) : e === "signed_out" ? t.signedOut : t.error);
    } catch { setMsg(t.error); } finally { setBusy(false); }
  }

  async function withdraw() {
    if (view.kind !== "request") return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/rsvp/request/withdraw", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId: view.requestId }) });
      if (res.ok) { setResult(t.withdrawn); setStep("result"); } else setMsg(t.error);
    } catch { setMsg(t.error); } finally { setBusy(false); }
  }

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/rsvp/request-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, email, website, turnstileToken: token }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setStep("sent"); return; } // the same answer for every household
      setMsg(data.error === "email" ? t.badEmail : data.error === "captcha" ? t.captcha : data.error === "rate_limited" ? t.rateLimited : t.error);
      setResetKey((k) => k + 1);
    } catch { setMsg(t.error); } finally { setBusy(false); }
  }

  const registerHref = `/register-info?event=${encodeURIComponent(eventId)}`;
  const emailForm = (
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
  );

  let body: React.ReactNode;
  if (step === "result") {
    body = (
      <div>
        <p className="flex items-start gap-2 font-semibold text-secondary" role="status"><CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />{result}</p>
        <p className="text-sm text-neutral-600 mt-3">{t.manage} <Link href="/portal" className="text-primary font-semibold hover:underline">{t.familyPage}</Link></p>
      </div>
    );
  } else if (view.kind === "already") {
    body = (
      <div>
        <p className="flex items-center gap-2 font-semibold text-secondary"><CheckCircle className="w-5 h-5" />{view.attendanceType === "virtual" ? t.alreadyVirtual : t.already}</p>
        <p className="text-sm text-neutral-600 mt-2">{t.alreadyManage} <Link href="/portal" className="text-primary font-semibold hover:underline">{t.familyPage}</Link></p>
      </div>
    );
  } else if (view.kind === "request") {
    body = (
      <div>
        <p className="font-semibold text-neutral-900" role="status">{view.status === "waiting_household_review" ? t.requestWaiting : view.status === "waitlisted" ? t.requestWaitlisted : t.requestPending}</p>
        <button className={`${ghost} mt-4`} disabled={busy} onClick={withdraw}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}{t.withdraw}</button>
        {msg && <p className="mt-3 text-sm text-red-600" role="alert">{msg}</p>}
      </div>
    );
  } else if (view.kind === "by_invitation") {
    body = <p className="text-neutral-700 text-sm">{withPhone(t.invitationOnly)}</p>;
  } else if (view.kind === "blocked") {
    body = <p className="text-neutral-700 text-sm">{withPhone(t.blocked)}</p>;
  } else if (view.kind === "member") {
    body = (
      <div>
        {full && <p className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900 mb-4">{t.full}</p>}
        {view.path === "request" && <p className="text-sm text-neutral-700 mb-4">{view.reviewing ? t.reviewNote : t.requestNote}</p>}
        <div className="mb-4"><AttendeeChecklist locale={locale} primaryName={view.firstName} options={view.options} value={sel} onChange={setSel} /></div>
        <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600 space-y-1 mb-4" data-testid="event-notices">
          {notices.recorded && <p>{(notices.captions ? eventNotices.recordedWithCaptions : eventNotices.recorded)[locale]}</p>}
          <p>{eventNotices.quotes[locale]}</p>
        </div>
        <button className={btn} disabled={busy || !attendeesValid(sel)} onClick={submitMember}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}{busy ? t.saving : view.path === "direct" ? t.rsvp : t.send}
        </button>
        {msg && <p className="mt-3 text-sm text-red-600" role="alert">{msg}</p>}
      </div>
    );
  } else if (step === "sent") {
    body = (
      <div role="status">
        <p className="flex items-center gap-2 font-semibold text-secondary"><CheckCircle className="w-5 h-5" />{t.sentTitle}</p>
        <p className="text-sm text-neutral-700 mt-2">{t.sent}</p>
      </div>
    );
  } else if (step === "email") {
    body = (
      <div>
        <button className={`${ghost} mb-3`} onClick={() => { setStep("choices"); setMsg(null); }}>← {t.back}</button>
        <p className="text-sm text-neutral-600 mb-3">{t.emailBody}</p>
        {emailForm}
      </div>
    );
  } else if (view.kind === "anon" && view.byInvitation) {
    body = (
      <div>
        <p className="text-sm text-neutral-700 mb-4">{withPhone(t.byInvitation)}</p>
        <p className="text-sm text-neutral-600 mb-3">{t.invitedEmailBody}</p>
        {emailForm}
      </div>
    );
  } else {
    // signed out: the three choices
    body = (
      <div>
        {full && <p className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900 mb-4">{t.full}</p>}
        <p className="text-sm text-neutral-600 mb-3">{t.choose}</p>
        <ul className="space-y-3">
          <li><Link href={registerHref} className={choice}>
            <span className="flex-1"><span className="block font-semibold text-neutral-900">{t.registerTitle}</span><span className="block text-sm text-neutral-600 mt-0.5">{t.registerBody}</span></span><ChevronRight className="w-5 h-5 text-neutral-400 mt-0.5" aria-hidden="true" />
          </Link></li>
          <li><button type="button" className={choice} onClick={() => setStep("email")}>
            <span className="flex-1"><span className="block font-semibold text-neutral-900">{t.emailTitle}</span><span className="block text-sm text-neutral-600 mt-0.5">{t.emailBody}</span></span><ChevronRight className="w-5 h-5 text-neutral-400 mt-0.5" aria-hidden="true" />
          </button></li>
          <li><Link href={`${registerHref}&mode=phone`} className={choice}>
            <span className="flex-1"><span className="block font-semibold text-neutral-900">{t.phoneTitle}</span><span className="block text-sm text-neutral-600 mt-0.5">{t.phoneBody}</span></span><ChevronRight className="w-5 h-5 text-neutral-400 mt-0.5" aria-hidden="true" />
          </Link></li>
        </ul>
        <p className="mt-5 pt-4 border-t border-neutral-100 text-sm text-neutral-600">{t.signedInHint} <Link href="/portal" className="text-primary font-semibold hover:underline">{t.signIn}</Link></p>
      </div>
    );
  }

  return (
    <>
      <button ref={opener} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
        className={variant === "card" ? "block w-full text-center px-6 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary-600 transition-colors" : btn}>
        {t.open}
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-stretch sm:items-center justify-center sm:p-4 bg-black/50" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId}
            className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-xl flex flex-col max-h-full sm:max-h-[90vh]">
            <div className="flex items-start justify-between gap-4 p-5 border-b border-neutral-100">
              <h2 id={titleId} className="font-display font-bold text-neutral-900 text-xl">{t.title}</h2>
              <button type="button" onClick={close} aria-label={t.close} className="p-1 -m-1 text-neutral-500 hover:text-neutral-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto">{body}</div>
          </div>
        </div>
      )}
    </>
  );
}
