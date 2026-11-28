"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import { formatInSiteZone } from "@/lib/datetime";
import type { VoicemailItem, VoicemailView } from "@/lib/phone/voicemail-board";

type Lang = "en" | "es";

const T = {
  en: {
    title: "Voicemail", intro: "Messages left on the HOEP phone line. Only the President and Vice President can open this page. Every play, and every time a number is shown, is recorded. Messages are deleted after 30 days.",
    empty: "No messages.", noneFound: "No messages from that number.",
    off: "Callers can’t leave messages: the PHONE_DATA_KEY setting is missing.",
    unprotected: "Warning: recordings can be fetched without signing in. Turn on “Enforce HTTP Auth on Media URLs” in the Twilio console (Voice settings).",
    overdue: "Some messages are past 30 days and could not be deleted. Delete them here, or ask for help if that fails.",
    caller: "Caller", hidden: "Number not available", showNumber: "Show number", length: "{n} seconds", unknownLength: "Length unknown",
    new: "New", heard: "Played", handled: "Handled by {who}", handledPlain: "Handled",
    play: "Play", playFailed: "The message could not be played.", markHandled: "Mark handled", markOpen: "Not handled", remove: "Delete",
    confirmRemove: "Delete this message for good?", removed: "Message deleted.",
    find: "Find a caller’s messages", findHelp: "Use this when a caller asks you to delete their messages.", number: "Phone number", findButton: "Find", showAll: "Show all",
    deleteFound: "Delete these {n}", confirmFound: "Delete these {n} messages for good?",
    errors: {
      captured: "Test mode: nothing is sent to the phone provider.", not_configured: "The phone credentials are not set.", failed: "The phone provider did not answer. Try again.",
      not_found: "That message is gone. Refresh the page.", no_number: "That number is not available.", invalid: "Enter a full phone number (add + and the country code outside the US).", unavailable: "Search needs the PHONE_DATA_KEY setting.", generic: "Something went wrong.",
    } as Record<string, string>,
  },
  es: {
    title: "Mensajes de voz", intro: "Mensajes dejados en la línea telefónica de HOEP. Solo la presidencia y la vicepresidencia pueden abrir esta página. Cada reproducción, y cada vez que se muestra un número, queda registrada. Los mensajes se borran a los 30 días.",
    empty: "No hay mensajes.", noneFound: "No hay mensajes de ese número.",
    off: "No se pueden dejar mensajes: falta la configuración PHONE_DATA_KEY.",
    unprotected: "Advertencia: las grabaciones se pueden obtener sin iniciar sesión. Active “Enforce HTTP Auth on Media URLs” en la consola de Twilio (configuración de voz).",
    overdue: "Algunos mensajes pasaron de 30 días y no se pudieron borrar. Bórrelos aquí o pida ayuda si falla.",
    caller: "Quien llamó", hidden: "Número no disponible", showNumber: "Mostrar número", length: "{n} segundos", unknownLength: "Duración desconocida",
    new: "Nuevo", heard: "Escuchado", handled: "Atendido por {who}", handledPlain: "Atendido",
    play: "Escuchar", playFailed: "No se pudo reproducir el mensaje.", markHandled: "Marcar como atendido", markOpen: "No atendido", remove: "Borrar",
    confirmRemove: "¿Borrar este mensaje definitivamente?", removed: "Mensaje borrado.",
    find: "Buscar los mensajes de una persona", findHelp: "Úselo cuando alguien pida que se borren sus mensajes.", number: "Teléfono", findButton: "Buscar", showAll: "Ver todos",
    deleteFound: "Borrar estos {n}", confirmFound: "¿Borrar definitivamente estos {n} mensajes?",
    errors: {
      captured: "Modo de prueba: no se envía nada al proveedor telefónico.", not_configured: "Faltan las credenciales del teléfono.", failed: "El proveedor telefónico no respondió. Intente de nuevo.",
      not_found: "Ese mensaje ya no está. Actualice la página.", no_number: "Ese número no está disponible.", invalid: "Escriba el número completo (fuera de EE. UU., con + y el código del país).", unavailable: "La búsqueda necesita la configuración PHONE_DATA_KEY.", generic: "Algo salió mal.",
    } as Record<string, string>,
  },
};
const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
const BASE = "/api/admin/voicemails";
const input = "rounded-lg border border-neutral-300 px-3 py-2 text-sm";
const button = "px-3 py-2 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50 disabled:opacity-40";
const primaryButton = "px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-40";
const card = "bg-white rounded-2xl border border-neutral-200 p-5";

export default function VoicemailsClient({ view, locale }: { view: VoicemailView; locale: Lang }) {
  const t = T[locale];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  /** One press of Play: a new id each time, so each play is audited. */
  const [playing, setPlaying] = useState<{ id: string; play: string } | null>(null);
  const [number, setNumber] = useState("");
  const [found, setFound] = useState<string[] | null>(null);
  /** Full numbers this person asked to see, until they leave the page. Each one was audited when it was fetched. */
  const [numbers, setNumbers] = useState<Record<string, string>>({});
  const items = found ? view.items.filter((m) => found.includes(m.id)) : view.items;

  async function send(url: string, method: string, body?: unknown) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(t.errors[data.error as string] ?? t.errors.generic); return null; }
    return data as { ids?: string[]; number?: string };
  }
  async function run(work: () => Promise<void>) {
    setBusy(true);
    try { await work(); } catch { toast.error(t.errors.generic); } finally { setBusy(false); router.refresh(); }
  }
  async function showNumber(id: string) {
    setBusy(true);
    try {
      const data = await send(`${BASE}/${id}/caller`, "POST");
      if (data?.number) setNumbers((n) => ({ ...n, [id]: data.number! }));
    } catch {
      toast.error(t.errors.generic);
    } finally {
      setBusy(false);
    }
  }
  const remove = (ids: string[]) => run(async () => {
    let done = 0;
    for (const id of ids) if (await send(`${BASE}/${id}`, "DELETE")) { done++; if (playing?.id === id) setPlaying(null); }
    if (done) toast.success(t.removed);
  });

  const warnings = [!view.canReceive && t.off, view.audioUnprotected && t.unprotected, view.overdue > 0 && t.overdue].filter((w): w is string => !!w);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t.title}</h1>
        <p className="mt-1 text-neutral-600">{t.intro}</p>
        {warnings.map((w) => (
          <p key={w} role="alert" className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{w}
          </p>
        ))}
      </div>

      <form
        className={`${card} flex flex-wrap items-end gap-3`}
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => { const data = await send(`${BASE}/search`, "POST", { number }); if (data?.ids) { setFound(data.ids); setNumber(""); } });
        }}
      >
        <p className="w-full font-semibold text-neutral-900">{t.find}</p>
        <p className="-mt-2 w-full text-sm text-neutral-600">{t.findHelp}</p>
        <label className="text-sm text-neutral-700">{t.number}
          <input type="tel" autoComplete="off" className={`${input} mt-1 block w-56`} value={number} onChange={(e) => setNumber(e.target.value)} required maxLength={20} />
        </label>
        <button type="submit" className={primaryButton} disabled={busy || !number.trim()}>{t.findButton}</button>
        {found && <button type="button" className={button} onClick={() => setFound(null)}>{t.showAll}</button>}
        {found && items.length > 0 && (
          <button type="button" className="text-sm text-red-700 hover:underline disabled:opacity-40" disabled={busy}
            onClick={() => { if (window.confirm(fill(t.confirmFound, { n: items.length }))) remove(items.map((m) => m.id)); }}>
            {fill(t.deleteFound, { n: items.length })}
          </button>
        )}
      </form>

      {items.length === 0 && <p className="text-sm text-neutral-600">{found ? t.noneFound : t.empty}</p>}
      <ul className="space-y-3">
        {items.map((m: VoicemailItem) => (
          <li key={m.id} className={card}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[14rem] flex-1">
                <p className="font-semibold text-neutral-900">{formatInSiteZone(m.receivedAt, locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                <p className="text-sm text-neutral-600">
                  {m.mailbox[locale]} · {m.durationSeconds === null ? t.unknownLength : fill(t.length, { n: m.durationSeconds })}
                </p>
                <p className="text-sm text-neutral-600">
                  {t.caller}: {numbers[m.id] ? <strong className="select-all text-neutral-900">{numbers[m.id]}</strong> : (m.caller ?? t.hidden)}
                  {m.caller && !numbers[m.id] && (
                    <button type="button" className="ml-3 text-primary underline underline-offset-2 disabled:opacity-40" disabled={busy} onClick={() => showNumber(m.id)}>
                      {t.showNumber}
                    </button>
                  )}
                </p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${m.handledAt ? "bg-green-100 text-green-800" : m.listenedAt ? "bg-neutral-100 text-neutral-600" : "bg-blue-100 text-blue-800"}`}>
                {m.handledAt ? (m.handledBy ? fill(t.handled, { who: m.handledBy }) : t.handledPlain) : m.listenedAt ? t.heard : t.new}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {playing?.id === m.id ? (
                <audio
                  key={playing.play} controls autoPlay preload="auto" className="w-full max-w-md" src={`${BASE}/${m.id}/audio?play=${playing.play}`}
                  onError={() => { toast.error(t.playFailed); setPlaying(null); }}
                  onEnded={() => { setPlaying(null); router.refresh(); }}
                />
              ) : (
                <button type="button" className={primaryButton} onClick={() => setPlaying({ id: m.id, play: crypto.randomUUID() })}>{t.play}</button>
              )}
              <button type="button" className={button} disabled={busy} onClick={() => run(async () => { await send(`${BASE}/${m.id}`, "PATCH", { handled: !m.handledAt }); })}>
                {m.handledAt ? t.markOpen : t.markHandled}
              </button>
              <button type="button" className="text-sm text-red-700 hover:underline disabled:opacity-40" disabled={busy}
                onClick={() => { if (window.confirm(t.confirmRemove)) remove([m.id]); }}>
                {t.remove}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
