"use client";

export type SponsorOption = { id: string; name: string };

/**
 * Multi-select of the ACTIVE sponsors from Sanity (fetched server-side and passed in).
 * Already-chosen ids that are no longer active (or not found) stay listed and checked, so saving the form never
 * silently drops them; the public page just skips them.
 */
export default function SponsorPicker({
  options,
  value,
  onChange,
}: {
  options: SponsorOption[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const known = new Set(options.map((o) => o.id));
  const stale = value.filter((id) => !known.has(id));
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  if (options.length === 0 && stale.length === 0) {
    return <p className="text-sm text-neutral-500">No active sponsors yet. Add them in the Studio under Sponsors.</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((o) => (
        <label key={o.id} className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200 hover:border-primary-200 cursor-pointer text-sm text-neutral-700">
          <input type="checkbox" checked={value.includes(o.id)} onChange={() => toggle(o.id)} className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary" />
          {o.name}
        </label>
      ))}
      {stale.map((id) => (
        <label key={id} className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-neutral-300 cursor-pointer text-sm text-neutral-500">
          <input type="checkbox" checked onChange={() => toggle(id)} className="w-4 h-4 rounded border-neutral-300" />
          <span>Inactive or removed sponsor <span className="text-xs">({id.slice(0, 8)}…)</span> — not shown publicly</span>
        </label>
      ))}
    </div>
  );
}
