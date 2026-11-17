"use client";

import { AGE_GROUPS, ageGroupLabels } from "@/lib/households/constants";

/** Event age-group targeting. Empty = any age. Values match HouseholdMember.ageGroup. */
export default function AgeGroupPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {AGE_GROUPS.map((a) => (
        <button
          key={a}
          type="button"
          aria-pressed={value.includes(a)}
          onClick={() => onChange(value.includes(a) ? value.filter((x) => x !== a) : [...value, a])}
          className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
            value.includes(a)
              ? "border-primary bg-primary-50 text-primary"
              : "border-neutral-200 hover:border-primary-200"
          }`}
        >
          {ageGroupLabels[a].en}
        </button>
      ))}
    </div>
  );
}
