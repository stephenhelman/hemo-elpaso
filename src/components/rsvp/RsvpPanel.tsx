"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { rsvpPageTranslation } from "@/translation/rsvpPage";

export type RsvpPanelProps =
  | { valid: false }
  | {
      valid: true;
      token: string;
      via: "checkin" | "invitation";
      firstName: string;
      hasEmail: boolean;
      event: { titleEn: string; titleEs: string; eventDate: string; location: string };
      ended: boolean;
      partySize: number;
      confirmed: boolean;
      declined: boolean;
    };

const btn = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-colors disabled:opacity-60";

export default function RsvpPanel(props: RsvpPanelProps) {
  const { locale } = useLanguage();
  const t = rsvpPageTranslation[locale];
  const router = useRouter();
  const [size, setSize] = useState(props.valid ? props.partySize : 1);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [state, setState] = useState<"normal" | "cancelled" | "declined">(
    props.valid && props.declined ? "declined" : "normal",
  );

  if (!props.valid) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
        <XCircle className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <h1 className="font-display font-bold text-xl mb-2">{t.invalidTitle}</h1>
        <p className="text-neutral-600 text-sm">{t.invalidBody}</p>
      </div>
    );
  }

  const { event, via, token } = props;
  const title = locale === "es" ? event.titleEs : event.titleEn;
  const d = new Date(event.eventDate);
  const loc = locale === "es" ? "es-US" : "en-US";
  const when = `${d.toLocaleDateString(loc, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}, ${d.toLocaleTimeString(loc, { hour: "numeric", minute: "2-digit" })}`;
  const errText = (e?: string) => (e === "full" ? t.full : e === "closed" ? t.closed : e === "ended" ? t.ended : t.genericError);

  const respond = async (response: "yes" | "no") => {
    setBusy(response); setMsg(null);
    try {
      const res = await fetch("/api/rsvp/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, response, partySize: size }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg(errText(data.error)); return; }
      if (response === "no") { setState(props.confirmed ? "cancelled" : "declined"); return; }
      if (data.checkInToken) { router.replace(`/rsvp/${data.checkInToken}`); return; }
      setMsg(t.saved); router.refresh();
    } catch { setMsg(t.genericError); } finally { setBusy(null); }
  };

  const resend = async () => {
    setBusy("resend"); setMsg(null);
    const res = await fetch("/api/rsvp/resend-qr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? t.resent : data.error === "wait" ? t.wait : data.error === "no_email" ? t.noEmail : t.genericError);
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
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{t.partySize}</label>
      <input type="number" min={1} max={30} value={size} onChange={(e) => setSize(Number(e.target.value))}
        className="w-28 px-3 py-2 border border-neutral-300 rounded-lg text-sm" />
    </div>
  );

  if (!props.confirmed) {
    return (
      <div className={card}>
        {header}
        {partyInput}
        <div className="flex flex-wrap gap-3">
          <button disabled={busy !== null} onClick={() => respond("yes")} className={`${btn} bg-primary text-white hover:bg-primary-600`}>
            {busy === "yes" && <Loader2 className="w-4 h-4 animate-spin" />}{t.yes}
          </button>
          <button disabled={busy !== null} onClick={() => respond("no")} className={`${btn} border border-neutral-300 text-neutral-700 hover:bg-neutral-50`}>
            {t.no}
          </button>
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
      {via === "checkin" ? (
        <div className="mb-6 text-center">
          <h2 className="font-semibold text-neutral-900 mb-2">{t.qrTitle}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/checkin-qr/${token}`} alt="QR" width={220} height={220} className="mx-auto border border-neutral-200 rounded-lg" />
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
          <button disabled={busy !== null || size === props.partySize} onClick={() => respond("yes")} className={`${btn} border border-primary text-primary hover:bg-primary-50`}>
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
