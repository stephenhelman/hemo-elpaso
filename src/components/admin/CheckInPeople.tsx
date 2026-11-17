"use client";

import { Undo2 } from "lucide-react";
import { MAX_HEADCOUNT } from "@/lib/checkin-constants";
import { relationshipLabels, ageGroupLabels, type AgeGroup, type Relationship } from "@/lib/households/constants";

export interface CheckInPerson {
  attendeeId: string;
  name: string;
  relationship: string | null;
  ageGroup: string | null;
  isPrimary: boolean;
  checkedIn: boolean;
  noPhotos: boolean;
}
export interface CheckInSelection { attendeeIds: string[]; guests: number }

/** Everyone not yet in, plus the RSVP's guests. */
export const defaultCheckInSelection = (people: CheckInPerson[], guestCount: number, guestsCheckedIn: number): CheckInSelection => ({
  attendeeIds: people.filter((p) => !p.checkedIn).map((p) => p.attendeeId),
  guests: guestsCheckedIn > 0 ? guestsCheckedIn : guestCount,
});

export const checkInHeadcount = (people: CheckInPerson[], sel: CheckInSelection) =>
  new Set([...people.filter((p) => p.checkedIn).map((p) => p.attendeeId), ...sel.attendeeIds]).size + sel.guests;

/**
 * Per-person check-in checklist: a checkbox per person (checked by default), a
 * NO PHOTOS badge per person, and the "+N guests" count to confirm. People
 * already in show "here" with a per-person Undo. First names only.
 */
export default function CheckInPeople({
  people, guestCount, value, onChange, onUndo, busy,
}: {
  people: CheckInPerson[];
  guestCount: number;
  value: CheckInSelection;
  onChange: (v: CheckInSelection) => void;
  onUndo?: (attendeeId: string) => void;
  busy?: boolean;
}) {
  const toggle = (id: string) =>
    onChange({ ...value, attendeeIds: value.attendeeIds.includes(id) ? value.attendeeIds.filter((x) => x !== id) : [...value.attendeeIds, id] });
  return (
    <ul className="space-y-1.5">
      {people.map((p) => (
        <li key={p.attendeeId} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox" className="w-5 h-5"
            checked={p.checkedIn || value.attendeeIds.includes(p.attendeeId)}
            disabled={p.checkedIn}
            onChange={() => toggle(p.attendeeId)}
            aria-label={p.name}
          />
          <span className="font-medium text-neutral-900">{p.name}</span>
          {p.relationship && (
            <span className="text-neutral-400">
              {relationshipLabels[p.relationship as Relationship]?.en ?? p.relationship}
              {p.ageGroup ? ` · ${ageGroupLabels[p.ageGroup as AgeGroup]?.en ?? p.ageGroup}` : ""}
            </span>
          )}
          {p.noPhotos && <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white">NO PHOTOS</span>}
          {p.checkedIn && (
            <>
              <span className="text-green-700 text-xs font-semibold">✔ here</span>
              {onUndo && (
                <button type="button" disabled={busy} onClick={() => onUndo(p.attendeeId)} className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:underline disabled:opacity-50">
                  <Undo2 className="w-3 h-3" /> Undo
                </button>
              )}
            </>
          )}
        </li>
      ))}
      {(guestCount > 0 || value.guests > 0) && (
        <li className="flex items-center gap-2 text-sm">
          <span className="font-medium text-neutral-900">+{guestCount} guests (RSVP)</span>
          <label className="flex items-center gap-1 text-neutral-600">
            here:
            <input
              type="number" min={0} max={MAX_HEADCOUNT} value={value.guests}
              onChange={(e) => onChange({ ...value, guests: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
              className="w-16 px-2 py-1 border border-neutral-300 rounded text-center"
            />
          </label>
        </li>
      )}
    </ul>
  );
}
