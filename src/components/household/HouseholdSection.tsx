"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  AGE_GROUPS,
  MAX_HOUSEHOLD_SIZE,
  RELATIONSHIPS,
  ageGroupLabels,
  isAdultGroup,
  relationshipLabels,
} from "@/lib/households/constants";
import { DIAGNOSIS_VALUES, diagnosisLabels } from "@/lib/patients/diagnoses";
import { householdTranslation } from "@/translation/household";

export interface MemberDraft {
  firstName: string;
  lastName: string;
  relationship: string;
  ageGroup: string;
  email: string;
  confirmByPhone: boolean;
  diagnoses: string[];
}

export const blankMember = (): MemberDraft => ({
  firstName: "", lastName: "", relationship: "", ageGroup: "", email: "", confirmByPhone: false, diagnoses: [],
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors the server rules (lib/households/members.ts); the server is the authority. */
export function memberComplete(m: MemberDraft): boolean {
  if (!m.firstName.trim() || !m.relationship || !m.ageGroup) return false;
  if (isAdultGroup(m.ageGroup)) return m.confirmByPhone || EMAIL_RE.test(m.email.trim());
  return true;
}
export const householdComplete = (members: MemberDraft[]) => members.every(memberComplete);

/** What the API receives. Diagnoses only for minors; adults never carry any. */
export function membersPayload(members: MemberDraft[], includeDx = true) {
  return members.map((m) => ({
    firstName: m.firstName,
    lastName: m.lastName,
    relationship: m.relationship,
    ageGroup: m.ageGroup,
    email: isAdultGroup(m.ageGroup) && !m.confirmByPhone ? m.email : "",
    confirmByPhone: isAdultGroup(m.ageGroup) && m.confirmByPhone,
    diagnoses: !isAdultGroup(m.ageGroup) && includeDx ? m.diagnoses : [],
  }));
}

const input =
  "w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";

/**
 * Household size select + member slots, kept in sync: choosing N renders N-1
 * slots; Add/Remove updates the number. `showDiagnoses` is false for board users
 * without canViewPHI (they cannot enter health information).
 */
export default function HouseholdSection({
  locale,
  members,
  onChange,
  showDiagnoses = true,
}: {
  locale: "en" | "es";
  members: MemberDraft[];
  onChange: (m: MemberDraft[]) => void;
  showDiagnoses?: boolean;
}) {
  const t = householdTranslation[locale];
  const size = members.length + 1;

  const resize = (n: number) => {
    const want = Math.min(MAX_HOUSEHOLD_SIZE, Math.max(1, n)) - 1;
    onChange(
      want >= members.length
        ? [...members, ...Array.from({ length: want - members.length }, blankMember)]
        : members.slice(0, want),
    );
  };
  const patch = (i: number, p: Partial<MemberDraft>) =>
    onChange(members.map((m, j) => (j === i ? { ...m, ...p } : m)));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5" htmlFor="household-size">
          {t.householdSize} *
        </label>
        <select
          id="household-size"
          className={input}
          value={size}
          onChange={(e) => resize(Number(e.target.value))}
        >
          {Array.from({ length: MAX_HOUSEHOLD_SIZE }, (_, k) => k + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {members.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-neutral-700">{t.membersHeading}</h3>
            <p className="text-xs text-neutral-500">{t.membersHint}</p>
          </div>
          {members.map((m, i) => {
            const adult = isAdultGroup(m.ageGroup);
            const minor = m.ageGroup !== "" && !adult;
            return (
              <fieldset key={i} className="rounded-xl border border-neutral-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <legend className="text-sm font-semibold text-neutral-800">{t.memberN(i + 1)}</legend>
                  <button
                    type="button"
                    onClick={() => onChange(members.filter((_, j) => j !== i))}
                    className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-red-600"
                    aria-label={`${t.remove} ${t.memberN(i + 1)}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {t.remove}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">{t.firstName} *</label>
                    <input className={input} value={m.firstName} maxLength={100}
                      onChange={(e) => patch(i, { firstName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      {t.lastName} <span className="text-neutral-400">({t.optional})</span>
                    </label>
                    <input className={input} value={m.lastName} maxLength={100}
                      onChange={(e) => patch(i, { lastName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">{t.relationship} *</label>
                    <select className={input} value={m.relationship}
                      onChange={(e) => patch(i, { relationship: e.target.value })}>
                      <option value="">{t.choose}</option>
                      {RELATIONSHIPS.map((r) => (
                        <option key={r} value={r}>{relationshipLabels[r][locale]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">{t.ageGroup} *</label>
                    <select className={input} value={m.ageGroup}
                      onChange={(e) =>
                        patch(i, {
                          ageGroup: e.target.value,
                          // never carry health info across an age change to adult
                          ...(isAdultGroup(e.target.value) ? { diagnoses: [] } : { email: "", confirmByPhone: false }),
                        })
                      }>
                      <option value="">{t.choose}</option>
                      {AGE_GROUPS.map((a) => (
                        <option key={a} value={a}>{ageGroupLabels[a][locale]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {adult && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">{t.email} *</label>
                      <input type="email" className={`${input} disabled:bg-neutral-100`} value={m.email}
                        disabled={m.confirmByPhone} maxLength={254}
                        onChange={(e) => patch(i, { email: e.target.value })} />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-neutral-700">
                      <input type="checkbox" checked={m.confirmByPhone}
                        onChange={(e) => patch(i, { confirmByPhone: e.target.checked, email: e.target.checked ? "" : m.email })} />
                      {t.noEmail}
                    </label>
                    <p className="text-xs text-neutral-500">{t.adultNote}</p>
                    {!memberComplete(m) && m.firstName && m.relationship && (
                      <p className="text-xs text-red-600">{t.adultNeedsContact}</p>
                    )}
                  </div>
                )}

                {minor && showDiagnoses && (
                  <div>
                    <p className="text-xs font-medium text-neutral-600 mb-1">{t.minorDx}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DIAGNOSIS_VALUES.map((d) => (
                        <label key={d} className="flex items-center gap-2 text-sm text-neutral-700 p-2 rounded-lg border border-neutral-200">
                          <input type="checkbox" checked={m.diagnoses.includes(d)}
                            onChange={() =>
                              patch(i, { diagnoses: m.diagnoses.includes(d) ? m.diagnoses.filter((x) => x !== d) : [...m.diagnoses, d] })
                            } />
                          {diagnosisLabels[d][locale]}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>
      )}

      {size < MAX_HOUSEHOLD_SIZE && (
        <button
          type="button"
          onClick={() => onChange([...members, blankMember()])}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Plus className="w-4 h-4" /> {t.add}
        </button>
      )}
      {!householdComplete(members) && <p className="text-xs text-amber-700">{t.incomplete}</p>}
    </div>
  );
}
