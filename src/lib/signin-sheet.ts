/**
 * Pure layout logic for the printable sign-in sheet (unit-testable, no DB).
 * Rows are split into Letter-size pages by a weight budget so every page can say "Page X of N".
 */
export type SheetPerson = { name: string; relationship: string | null; noPhotos: boolean };
/** One household: the primary's name, each listed person (first name, relationship, NO PHOTOS), and a guest count. */
export type SheetAttendee = { lastName: string; firstName: string; partySize: number; people: SheetPerson[]; guests: number };
export type SheetItem =
  | { kind: "attendee"; row: SheetAttendee }
  | { kind: "walkinHeading" }
  | { kind: "walkin" };

/** Weight units are "one attendee row" (0.4in). Page 1 carries the lockup + event block, so it holds less. */
export const FIRST_PAGE_CAPACITY = 16;
export const NEXT_PAGE_CAPACITY = 21;
const WEIGHT = { attendee: 1, walkinHeading: 1.6, walkin: 1.5 } as const;
/** A household is a header line plus one line per person (and one for guests). */
export const householdWeight = (a: SheetAttendee) => 0.9 + Math.max(1, a.people.length) + (a.guests > 0 ? 1 : 0);
const weightOf = (it: SheetItem) => (it.kind === "attendee" ? householdWeight(it.row) : WEIGHT[it.kind]);
export const WALKIN_ROWS = 12;

export function sortByLastName(rows: SheetAttendee[]): SheetAttendee[] {
  return [...rows].sort(
    (a, b) =>
      a.lastName.localeCompare(b.lastName, "en", { sensitivity: "base" }) ||
      a.firstName.localeCompare(b.firstName, "en", { sensitivity: "base" }),
  );
}

export function paginate(attendees: SheetAttendee[], walkins = WALKIN_ROWS): SheetItem[][] {
  const items: SheetItem[] = [
    ...sortByLastName(attendees).map((row) => ({ kind: "attendee", row }) as SheetItem),
    { kind: "walkinHeading" },
    ...Array.from({ length: walkins }, () => ({ kind: "walkin" }) as SheetItem),
  ];
  const pages: SheetItem[][] = [[]];
  let used = 0;
  let cap = FIRST_PAGE_CAPACITY;
  for (const it of items) {
    const w = weightOf(it);
    // the walk-in section is kept together: heading plus ALL its rows must fit, else it starts a new page
    const needs = it.kind === "walkinHeading" ? w + WEIGHT.walkin * walkins : w;
    if (used + needs > cap && (pages[pages.length - 1].length > 0 || it.kind === "walkinHeading")) {
      pages.push([]);
      used = 0;
      cap = NEXT_PAGE_CAPACITY;
    }
    pages[pages.length - 1].push(it);
    used += w;
  }
  return pages;
}
