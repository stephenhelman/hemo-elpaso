"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import type { PhoneView } from "@/lib/phone/view";

type Lang = "en" | "es";
type Option = PhoneView["options"][number];

const T = {
  en: {
    title: "Phone", intro: "Who answers each choice on the HOEP phone line. Every change is recorded and emailed to the four officers. Whoever answers must press 1 to take the call.",
    capture: "Test mode: no phone is rung.", allowlist: "Development mode: only allowed test numbers are rung.", notConfigured: "The phone credentials are not set, so the phone line does not work yet.", noVoicemail: "Callers can’t leave messages: the PHONE_DATA_KEY setting is missing.",
    duty: "Who answers", nobody: "Nobody", choose: "Choose a number…", save: "Save", saved: "Saved. The officers were emailed.", savedNoNotice: "Saved, but the officer email was not sent.",
    ringsNow: "Rings now", notRinging: "Not ringing now", confirmDuty: "Hand “{option}” to {who}? The four officers will be emailed.", noneVerified: "No verified numbers yet. The admin account adds and verifies them.",
    hours: "Hours (El Paso time)", anyTime: "Any time", days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], from: "From", to: "To", saveHours: "Save hours",
    numbers: "Duty numbers", numbersIntro: "Board members' numbers. A number can be rung only after its owner confirms it by phone.", empty: "No numbers yet.",
    verified: "Verified", unverified: "Not verified", leftBoard: "No longer on the board: never rung", verify: "Verify by phone", verifyAgain: "Verify again", remove: "Remove",
    confirmRemove: "Remove {who}? Any choice that uses it will ring nobody.", codeTitle: "HOEP is calling {who}. Tell that person this code; they type it on their phone:",
    codeCaptured: "Test mode: no call was placed. The code would be:", codeNote: "The code works for 10 minutes and 3 tries. Then press Refresh.", refresh: "Refresh",
    add: "Add a number", person: "Board member", pick: "Choose a person…", number: "US phone number", addButton: "Add",
    errors: {
      invalid: "Enter a US phone number.", not_us: "Only US numbers can be used.", not_allowed: "That kind of number can't be used.", hoep_number: "That is HOEP's own number.",
      duplicate: "That number is already listed.", too_many: "There are too many numbers. Remove one first.", not_board_member: "Only current board members can be on duty.",
      not_verified: "Verify that number first.", needs_number: "Choose a verified number.", no_change: "Nothing changed.", bad_hours: "Choose at least one day and a start before the end.",
      unknown_number: "That number is no longer listed. Refresh the page.", unknown_option: "Unknown choice.", rate_limited: "Too many calls to that number. Try again in an hour.",
      call_failed: "Twilio did not place the call.", not_configured: "The phone credentials are not set.", generic: "Something went wrong.",
    } as Record<string, string>,
  },
  es: {
    title: "Teléfono", intro: "Quién atiende cada opción de la línea telefónica de HOEP. Cada cambio se registra y se envía por correo a los cuatro directivos. Quien contesta debe oprimir 1 para tomar la llamada.",
    capture: "Modo de prueba: no suena ningún teléfono.", allowlist: "Modo de desarrollo: solo suenan los números de prueba permitidos.", notConfigured: "Faltan las credenciales del teléfono; la línea todavía no funciona.", noVoicemail: "No se pueden dejar mensajes: falta la configuración PHONE_DATA_KEY.",
    duty: "Quién atiende", nobody: "Nadie", choose: "Elija un número…", save: "Guardar", saved: "Guardado. Se avisó a los directivos.", savedNoNotice: "Guardado, pero no se envió el correo a los directivos.",
    ringsNow: "Suena ahora", notRinging: "No suena ahora", confirmDuty: "¿Pasar “{option}” a {who}? Se avisará por correo a los cuatro directivos.", noneVerified: "Aún no hay números verificados. La cuenta de administración los agrega y verifica.",
    hours: "Horario (hora de El Paso)", anyTime: "A cualquier hora", days: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"], from: "Desde", to: "Hasta", saveHours: "Guardar horario",
    numbers: "Números de guardia", numbersIntro: "Números de miembros de la junta. Un número solo puede recibir llamadas después de que su dueño lo confirme por teléfono.", empty: "Aún no hay números.",
    verified: "Verificado", unverified: "Sin verificar", leftBoard: "Ya no está en la junta: no recibe llamadas", verify: "Verificar por teléfono", verifyAgain: "Verificar de nuevo", remove: "Eliminar",
    confirmRemove: "¿Eliminar {who}? Las opciones que lo usan no sonarán.", codeTitle: "HOEP está llamando a {who}. Dígale este código para que lo marque en su teléfono:",
    codeCaptured: "Modo de prueba: no se hizo la llamada. El código sería:", codeNote: "El código sirve 10 minutos y 3 intentos. Después oprima Actualizar.", refresh: "Actualizar",
    add: "Agregar un número", person: "Miembro de la junta", pick: "Elija una persona…", number: "Teléfono de EE. UU.", addButton: "Agregar",
    errors: {
      invalid: "Escriba un teléfono de EE. UU.", not_us: "Solo se pueden usar números de EE. UU.", not_allowed: "Ese tipo de número no se puede usar.", hoep_number: "Ese es el número de HOEP.",
      duplicate: "Ese número ya está en la lista.", too_many: "Hay demasiados números. Elimine uno primero.", not_board_member: "Solo miembros actuales de la junta pueden estar de guardia.",
      not_verified: "Primero verifique ese número.", needs_number: "Elija un número verificado.", no_change: "Nada cambió.", bad_hours: "Elija al menos un día y una hora de inicio anterior a la final.",
      unknown_number: "Ese número ya no está en la lista. Actualice la página.", unknown_option: "Opción desconocida.", rate_limited: "Demasiadas llamadas a ese número. Intente en una hora.",
      call_failed: "Twilio no hizo la llamada.", not_configured: "Faltan las credenciales del teléfono.", generic: "Algo salió mal.",
    } as Record<string, string>,
  },
};
const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
const BASE = "/api/admin/settings/phone-routing";
const input = "rounded-lg border border-neutral-300 px-3 py-2 text-sm";
const primaryButton = "px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-40";
const button = "px-3 py-2 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-50 disabled:opacity-40";
const card = "bg-white rounded-2xl border border-neutral-200 p-5";

export default function PhoneClient({ view, canManage, locale }: { view: PhoneView; canManage: boolean; locale: Lang }) {
  const t = T[locale];
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<{ who: string; code: string; captured: boolean } | null>(null);
  const label = (n: PhoneView["numbers"][number]) => `${n.owner} ${n.masked}`;

  /** One request; errors are codes. Resolves the response body, or null after showing the error. */
  async function send(url: string, method: string, body?: unknown) {
    setBusy(true);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(t.errors[data.error as string] ?? t.errors.generic); return null; }
      router.refresh();
      return data as { noticeSent: boolean; code?: string; captured?: boolean };
    } catch {
      toast.error(t.errors.generic);
      return null;
    } finally {
      setBusy(false);
    }
  }
  const saved = (data: { noticeSent: boolean } | null) => {
    if (data) data.noticeSent ? toast.success(t.saved) : toast(t.savedNoNotice, { icon: "⚠️", duration: 8000 });
  };

  async function verify(n: PhoneView["numbers"][number]) {
    setCode(null);
    const data = await send(`${BASE}/numbers/${n.id}/verify`, "POST");
    if (data?.code) setCode({ who: label(n), code: data.code, captured: !!data.captured });
  }

  const warnings = [
    !view.configured ? t.notConfigured : view.mode === "capture" ? t.capture : view.mode === "allowlist" ? t.allowlist : null,
    view.voicemailReady ? null : t.noVoicemail,
  ].filter((w): w is string => !!w);
  const choices = view.numbers.filter((n) => n.verified && n.onBoard);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">{t.title}</h2>
        <p className="text-neutral-600 max-w-3xl">{t.intro}</p>
        {warnings.map((w) => (
          <p key={w} className="mt-3 flex gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{w}
          </p>
        ))}
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">{t.duty}</h3>
        {choices.length === 0 && <p className="text-sm text-neutral-600">{t.noneVerified}</p>}
        {view.options.map((o) => (
          <DutyCard
            key={`${o.key}:${o.numberId}:${JSON.stringify(o.hours)}`} option={o} locale={locale} canManage={canManage} busy={busy}
            choices={choices.map((n) => ({ id: n.id, label: label(n) }))}
            current={view.numbers.find((n) => n.id === o.numberId)}
            onDuty={async (numberId, who) => {
              if (!window.confirm(fill(t.confirmDuty, { option: o.label[locale], who }))) return;
              saved(await send(`${BASE}/duty`, "PUT", { option: o.key, numberId }));
            }}
            onHours={async (hours) => saved(await send(`${BASE}/hours`, "PUT", { option: o.key, hours }))}
          />
        ))}
      </section>

      {canManage && (
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">{t.numbers}</h3>
            <p className="text-sm text-neutral-600">{t.numbersIntro}</p>
          </div>
          {code && (
            <div role="status" className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
              <p>{code.captured ? t.codeCaptured : fill(t.codeTitle, { who: code.who })}</p>
              <p className="my-2 font-mono text-3xl tracking-[0.3em]">{code.code}</p>
              <p className="mb-3">{t.codeNote}</p>
              <button type="button" className={button} onClick={() => { setCode(null); router.refresh(); }}>{t.refresh}</button>
            </div>
          )}
          <div className={card}>
            {view.numbers.length === 0 && <p className="text-sm text-neutral-500">{t.empty}</p>}
            <ul className="divide-y divide-neutral-100">
              {view.numbers.map((n) => (
                <li key={n.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="min-w-[14rem] flex-1 font-medium text-neutral-900">{label(n)}</span>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${n.verified ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-600"}`}>{n.verified ? t.verified : t.unverified}</span>
                  {!n.onBoard && <span className="text-xs text-amber-800">{t.leftBoard}</span>}
                  <button type="button" className={button} disabled={busy || !n.onBoard} onClick={() => verify(n)}>{n.verified ? t.verifyAgain : t.verify}</button>
                  <button type="button" className="text-sm text-red-700 hover:underline disabled:opacity-40" disabled={busy}
                    onClick={async () => { if (window.confirm(fill(t.confirmRemove, { who: label(n) }))) saved(await send(`${BASE}/numbers/${n.id}`, "DELETE")); }}>
                    {t.remove}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <AddNumber people={view.people} locale={locale} busy={busy} onAdd={async (ownerId, number) => {
            const data = await send(BASE, "POST", { ownerId, number });
            saved(data);
            return !!data;
          }} />
        </section>
      )}
    </div>
  );
}

function DutyCard({ option, locale, canManage, busy, choices, current, onDuty, onHours }: {
  option: Option; locale: Lang; canManage: boolean; busy: boolean; choices: { id: string; label: string }[]; current?: PhoneView["numbers"][number];
  onDuty: (numberId: string | null, who: string) => void; onHours: (hours: Option["hours"]) => void;
}) {
  const t = T[locale];
  const [value, setValue] = useState(option.numberId ?? "");
  const [limited, setLimited] = useState(!!option.hours);
  const [days, setDays] = useState<number[]>(option.hours?.days ?? [1, 2, 3, 4, 5]);
  const [start, setStart] = useState(option.hours?.start ?? "09:00");
  const [end, setEnd] = useState(option.hours?.end ?? "17:00");
  const dirty = value !== (option.numberId ?? "");
  // a current number that can no longer be chosen (unverified, or its owner left the board) is still shown
  const stale = current && !choices.some((c) => c.id === current.id) ? { id: current.id, label: `${current.owner} ${current.masked}` } : null;

  return (
    <div className={card}>
      <div className="flex flex-wrap items-center gap-3">
        <h4 className="min-w-[12rem] flex-1 font-semibold text-neutral-900">{option.label[locale]}</h4>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${option.ringsNow ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{option.ringsNow ? t.ringsNow : t.notRinging}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select aria-label={`${t.duty}: ${option.label[locale]}`} className={`${input} min-w-[16rem]`} value={value} onChange={(e) => setValue(e.target.value)}>
          {canManage ? <option value="">{t.nobody}</option> : !option.numberId && <option value="">{t.choose}</option>}
          {stale && <option value={stale.id} disabled>{stale.label}</option>}
          {choices.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button type="button" className={primaryButton} disabled={busy || !dirty || (!canManage && !value)}
          onClick={() => onDuty(value || null, choices.find((c) => c.id === value)?.label ?? t.nobody)}>
          {t.save}
        </button>
      </div>

      <div className="mt-4 border-t border-neutral-100 pt-3 text-sm text-neutral-700">
        <p className="font-medium">{t.hours}</p>
        {!canManage ? (
          <p className="mt-1">{option.hours ? `${option.hours.days.map((d) => t.days[d]).join(", ")} · ${option.hours.start}–${option.hours.end}` : t.anyTime}</p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2"><input type="checkbox" checked={!limited} onChange={(e) => setLimited(!e.target.checked)} />{t.anyTime}</label>
            {limited && (
              <>
                <fieldset className="flex flex-wrap gap-2">
                  <legend className="sr-only">{t.hours}</legend>
                  {t.days.map((d, i) => (
                    <label key={d} className="flex items-center gap-1">
                      <input type="checkbox" checked={days.includes(i)} onChange={() => setDays((v) => (v.includes(i) ? v.filter((x) => x !== i) : [...v, i].sort()))} />{d}
                    </label>
                  ))}
                </fieldset>
                <label className="flex items-center gap-2">{t.from}<input type="time" className={input} value={start} onChange={(e) => setStart(e.target.value)} /></label>
                <label className="flex items-center gap-2">{t.to}<input type="time" className={input} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
              </>
            )}
            <button type="button" className={button} disabled={busy} onClick={() => onHours(limited ? { days, start, end } : null)}>{t.saveHours}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AddNumber({ people, locale, busy, onAdd }: { people: PhoneView["people"]; locale: Lang; busy: boolean; onAdd: (ownerId: string, number: string) => Promise<boolean> }) {
  const t = T[locale];
  const [ownerId, setOwnerId] = useState("");
  const [number, setNumber] = useState("");
  return (
    <form className={`${card} flex flex-wrap items-end gap-3`} onSubmit={async (e) => {
      e.preventDefault();
      if (await onAdd(ownerId, number)) { setOwnerId(""); setNumber(""); } // the typed number is not kept on screen
    }}>
      <p className="w-full font-semibold text-neutral-900">{t.add}</p>
      <label className="text-sm text-neutral-700">{t.person}
        <select className={`${input} mt-1 block min-w-[14rem]`} value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required>
          <option value="">{t.pick}</option>
          {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label className="text-sm text-neutral-700">{t.number}
        <input type="tel" autoComplete="off" className={`${input} mt-1 block w-52`} value={number} onChange={(e) => setNumber(e.target.value)} required maxLength={20} />
      </label>
      <button type="submit" className={primaryButton} disabled={busy || !ownerId || !number.trim()}>{t.addButton}</button>
    </form>
  );
}
