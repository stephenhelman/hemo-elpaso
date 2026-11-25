"use client";

import { formatEventDateTime } from "@/lib/datetime";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { rsvpPageTranslation } from "@/translation/rsvpPage";
import { withPhone } from "@/lib/site";
import { trackEvent } from "@/lib/analytics";
import AttendeeChecklist, { attendeesValid, type AttendeeOption, type AttendeeState } from "@/components/household/AttendeeChecklist";

export type RsvpPanelProps =
  | { valid: false }
  | {
      valid: true;
      token: string;
      via: "checkin" | "invitation" | "link";
      /** No active RSVP: "rsvp" (invited + approved), "request" (asks to attend), "invitation" (invitation-only event), "blocked" (an earlier request can't be repeated). */
      mode: "rsvp" | "request" | "invitation" | "blocked";
      reviewing: boolean;
      openRequest: { id: string; status: string } | null;
      attendanceType: "in_person" | "virtual";
      qrToken: string | null;
      firstName: string;
      hasEmail: boolean;
      event: { titleEn: string; titleEs: string; eventDate: string; location: string };
      ended: boolean;
      partySize: number;
      options: AttendeeOption[];
      selected: AttendeeState;
      confirmed: boolean;
      declined: boolean;
    };

const btn = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-colors disabled:opacity-60";

export default function RsvpPanel(props: RsvpPanelProps) {
  const { locale } = useLanguage();
  const t = rsvpPageTranslation[locale];
  const router = useRouter();
  const [sel, setSel] = useState<AttendeeState>(props.valid ? props.selected : { primary: true, memberIds: [], guests: 0 });
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [state, setState] = useState<"normal" | "cancelled" | "declined" | "requested">(
    props.valid && props.declined ? "declined" : "normal",
  );

  if (!props.valid) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
        <XCircle className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <h1 className="font-display font-bold text-xl mb-2">{t.invalidTitle}</h1>
        <p className="text-neutral-600 text-sm">{withPhone(t.invalidBody)}</p>
      </div>
    );
  }

  const { event, via, token } = props;
  const title = locale === "es" ? event.titleEs : event.titleEn;
  const d = new Date(event.eventDate);
  const when = formatEventDateTime(d, locale);
  const errText = (e?: string) => (e === "full" ? withPhone(t.full) : e === "closed" ? withPhone(t.closed) : e === "review" ? t.review : e === "blocked" ? withPhone(t.blocked) : e === "invitation" ? withPhone(t.invitationOnly) : e === "ended" ? t.ended : t.genericError);

  const respond = async (response: "yes" | "no") => {
    setBusy(response); setMsg(null);
    try {
      const res = await fetch("/api/rsvp/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, response, selection: sel }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg(errText(data.error)); return; }
      if (response === "no") { setState(props.confirmed ? "cancelled" : props.openRequest ? "declined" : "declined"); setMsg(props.openRequest ? t.withdrawn : null); return; }
      if (data.state === "requested") { setState("requested"); setMsg(props.reviewing ? t.requestedDoneReview : t.requestedDone); router.refresh(); return; }
      if (!props.confirmed) trackEvent({ name: "rsvp_submitted", source: "invite" }); // first confirmation only
      if (data.checkInToken) { router.replace(`/rsvp/${data.checkInToken}`); return; }
      setMsg(t.saved); router.refresh();
    } catch { setMsg(t.genericError); } finally { setBusy(null); }
  };

  const resend = async () => {
    setBusy("resend"); setMsg(null);
    const res = await fetch("/api/rsvp/resend-qr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? t.resent : data.error === "wait" ? t.wait : data.error === "no_email" ? withPhone(t.noEmail) : t.genericError);
    setBusy(null);
    if (res.ok) router.refresh();
  };

  const header = (
    <div className="mb-5">
      <p className="text-neutral-500 text-sm">{t.hi(props.firstName)}</p>
      <h1 className="font-display font-bold text-2xl text-neutral-900">{title}</h1>
      <p className="text-neutral-600 text-sm mt-2">
        <strong>{t.when}:</strong> {when}<br /><strong>{t.where}:</strong> {event.location}
      </p>
    </div>
  );
  const card = "bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8";

  if (props.ended) return <div className={card}>{header}<p className="text-neutral-600">{t.ended}</p></div>;

  if (state === "requested") {
    return <div className={card}>{header}<p className="text-neutral-700 text-sm" role="status">{msg ?? t.requestedDone}</p></div>;
  }

  if (state === "cancelled" || state === "declined") {
    return (
      <div className={card}>
        {header}
        <p className="text-neutral-700 mb-4">{state === "cancelled" ? t.cancelled : t.declined}</p>
        {via === "invitation" && (
          <button className={`${btn} border border-neutral-300 text-neutral-700 hover:bg-neutral-50`} onClick={() => setState("normal")}>
            {t.changeAnswer}
          </button>
        )}
      </div>
    );
  }

  const partyInput = (
    <div className="mb-4">
      <AttendeeChecklist locale={locale} primaryName={props.firstName} options={props.options} value={sel} onChange={setSel} />
    </div>
  );
  const unchanged = JSON.stringify({ p: sel.primary, m: [...sel.memberIds].sort(), g: sel.guests }) ===
    JSON.stringify({ p: props.selected.primary, m: [...props.selected.memberIds].sort(), g: props.selected.guests });

  if (!props.confirmed && (props.mode === "invitation" || props.mode === "blocked")) {
    return <div className={card}>{header}<p className="text-neutral-700 text-sm" role="status">{props.mode === "invitation" ? withPhone(t.invitationOnly) : withPhone(t.blocked)}</p></div>;
  }

  // A request already waiting: its status, and a way to withdraw it.
  if (!props.confirmed && props.mode === "request" && props.openRequest) {
    const st = props.openRequest.status;
    return (
      <div className={card}>
        {header}
        <p className="text-neutral-800 text-sm font-medium" role="status">{st === "waiting_household_review" ? t.requestWaiting : st === "waitlisted" ? t.requestWaitlisted : t.requestPending}</p>
        <div className="mt-4">
          <button disabled={busy !== null} onClick={() => respond("no")} className={`${btn} border border-neutral-300 text-neutral-700 hover:bg-neutral-50`}>
            {busy === "no" && <Loader2 className="w-4 h-4 animate-spin" />}{t.withdrawRequest}
          </button>
        </div>
        {msg && <p className="mt-4 text-sm text-red-600" role="alert">{msg}</p>}
      </div>
    );
  }

  if (!props.confirmed) {
    return (
      <div className={card}>
        {header}
        {props.mode === "request" && <p className="text-neutral-700 text-sm mb-4">{props.reviewing ? t.requestReviewNote : t.requestNote}</p>}
        {partyInput}
        <div className="flex flex-wrap gap-3">
          <button disabled={busy !== null || !attendeesValid(sel)} onClick={() => respond("yes")} className={`${btn} bg-primary text-white hover:bg-primary-600`}>
            {busy === "yes" && <Loader2 className="w-4 h-4 animate-spin" />}{props.mode === "request" ? t.requestSend : t.yes}
          </button>
          {props.mode !== "request" && (
            <button disabled={busy !== null} onClick={() => respond("no")} className={`${btn} border border-neutral-300 text-neutral-700 hover:bg-neutral-50`}>
              {t.no}
            </button>
          )}
        </div>
        {msg && <p className="mt-4 text-sm text-red-600" role="alert">{msg}</p>}
      </div>
    );
  }

  return (
    <div className={card}>
      <div className="flex items-center gap-2 text-secondary mb-4">
        <CheckCircle className="w-6 h-6" /><span className="font-semibold">{t.confirmed}</span>
        <span className="text-neutral-500 text-sm">· {t.confirmedFor(props.partySize)}</span>
      </div>
      {header}
      {props.attendanceType === "virtual" ? (
        <div className="mb-6">
          <h2 className="font-semibold text-neutral-900 mb-1">{t.virtualConfirmed}</h2>
          <p className="text-sm text-neutral-600 mb-3">{t.virtualHelp}</p>
          <button disabled={busy !== null} onClick={resend} className={`${btn} bg-primary text-white hover:bg-primary-600`}>
            {busy === "resend" && <Loader2 className="w-4 h-4 animate-spin" />}{t.resendVirtual}
          </button>
        </div>
      ) : props.qrToken ? (
        <div className="mb-6 text-center">
          <h2 className="font-semibold text-neutral-900 mb-2">{t.qrTitle}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/checkin-qr/${props.qrToken}`} alt={t.qrAlt} width={220} height={220} className="mx-auto border border-neutral-200 rounded-lg" />
          <p className="text-xs text-neutral-500 mt-2">{t.qrHelp}</p>
        </div>
      ) : (
        <div className="mb-6">
          <button disabled={busy !== null} onClick={resend} className={`${btn} bg-primary text-white hover:bg-primary-600`}>
            {busy === "resend" && <Loader2 className="w-4 h-4 animate-spin" />}{t.resend}
          </button>
          <p className="text-xs text-neutral-500 mt-2">{t.resendNote}</p>
        </div>
      )}
      <div className="border-t border-neutral-100 pt-5">
        {partyInput}
        <div className="flex flex-wrap gap-3">
          <button disabled={busy !== null || unchanged || !attendeesValid(sel)} onClick={() => respond("yes")} className={`${btn} border border-primary text-primary hover:bg-primary-50`}>
            {busy === "yes" && <Loader2 className="w-4 h-4 animate-spin" />}{t.savePartySize}
          </button>
          <button disabled={busy !== null} onClick={() => { if (window.confirm(t.cancelConfirm)) respond("no"); }} className={`${btn} text-red-600 hover:bg-red-50`}>
            {t.cancelRsvp}
          </button>
        </div>
        {msg && <p className="mt-4 text-sm text-neutral-700" role="alert">{msg}</p>}
      </div>
    </div>
  );
}
