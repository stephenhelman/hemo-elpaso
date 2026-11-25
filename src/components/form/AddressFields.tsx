"use client";

import { useEffect, useRef, useState } from "react";
import { addressTranslation } from "@/translation/address";
import { US_STATES, DEFAULT_STATE } from "@/lib/address/states";
import { lookupZip } from "@/lib/address/zip";
import { addressFromPlace, newSessionToken, suggest, type Suggestion } from "@/lib/address/google";
import type { Lang } from "@/types";

import type { AddressDraft } from "@/lib/address/draft";

const input = "w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";

/**
 * Structured US address: street, line 2 (optional), city, state (TX by default), 5-digit ZIP.
 * ZIP autofill uses the bundled table (no network call). Google suggestions exist only when `autocomplete` is true (the
 * `address_autocomplete` toggle, decided on the server): the Google script is NOT on the page until the person focuses
 * the street field and types.
 */
export default function AddressFields({
  value, onChange, locale, autocomplete = false, invalidField, unstructuredNote = false, inputClassName = input,
}: {
  value: AddressDraft;
  onChange: (v: AddressDraft) => void;
  locale: Lang;
  autocomplete?: boolean;
  invalidField?: string | null;
  /** Show "the address on file was one line, please re-enter" (editing a legacy address). */
  unstructuredNote?: boolean;
  inputClassName?: string;
}) {
  const t = addressTranslation[locale];
  const valueRef = useRef(value);
  valueRef.current = value;
  const lastAuto = useRef<{ city: string; state: string } | null>(null); // what ZIP autofill last wrote
  const [focused, setFocused] = useState(false); // the Google script may load only after this
  const [options, setOptions] = useState<Suggestion[]>([]);
  const token = useRef<unknown>(null);
  const seq = useRef(0);

  const patch = (p: Partial<AddressDraft>) => onChange({ ...valueRef.current, ...p });

  const onZip = async (raw: string) => {
    const zip = raw.replace(/\D/g, "").slice(0, 5);
    patch({ zip });
    if (zip.length !== 5) return;
    const hit = await lookupZip(zip);
    if (!hit) return;
    const cur = valueRef.current;
    // Do not overwrite a city/state the person typed themselves.
    const untouched = !cur.city || (lastAuto.current && cur.city === lastAuto.current.city && cur.state === lastAuto.current.state);
    if (untouched) { lastAuto.current = hit; onChange({ ...cur, zip, city: hit.city, state: hit.state }); }
  };

  // Suggestions: only after focus, only when the toggle is on, debounced, 3+ characters.
  useEffect(() => {
    if (!autocomplete || !focused || value.line1.trim().length < 3) { setOptions([]); return; }
    const mine = ++seq.current;
    const h = setTimeout(async () => {
      try {
        token.current ??= await newSessionToken();
        const s = await suggest(value.line1, token.current);
        if (mine === seq.current) setOptions(s);
      } catch { if (mine === seq.current) setOptions([]); }
    }, 250);
    return () => clearTimeout(h);
  }, [autocomplete, focused, value.line1]);

  const pick = async (s: Suggestion) => {
    setOptions([]);
    try {
      const a = await addressFromPlace(s.place);
      token.current = null; // the session ends with the selection
      if (a) { lastAuto.current = null; onChange({ line1: a.line1, line2: a.line2 ?? valueRef.current.line2, city: a.city, state: a.state || DEFAULT_STATE, zip: a.zip }); }
    } catch { /* keep what the person typed */ }
  };

  const err = (f: string) => (invalidField === f ? "border-red-500" : "");
  const label = "block text-sm font-medium text-neutral-700 mb-1.5";
  return (
    <div className="space-y-3">
      {unstructuredNote && <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{t.unstructuredNote}</p>}
      <div className="relative">
        <label className={label}>{t.line1}</label>
        <input
          className={`${inputClassName} ${err("addressLine1")}`} value={value.line1} maxLength={200} autoComplete="address-line1"
          onFocus={() => setFocused(true)} onChange={(e) => patch({ line1: e.target.value })}
        />
        {options.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg" role="listbox">
            {options.map((o) => (
              <li key={o.text}>
                <button type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)}>{o.text}</button>
              </li>
            ))}
          </ul>
        )}
        {autocomplete && <p className="text-xs text-neutral-500 mt-1">{t.suggestionsFromGoogle}</p>}
      </div>
      <div>
        <label className={label}>{t.line2} <span className="text-neutral-400">({t.line2Hint})</span></label>
        <input className={inputClassName} value={value.line2} maxLength={100} autoComplete="address-line2" onChange={(e) => patch({ line2: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
        <div className="sm:col-span-2">
          <label className={label}>{t.zip}</label>
          <input className={`${inputClassName} ${err("zip")}`} value={value.zip} inputMode="numeric" maxLength={5} autoComplete="postal-code" onChange={(e) => onZip(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>{t.city}</label>
          <input className={`${inputClassName} ${err("city")}`} value={value.city} maxLength={100} autoComplete="address-level2" onChange={(e) => patch({ city: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>{t.state}</label>
          <select className={`${inputClassName} ${err("state")}`} value={value.state} autoComplete="address-level1" onChange={(e) => patch({ state: e.target.value })}>
            {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <p className="text-xs text-neutral-500">{t.zipHint} {t.usOnly}</p>
      {invalidField && t.errors[invalidField] && <p className="text-sm text-red-600" role="alert">{t.errors[invalidField]}</p>}
    </div>
  );
}
