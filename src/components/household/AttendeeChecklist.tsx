"use client";

import { ageGroupLabels, relationshipLabels, type AgeGroup, type Relationship } from "@/lib/households/constants";
import { householdTranslation } from "@/translation/household";

export interface AttendeeOption {
  id: string;
  label: string; // first name
  relationship: string;
  ageGroup: string;
  /** "pending" adults get the "hasn't confirmed yet" note */
  status: string;
}
export interface AttendeeState { primary: boolean; memberIds: string[]; guests: number }

export const MAX_GUESTS_UI = 10;

export const attendeeTotal = (s: AttendeeState) => (s.primary ? 1 : 0) + s.memberIds.length + s.guests;
export const attendeesValid = (s: AttendeeState) => attendeeTotal(s) >= 1;

/** Everyone checked, no guests. */
export const allChecked = (opts: AttendeeOption[]): AttendeeState => ({ primary: true, memberIds: opts.map((o) => o.id), guests: 0 });

/** Names, relationship and age group only. Never diagnoses. */
export default function AttendeeChecklist({
  locale,
  primaryName,
  options,
  value,
  onChange,
}: {
  locale: "en" | "es";
  primaryName: string;
  options: AttendeeOption[];
  value: AttendeeState;
  onChange: (v: AttendeeState) => void;
}) {
  const t = householdTranslation[locale];
  const toggle = (id: string) =>
    onChange({ ...value, memberIds: value.memberIds.includes(id) ? value.memberIds.filter((x) => x !== id) : [...value.memberIds, id] });
  const row = "flex items-center gap-2 text-sm text-neutral-700 p-2 rounded-lg border border-neutral-200";
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-neutral-700">{t.attendeesTitle}</legend>
      <p className="text-xs text-neutral-500">{t.attendeesHint}</p>
      <label className={row}>
        <input type="checkbox" checked={value.primary} onChange={(e) => onChange({ ...value, primary: e.target.checked })} />
        {t.youLabel(primaryName)}
      </label>
      {options.map((o) => (
        <label key={o.id} className={row}>
          <input type="checkbox" checked={value.memberIds.includes(o.id)} onChange={() => toggle(o.id)} />
          <span>
            {o.label || "—"}{" "}
            <span className="text-neutral-400">
              · {relationshipLabels[o.relationship as Relationship]?.[locale] ?? o.relationship} · {ageGroupLabels[o.ageGroup as AgeGroup]?.[locale] ?? o.ageGroup}
            </span>
            {o.status === "pending" && <em className="ml-2 text-xs text-amber-700 not-italic">({t.notConfirmedYet})</em>}
          </span>
        </label>
      ))}
      <div className="pt-1">
        <label className="block text-sm font-medium text-neutral-700 mb-1">{t.guestsLabel}</label>
        <input
          type="number" min={0} max={MAX_GUESTS_UI} value={value.guests}
          onChange={(e) => onChange({ ...value, guests: Math.min(MAX_GUESTS_UI, Math.max(0, Math.floor(Number(e.target.value) || 0))) })}
          className="w-24 px-3 py-2 border border-neutral-300 rounded-lg text-sm"
        />
        <p className="text-xs text-neutral-500 mt-1">{t.guestsHint}</p>
      </div>
      <p className={`text-sm font-medium ${attendeesValid(value) ? "text-neutral-700" : "text-red-600"}`}>
        {attendeesValid(value) ? t.attendeesTotal(attendeeTotal(value)) : t.attendeesNone}
      </p>
    </fieldset>
  );
}
